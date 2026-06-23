/**
 * Enkel HMAC-signerad session — ingen extra dep, bygger på Node.js crypto.
 * Används för att lagra tier-info i en httpOnly-cookie efter Stripe-betalning.
 */
import { createHmac } from "crypto";

export interface SessionPayload {
  email: string;
  tier: "solo" | "tillvaxt" | "business" | "partner";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  exp: number; // Unix timestamp
}

function getSecret(): string {
  const s = process.env.AFFARSBOOST_JWT_SECRET;
  if (!s) throw new Error("AFFARSBOOST_JWT_SECRET saknas");
  return s;
}

export function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", getSecret()).update(data).digest("base64url");
    // Konstant-tidsjämförelse för att undvika timing attacks
    if (expected.length !== sig.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    if (diff !== 0) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // Utgången
    return payload;
  } catch {
    return null;
  }
}

/** Cookie-namn */
export const SESSION_COOKIE = "ab_session";

/** TTL: 30 dagar */
export function sessionExpiry(): number {
  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
}
