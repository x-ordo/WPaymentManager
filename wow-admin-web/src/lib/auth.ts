import "server-only";
import { cookies } from "next/headers";
import { authenticateLegacy } from "./legacy-api";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "./session";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET 환경변수가 올바르지 않습니다.");
  }
  return secret;
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const result = await authenticateLegacy(username, password);

    if (result.code === "1" && result.connectionid) {
      const userData = {
        userId: username,
        pass: password, // 규격에 따라 모든 API 요청에 pass가 필요함
        connectionId: result.connectionid,
        userName: result._IN_NAME || username,
        userClass: result._CLASS || "0"
      };

      const token = await createSessionToken(userData, getSecret());
      
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

    return { success: false, message: result.message || "인증 실패", code: result.code };
  } catch (err) {
    return { success: false, message: "서버 통신 중 오류가 발생했습니다." };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, getSecret());
}
