"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card card-border bg-base-100 w-full max-w-sm">
        <div className="card-body p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-content">W</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Wow Payment</span>
          </div>

          <h2 className="text-base font-semibold text-base-content/60 mb-4">
            관리자 로그인
          </h2>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label text-sm font-semibold">아이디</label>
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                className="input input-bordered w-full"
                placeholder="운영자 ID"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label text-sm font-semibold">비밀번호</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input input-bordered w-full"
                placeholder="비밀번호"
              />
            </div>

            {state?.error && (
              <div className="text-sm text-error font-medium">{state.error}</div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-block mt-2"
            >
              {isPending ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
