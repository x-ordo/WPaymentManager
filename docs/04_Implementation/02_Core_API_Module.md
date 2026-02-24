# API 통신 코어 모듈 (`lib/legacy-api.ts`)

본 시스템은 **오직 API(`API_SPEC.md`)만을 사용하여 백엔드와 통신**합니다. 백엔드의 내부 구조(DB 등)는 고려하지 않으며, 제공된 엔드포인트를 통해 데이터를 주고받습니다.

---

### 핵심 통신 모듈

```typescript
import "server-only";

const BASE_URL = process.env.LEGACY_API_BASE_URL || "http://127.0.0.1:33552";
const ADMIN_ID = process.env.LEGACY_ADMIN_ID || "master";
const ADMIN_PASS = process.env.LEGACY_ADMIN_PASS || "649005";

// [메모리 상태 유지] ConnectionID 캐싱
let globalConnectionId: string | null = null;
let authPromise: Promise<void> | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 자동 로그인 및 세션 갱신 (Race Condition 방지)
 */
async function authenticate(): Promise<void> {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const searchParams = new URLSearchParams({ id: ADMIN_ID, pass: ADMIN_PASS });

    try {
      const res = await fetch(`${BASE_URL}/10100?${searchParams.toString()}`);
      const data = await res.json();

      if (data.code === "1" && data.connectionid) {
        globalConnectionId = data.connectionid;
      } else {
        throw new Error(`로그인 실패: ${data.message}`);
      }
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/**
 * 레거시 API 공통 래퍼 (재시도 및 에러 제어)
 */
export async function fetchLegacy(
  path: string,
  params: Record<string, any> = {},
  retryCount = 0,
): Promise<any> {
  if (!globalConnectionId && path !== "/10100") {
    await authenticate();
  }

  const requestParams = {
    id: ADMIN_ID,
    pass: ADMIN_PASS,
    connectionid: globalConnectionId || "",
    ...params,
  };
  const searchParams = new URLSearchParams(requestParams);

  try {
    const response = await fetch(`${BASE_URL}${path}?${searchParams.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    switch (data.code) {
      case "1": return data;
      case "401":
        if (retryCount >= 2) throw new Error("401 재시도 초과");
        await delay(5100);
        return fetchLegacy(path, params, retryCount + 1);
      case "402":
        globalConnectionId = null;
        await authenticate();
        return fetchLegacy(path, params, retryCount + 1);
      default: return data;
    }
  } catch (error: any) {
    console.error(`[API 통신 장애] ${path}`, error);
    return { code: "999", message: "내부망 서버 통신 실패" };
  }
}
```
