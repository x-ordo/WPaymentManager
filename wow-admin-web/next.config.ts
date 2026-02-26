import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Middleware에서 CSP를 관리하므로 기존 headers 설정 제거
};

export default nextConfig;
