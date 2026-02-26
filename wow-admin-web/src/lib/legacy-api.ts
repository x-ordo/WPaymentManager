import "server-only";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./session";
import { LegacyBaseResponse } from "./types/legacy";

const BASE_URL = process.env.LEGACY_API_BASE_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;

/**
 * [안정성] 5초 쓰로틀링(401) 대응을 위한 지연 함수
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * [응집도] 현재 요청의 세션 및 사용자 인증 정보를 추출합니다.
 */
async function getAuthenticatedInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !AUTH_SECRET) return null;
  return await verifySessionToken(token, AUTH_SECRET);
}

/**
 * [레거시 연동] 실제 레거시 서버와 통신하는 핵심 메서드 (내부 전용)
 */
async function callLegacyInternal<T extends LegacyBaseResponse>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const auth = await getAuthenticatedInfo();
  
  // 규격서 준수: id, pass, connectionid를 쿼리스트링으로 자동 변환
  const query = new URLSearchParams({
    id: auth?.userId || params.id || "",
    pass: auth?.pass || params.pass || "",
    connectionid: auth?.connectionId || params.connectionid || "",
    ...params,
  }).toString();

  const url = `${BASE_URL}${path}?${query}`;

  try {
    const res = await fetch(url, { 
      method: "GET", 
      cache: "no-store", // [안정성] 금융 데이터이므로 캐싱 강제 비활성화
      signal: AbortSignal.timeout(10000), // [안정성] 10초 타임아웃 적용
    });

    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    
    const data = await res.json();
    return data as T;
  } catch (err: any) {
    // [안정성] 타임아웃 에러와 일반 네트워크 에러를 명확히 구분
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const timeoutError = { 
        code: "TIMEOUT", 
        message: "서버 응답 시간이 초과되었습니다. (10초)" 
      } as T;
      return timeoutError;
    }
    console.error(`[Legacy Fetch Failed] Path: ${path}`, err);
    throw err;
  }
}

/**
 * [유연성] 레거시 API 공통 호출 엔진 (재시도 로직 포함)
 * @param path API 경로 (예: /90000)
 * @param params 추가 파라미터
 * @param retryCount 내부 재시도 횟수
 */
export async function fetchLegacy<T extends LegacyBaseResponse>(
  path: string,
  params: Record<string, string> = {},
  retryCount = 0
): Promise<T> {
  try {
    const data = await callLegacyInternal<T>(path, params);

    /**
     * [에러 핸들링] 규격서(1.2)에 정의된 공통 응답 코드 처리
     */
    switch (data.code) {
      case "1": // 성공
      case "3": // 데이터 없음 (정상 범위)
        return data;

      case "401": // [안정성] 5초 쓰로틀링 대응
        if (retryCount < 2) {
          await delay(5100);
          return fetchLegacy(path, params, retryCount + 1);
        }
        return data;

      default: // 기타 오류 코드는 그대로 반환하여 호출부에서 처리
        return data;
    }
  } catch (error: any) {
    // [안정성] 네트워크 단절 및 타임아웃 예외 상황 시 표준 에러 객체 반환
    if (error.code === "TIMEOUT") return error;
    
    return { 
      code: "500", 
      message: "레거시 서버와 통신할 수 없습니다. (Network Error)" 
    } as T;
  }
}

/**
 * [응답 파싱] 로그인 인증 전용 (10100)
 */
export async function authenticateLegacy(id: string, pass: string): Promise<any> {
  const searchParams = new URLSearchParams({ id, pass });
  const response = await fetch(`${BASE_URL}/10100?${searchParams.toString()}`, { cache: "no-store" });
  return await response.json();
}

/** 
 * [응집도] 현재 로그인된 사용자 이름 반환 (세션 기반) 
 */
export async function getCachedUserName(): Promise<string> {
  const auth = await getAuthenticatedInfo();
  return auth?.userName || "Guest";
}

/** 
 * [응집도] 현재 로그인된 사용자 등급 반환 (세션 기반) 
 */
export async function getCachedUserClass(): Promise<string | null> {
  const auth = await getAuthenticatedInfo();
  return auth?.userClass || null;
}
