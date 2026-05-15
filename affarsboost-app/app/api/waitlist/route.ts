import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile-verify";
import { checkRateLimit, getRateLimitRetryAfter } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: max 5 anmälningar per IP per timme
  if (!checkRateLimit(`waitlist:${ip}`, 5)) {
    const retryAfter = getRateLimitRetryAfter(`waitlist:${ip}`);
    return NextResponse.json(
      { error: "För många försök. Prova igen senare." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();

    // Honeypot — bots fyller i website-fältet
    if (body.website) {
      return NextResponse.json({ ok: true }); // tyst avvisa
    }

    // Turnstile-verifiering
    const valid = await verifyTurnstile(body.turnstileToken, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "Säkerhetsverifiering misslyckades. Ladda om sidan och försök igen." },
        { status: 403 }
      );
    }

    const email = String(body.email || "").trim().toLowerCase();
    const segment = String(body.segment || "");
    const source = String(body.source || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    // Skriv till BigQuery via Searchboost Opti API
    const apiBase = process.env.OPTI_API_BASE ?? "https://51.21.116.7";
    const apiKey = process.env.OPTI_API_KEY ?? "";
    try {
      await fetch(`${apiBase}/api/affarsboost/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          email,
          segment: segment || "okand",
          source,
          signed_up_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Waitlist Opti-write failed:", e instanceof Error ? e.message : e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
