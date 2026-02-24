import "server-only";

import { cookies } from "next/headers";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET 환경변수가 설정되지 않았거나 32자 미만입니다.");
  }
  return secret;
}

/** 타이밍 공격 방지를 위한 constant-time 문자열 비교 */
function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) {
    // 길이 차이를 숨기기 위해 bufA로 더미 비교 수행
    let result = 1;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufA[i];
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/** AUTH_CREDENTIALS 환경변수 파싱: "user1:pass1,user2:pass2" */
function getCredentials(): Map<string, string> {
  const raw = process.env.AUTH_CREDENTIALS;
  if (!raw) throw new Error("AUTH_CREDENTIALS 환경변수가 설정되지 않았습니다.");

  const map = new Map<string, string>();
  for (const pair of raw.split(",")) {
    const trimmed = pair.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const user = trimmed.slice(0, colonIdx);
    const pass = trimmed.slice(colonIdx + 1);
    if (user && pass) map.set(user, pass);
  }
  if (map.size === 0)
    throw new Error("AUTH_CREDENTIALS 형식이 올바르지 않습니다 (user:pass,user2:pass2)");
  return map;
}

/** 로그인 처리: credentials 검증 후 세션 쿠키 설정 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const credentials = getCredentials();

  const storedPass = credentials.get(username);
  if (!storedPass || !constantTimeEqual(storedPass, password)) {
    return { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  const token = await createSessionToken(username, getSecret());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.USE_HTTPS === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { success: true, message: "로그인 성공" };
}

/** 로그아웃: 세션 쿠키 삭제 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** 현재 세션에서 로그인된 사용자 이름 조회 */
export async function getSessionUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, getSecret());
}
