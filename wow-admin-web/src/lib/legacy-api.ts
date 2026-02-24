import "server-only";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

const BASE_URL = process.env.LEGACY_API_BASE_URL;
const ADMIN_ID = process.env.LEGACY_ADMIN_ID;
const ADMIN_PASS = process.env.LEGACY_ADMIN_PASS;

if (!USE_MOCK) {
  if (!BASE_URL || !ADMIN_ID || !ADMIN_PASS) {
    throw new Error(
      "필수 환경변수 누락: LEGACY_API_BASE_URL, LEGACY_ADMIN_ID, LEGACY_ADMIN_PASS"
    );
  }
  const parsed = new URL(BASE_URL);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("LEGACY_API_BASE_URL은 http 또는 https 프로토콜만 허용");
  }
}

if (USE_MOCK && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: USE_MOCK_DATA=true in production environment");
}

let globalConnectionId: string | null = null;
let cachedUserName: string | null = null;
let authPromise: Promise<void> | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 요청 직렬화 큐: 동시에 최대 1개 요청만 레거시 API에 전송
let requestQueue: Promise<void> = Promise.resolve();
const MAX_QUEUE_DEPTH = 50;
let queueDepth = 0;

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  if (queueDepth >= MAX_QUEUE_DEPTH) {
    return Promise.reject(new Error("요청 큐 초과"));
  }
  queueDepth++;
  const result = requestQueue.then(fn, fn);
  requestQueue = result.then(
    () => { queueDepth--; },
    () => { queueDepth--; }
  );
  return result;
}

// 중복 요청 제거: 동일 path+params 동시 호출 시 하나만 실행하고 결과 공유
const inflightRequests = new Map<string, Promise<unknown>>();

/** 로그인 시 캐싱된 사용자 이름 반환 */
export function getCachedUserName(): string {
  return cachedUserName || "Admin";
}

function getMockResponse(path: string): any {
  if (path === "/10100") return { code: "1", message: "성공", connectionid: "mock_123", _IN_NAME: "구수연", _MONEY: "7170", _APROVALUE: "19" };
  if (path === "/90000") return { code: "1", _MONEY: "7170", _APROVALUE: "19", _COMMISION_PERIN: "0.3", _COMMISION_PEROUT: "0", _COMMISION_IN: "800", _COMMISION_OUT: "1000" };
  if (path === "/90100") return { code: "1", _MINSENDMONEY: "10000", _MAXSENDMONEY: "2000000" };

  const createMockList = (fields: (i: number) => any) => ({
    code: "1",
    message: "성공",
    data: Array.from({ length: 15 }).map((_, i) => ({
      _UNIQUEID: `${1000 + i}`,
      _CREATE_DATETIME: "2026-02-23 11:30:00",
      _AFFILIATE_ID: "테스트가맹점",
      ...fields(i)
    }))
  });

  if (path === "/21000") return createMockList((i) => ({ _ORDERNM: `입금자${i}`, _ORDERAMT: "50000", _ORDERBANKCD: "004", _ORDERACC: "1234567890", _RESULTCODE: i % 3 === 0 ? "0000" : "0001" }));
  if (path === "/30000") return createMockList((i) => ({ _NAME: `수취인${i}`, _MONEY: "20000", _ORDERNUMBER: `ORD-${i}`, _BANKCODE: "088", _BANKNUMBER: "110-123-456789", _TEL: "010-1111-2222", _USE: i % 5 === 0 ? "False" : "True", _RETURNCODE: "0", _RETURNMSG: "정상" }));
  if (path === "/40000") return createMockList((i) => ({ _SERVICE_ID: "M12345", _ORDER_ID: `PG-${i}`, _TR_ID: `TRX-${i}`, _RESPONSE_CODE: "0000", _RESPONSE_MESSAGE: "성공", _AMOUNT: "10000", _IN_BANK_CODE: "020", _IN_BANK_USERNAME: `입금주${i}`, _STATE: "1" }));
  if (path === "/51000") return createMockList((i) => ({ _BANKCODE: "004", _BANKNAME: "국민은행", _BANKNUMBER: "123-45-67890", _BANKUSER: `사용자${i}`, _MONEY: "100000", _STATE: ["0", "1", "2", "3"][i % 4], _RETURNCODE: "0", _RETURNMSG: i % 4 === 2 ? "계좌오류" : "성공", _SHOP_STATE: "0", _ADMIN_STATE: "0" }));
  if (path === "/51100") return createMockList((i) => ({ _BANKCODE: "088", _BANKNAME: "신한은행", _BANKNUMBER: "110-444-555555", _BANKUSER: "홍길동", _MONEY: "50000", _PHONE: "01012345678", _CREATE_DATETIME: "2026-01-01" }));

  return { code: "1", message: "성공" };
}

async function authenticate(): Promise<void> {
  if (USE_MOCK) {
    globalConnectionId = "mock_session";
    cachedUserName = "구수연";
    return;
  }
  if (authPromise) return authPromise;
  authPromise = (async () => {
    const searchParams = new URLSearchParams({ id: ADMIN_ID!, pass: ADMIN_PASS! });
    try {
      const res = await fetch(`${BASE_URL!}/10100?${searchParams.toString()}`);
      const data = await res.json();
      if (data.code === "1" && data.connectionid) {
        globalConnectionId = data.connectionid;
        if (data._IN_NAME) cachedUserName = data._IN_NAME;
      } else {
        throw new Error(`로그인 실패: ${data.message}`);
      }
    } finally {
      authPromise = null;
    }
  })();
  return authPromise;
}

/**
 * 레거시 API 호출. 401(쓰로틀), 402(세션 만료) 자동 재시도.
 * 루프 기반 재시도로 enqueue 내 재귀 호출 교착 상태를 방지.
 */
const FETCH_TIMEOUT_MS = 15_000;
const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

export async function fetchLegacy(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  // Prototype pollution 방어
  for (const key of Object.keys(params)) {
    if (DANGEROUS_KEYS.includes(key)) {
      return { code: "999", message: "잘못된 요청 파라미터" };
    }
  }

  if (USE_MOCK) {
    await delay(100);
    return getMockResponse(path);
  }

  const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;

  // 중복 요청 제거: 동일 요청이 진행 중이면 결과 공유
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<any>;
  }

  const execute = async (): Promise<any> => {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (!globalConnectionId) await authenticate();

      const data = await enqueue(async () => {
        const requestParams = {
          id: ADMIN_ID!,
          pass: ADMIN_PASS!,
          connectionid: globalConnectionId || "",
          ...params,
        };
        const searchParams = new URLSearchParams(requestParams);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          const response = await fetch(
            `${BASE_URL!}${path}?${searchParams.toString()}`,
            { method: "GET", cache: "no-store", signal: controller.signal }
          );
          return await response.json();
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            console.error(`[API 타임아웃] ${path}`);
            return { code: "999", message: "요청 시간 초과" };
          }
          console.error(`[API 통신 장애] ${path}:`, error instanceof Error ? error.message : "Unknown error");
          return { code: "999", message: "서버 통신 실패" };
        } finally {
          clearTimeout(timeoutId);
        }
      });

      switch (data.code) {
        case "1":
          return data;
        case "401":
          if (attempt >= MAX_RETRIES)
            return { code: "999", message: "요청 제한 초과 (401)" };
          await delay(5100);
          continue;
        case "402":
          globalConnectionId = null;
          continue;
        default:
          return data;
      }
    }

    return { code: "999", message: "재시도 초과" };
  };

  const promise = execute();
  inflightRequests.set(cacheKey, promise);
  promise.finally(() => inflightRequests.delete(cacheKey));

  return promise;
}
