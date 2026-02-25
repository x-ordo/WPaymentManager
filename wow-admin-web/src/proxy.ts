import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 정적 리소스는 보안 헤더 없이 즉시 반환 (성능 및 호환성)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. CSP 헤더 구성 (Hana2 로컬 폰트 사용을 위해 font-src 'self' 유지)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    font-src 'self' data:;
    connect-src 'self';
    img-src 'self' data:;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  const getNextResponse = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', cspHeader);
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res;
  };

  // 3. 공개 경로 처리
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return getNextResponse(NextResponse.next());
  }

  // 4. 인증 체크
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: AUTH_SECRET not set in production");
      return new NextResponse("Internal Server Error", { status: 500 });
    }
    return getNextResponse(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !(await verifySessionToken(token, secret))) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return getNextResponse(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
