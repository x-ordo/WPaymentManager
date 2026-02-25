"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { getLegacyErrorMessage } from "@/lib/error-codes";

// 인메모리 로그인 Rate Limiter
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5분

function checkRateLimit(username: string): string | null {
  const now = Date.now();
  const entry = loginAttempts.get(username);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      const remainSec = Math.ceil((entry.resetAt - now) / 1000);
      return `로그인 시도 횟수 초과. ${remainSec}초 후 다시 시도해 주세요.`;
    }
  }
  return null;
}

function recordLoginAttempt(username: string, success: boolean): void {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(username);
    return;
  }
  const entry = loginAttempts.get(username);
  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(username, { count: 1, resetAt: now + LOCKOUT_DURATION_MS });
  } else {
    entry.count++;
  }
}

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "아이디와 비밀번호를 입력하세요." };
  }

  // Rate limit 체크
  const rateLimitMsg = checkRateLimit(username);
  if (rateLimitMsg) {
    return { error: rateLimitMsg };
  }

  const result = await login(username, password);

  if (!result.success) {
    recordLoginAttempt(username, false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // 레거시 에러 코드가 있으면 한국어 메시지로 변환
    const errorMessage = result.code 
      ? getLegacyErrorMessage("/10100", result.code) 
      : result.message;
      
    return { error: errorMessage };
  }

  recordLoginAttempt(username, true);
  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
