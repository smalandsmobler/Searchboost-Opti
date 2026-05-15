import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const segment = String(body.segment || "");
    const source = String(body.source || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    // Skriv till BigQuery via Searchboost Opti API (samma EC2-server, samma SA-creds)
    const apiBase = process.env.OPTI_API_BASE || "https://51.21.116.7";
    const apiKey = process.env.OPTI_API_KEY || "";
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
        // Self-signed cert på EC2 — i prod använder vi affarsboost-internal-api
        // @ts-expect-error Node fetch tillåter dispatcher
        dispatcher: undefined,
      });
    } catch (e) {
      // Fallback: logga lokalt om Opti-API inte svarar (skydd mot regressioner)
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
