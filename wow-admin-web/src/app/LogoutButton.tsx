"use client";

import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="btn btn-ghost btn-block justify-end gap-3 text-base-content/60 hover:text-error hover:bg-error/5 transition-colors font-bold pr-1"
    >
      로그아웃
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
    </button>
  );
}
