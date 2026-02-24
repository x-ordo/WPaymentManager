"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "아이디와 비밀번호를 입력하세요." };
  }

  const result = await login(username, password);

  if (!result.success) {
    return { error: result.message };
  }

  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
