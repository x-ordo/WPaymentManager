/**
 * 세션 토큰 생성 및 검증 유틸리티.
 * Edge Runtime과 Node.js 모두에서 사용 가능.
 * (server-only 제약 없음 — middleware에서 import 가능)
 */

const SESSION_MAX_AGE = 8 * 60 * 60; // 8시간

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** constant-time HMAC 검증 (타이밍 공격 방어) */
async function hmacVerify(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? []
  );
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
}

/** 세션 토큰 생성: username:expiry:hmac */
export async function createSessionToken(
  username: string,
  secret: string
): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${username}:${expiry}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}:${sig}`;
}

/** 세션 토큰 검증 → 유효하면 username, 아니면 null */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<string | null> {
  const parts = token.split(":");
  if (parts.length !== 3) return null;

  const [username, expiryStr, signature] = parts;
  const payload = `${username}:${expiryStr}`;

  // HMAC 검증 (constant-time 비교)
  if (!(await hmacVerify(payload, signature, secret))) return null;

  // 만료 검증
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) return null;

  return username;
}

export const SESSION_COOKIE = "wow_session";
export { SESSION_MAX_AGE };
