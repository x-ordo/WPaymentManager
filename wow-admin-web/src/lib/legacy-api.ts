import "server-only";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./session";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";
const BASE_URL = process.env.LEGACY_API_BASE_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;

async function getSessionInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !AUTH_SECRET) return null;
  return await verifySessionToken(token, AUTH_SECRET);
}

export async function getCachedUserName(): Promise<string> {
  const session = await getSessionInfo();
  return session?.userName || "Guest";
}

export async function getCachedUserClass(): Promise<string | null> {
  const session = await getSessionInfo();
  return session?.userClass || null;
}

function getMockResponse(path: string): any {
  if (path === "/10100") return { code: "1", message: "성공", connectionid: "mock_123", _IN_NAME: "구수연", _MONEY: "7170", _APROVALUE: "19", _CLASS: "100" };
  if (path === "/90000") return { code: "1", _MONEY: "7170", _APROVALUE: "19", _COMMISION_PERIN: "0.3", _COMMISION_PEROUT: "0", _COMMISION_IN: "800", _COMMISION_OUT: "1000" };
  if (path === "/90100") return { code: "1", _MINSENDMONEY: "10000", _MAXSENDMONEY: "2000000" };
  return { code: "1", message: "성공", data: [] };
}

export async function authenticateLegacy(id: string, pass: string): Promise<any> {
  if (USE_MOCK) return getMockResponse("/10100");
  const searchParams = new URLSearchParams({ id, pass });
  const response = await fetch(`${BASE_URL}/10100?${searchParams.toString()}`, { cache: "no-store" });
  return await response.json();
}

export async function fetchLegacy(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  if (USE_MOCK) return getMockResponse(path);

  const session = await getSessionInfo();
  if (!session && path !== "/10100") return { code: "402", message: "세션이 유효하지 않습니다." };

  // 규격서 준수: 모든 요청에 id, pass, connectionid 필수 포함
  const requestParams = new URLSearchParams({
    id: session?.userId || params.id || "",
    pass: session?.pass || params.pass || "",
    connectionid: session?.connectionId || params.connectionid || "",
    ...params,
  });

  const url = `${BASE_URL}${path}?${requestParams.toString()}`;

  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const data = await res.json();
    return data;
  } catch (error) {
    return { code: "500", message: "서버 통신 실패" };
  }
}
