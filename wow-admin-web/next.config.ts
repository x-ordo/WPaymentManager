import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Middleware에서 CSP를 관리하므로 기존 headers 설정 제거
  experimental: {
    allowedDevOrigins: [
      "http://localhost:3000", 
      "http://100.72.153.43:3000",
      "http://103.97.209.205:5000"
    ],
  },
};

export default nextConfig;
