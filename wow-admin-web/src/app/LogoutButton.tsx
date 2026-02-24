"use client";

import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="text-sm"
    >
      로그아웃
    </button>
  );
}
