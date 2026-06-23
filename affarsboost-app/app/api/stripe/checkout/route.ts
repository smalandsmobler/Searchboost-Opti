import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICES, TIER_AMOUNTS } from "@/lib/stripe";
import { checkRateLimit, getRateLimitRetryAfter } from "@/lib/rate-limiter";

type TierId = "solo" | "tillvaxt";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Max 10 checkout-försök per IP per timme
  if (!checkRateLimit(`checkout:${ip}`, 10)) {
    const retryAfter = getRateLimitRetryAfter(`checkout:${ip}`);
    return NextResponse.json(
      { error: "För många försök." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const tierId = body?.tierId as TierId | undefined;

  if (!tierId || !["solo", "tillvaxt"].includes(tierId)) {
    return NextResponse.json({ error: "Ogiltig plan" }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[tierId];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe-priset är inte konfigurerat ännu — kontakta hej@affarsboost.se" },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://affarsboost.se";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pris`,
      locale: "sv",
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { tier: tierId, source: "affarsboost_web" },
      },
      metadata: {
        tier: tierId,
        amount_sek: String(TIER_AMOUNTS[tierId]),
      },
      // Visar pris i SEK om kunden är i Sverige
      currency: "sek",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Kunde inte starta betalning" }, { status: 500 });
  }
}
