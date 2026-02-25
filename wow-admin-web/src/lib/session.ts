/**
 * 세션 토큰 생성 및 검증 유틸리티 (Final Verification)
 */

const DEFAULT_MAX_AGE = 8 * 60 * 60; // 8시간

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

/** 
 * 세션 데이터 구조: userId|password|connectionId|userName|userClass
 */
export async function createSessionToken(
  data: { userId: string; pass: string; connectionId: string; userName: string; userClass: string },
  secret: string
): Promise<string> {
  const maxAge = Number(process.env.SESSION_MAX_AGE) || DEFAULT_MAX_AGE;
  const expiry = Math.floor(Date.now() / 1000) + maxAge;
  const payload = `${data.userId}|${data.pass}|${data.connectionId}|${data.userName}|${data.userClass}:${expiry}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}:${sig}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ userId: string; pass: string; connectionId: string; userName: string; userClass: string } | null> {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [payload, expiryStr, signature] = parts;
    const fullPayload = `${payload}:${expiryStr}`;

    if (!(await hmacVerify(fullPayload, signature, secret))) return null;

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) return null;

    const [userId, pass, connectionId, userName, userClass] = payload.split("|");
    if (!userId || !pass || !connectionId) return null;

    return { userId, pass, connectionId, userName, userClass };
  } catch (e) {
    return null;
  }
}

export const SESSION_COOKIE = "wow_session";
export const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || DEFAULT_MAX_AGE;
