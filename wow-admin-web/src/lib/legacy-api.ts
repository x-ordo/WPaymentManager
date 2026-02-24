import "server-only";

const BASE_URL = process.env.LEGACY_API_BASE_URL || "http://127.0.0.1:33552";
const ADMIN_ID = process.env.LEGACY_ADMIN_ID || "master";
const ADMIN_PASS = process.env.LEGACY_ADMIN_PASS || "649005";
const USE_MOCK = process.env.USE_MOCK_DATA === "true";

let globalConnectionId: string | null = null;
let authPromise: Promise<void> | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getMockResponse(path: string): any {
  if (path === "/10100") return { code: "1", message: "성공", connectionid: "mock_123", _IN_NAME: "구수연", _MONEY: "7170", _APROVALUE: "19" };
  if (path === "/90000") return { code: "1", _MONEY: "7170", _APROVALUE: "19", _COMMISION_PERIN: "0.3", _COMMISION_PEROUT: "0", _COMMISION_IN: "800", _COMMISION_OUT: "1000" };
  if (path === "/90100") return { code: "1", _MINSENDMONEY: "10000", _MAXSENDMONEY: "2000000" };
  
  const createMockList = (fields: any) => ({
    code: "1",
    message: "성공",
    data: Array.from({ length: 15 }).map((_, i) => ({
      _UNIQUEID: `${1000 + i}`,
      _CREATE_DATETIME: "2026-02-23 11:30:00",
      _AFFILIATE_ID: "테스트가맹점",
      ...fields(i)
    }))
  });

  if (path === "/21000") return createMockList((i: number) => ({ _ORDERNM: `입금자${i}`, _ORDERAMT: "50000", _ORDERBANKCD: "004", _ORDERACC: "1234567890", _RESULTCODE: i % 3 === 0 ? "0000" : "0001" }));
  if (path === "/30000") return createMockList((i: number) => ({ _NAME: `수취인${i}`, _MONEY: "20000", _ORDERNUMBER: `ORD-${i}`, _BANKCODE: "088", _BANKNUMBER: "110-123-456789", _TEL: "010-1111-2222", _USE: i % 5 === 0 ? "False" : "True", _RETURNMSG: "정상" }));
  if (path === "/40000") return createMockList((i: number) => ({ _SERVICE_ID: "M12345", _ORDER_ID: `PG-${i}`, _TR_ID: `TRX-${i}`, _RESPONSE_CODE: "0000", _RESPONSE_MESSAGE: "성공", _AMOUNT: "10000", _IN_BANK_CODE: "020", _IN_BANK_USERNAME: `입금주${i}`, _STATE: "1" }));
  if (path === "/51000") return createMockList((i: number) => ({ _BANKNAME: "국민은행", _BANKNUMBER: "123-45-67890", _BANKUSER: `사용자${i}`, _MONEY: "100000", _STATE: i % 4 === 0 ? "1" : "0", _RETURNCODE: "0", _RETURNMSG: "성공", _SHOP_STATE: "0", _ADMIN_STATE: "0" }));
  if (path === "/51100") return createMockList((i: number) => ({ _BANKNAME: "신한은행", _BANKNUMBER: "110-444-555555", _BANKUSER: "홍길동", _MONEY: "50000", _PHONE: "01012345678", _CREATEDATE: "2026-01-01" }));

  return { code: "1", message: "성공" };
}

async function authenticate(): Promise<void> {
  if (USE_MOCK) { globalConnectionId = "mock_session"; return; }
  if (authPromise) return authPromise;
  authPromise = (async () => {
    const searchParams = new URLSearchParams({ id: ADMIN_ID, pass: ADMIN_PASS });
    try {
      const res = await fetch(`${BASE_URL}/10100?${searchParams.toString()}`);
      const data = await res.json();
      if (data.code === "1" && data.connectionid) globalConnectionId = data.connectionid;
      else throw new Error(`로그인 실패: ${data.message}`);
    } finally { authPromise = null; }
  })();
  return authPromise;
}

export async function fetchLegacy(path: string, params: Record<string, any> = {}, retryCount = 0): Promise<any> {
  if (USE_MOCK) { await delay(100); return getMockResponse(path); }
  if (!globalConnectionId && path !== "/10100") await authenticate();
  const requestParams = { id: ADMIN_ID, pass: ADMIN_PASS, connectionid: globalConnectionId || "", ...params };
  const searchParams = new URLSearchParams(requestParams);
  try {
    const response = await fetch(`${BASE_URL}${path}?${searchParams.toString()}`, { method: "GET", cache: "no-store" });
    const data = await response.json();
    switch (data.code) {
      case "1": return data;
      case "401": if (retryCount >= 2) throw new Error("401 재시도 초과"); await delay(5100); return fetchLegacy(path, params, retryCount + 1);
      case "402": globalConnectionId = null; await authenticate(); return fetchLegacy(path, params, retryCount + 1);
      default: return data;
    }
  } catch (error: any) {
    console.error(`[API 통신 장애] ${path}`, error);
    return { code: "999", message: "서버 통신 실패" };
  }
}
