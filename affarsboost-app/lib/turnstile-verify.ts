/**
 * Server-side Cloudflare Turnstile-verifiering.
 * Teststnyckel (alltid godkänd): 1x0000000000000000000000000000000AA
 * Sätt TURNSTILE_SECRET_KEY i .env för produktion.
 */

const SECRET =
  process.env.TURNSTILE_SECRET_KEY ??
  "1x0000000000000000000000000000000AA"; // Cloudflares officiella testtoken

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string
): Promise<boolean> {
  if (!token) return false;

  // I testläge (när testtoken används) godkänns alltid
  if (
    SECRET === "1x0000000000000000000000000000000AA" &&
    token === "XXXX.DUMMY.TOKEN.XXXX"
  ) {
    return true;
  }

  try {
    const body: Record<string, string> = {
      secret: SECRET,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) return false;
    const data: { success: boolean; "error-codes"?: string[] } = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verify error:", err);
    // Fail open i dev, fail closed i prod
    return process.env.NODE_ENV !== "production";
  }
}
