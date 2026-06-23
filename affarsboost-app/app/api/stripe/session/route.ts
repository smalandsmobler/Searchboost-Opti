/**
 * GET /api/stripe/session?session_id=xxx
 * Verifierar en genomförd checkout-session med Stripe och skapar en signerad session-cookie.
 * Anropas från /success-sidan efter Stripe-redirect.
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { signSession, sessionExpiry, SESSION_COOKIE } from "@/lib/session";

type TierId = "solo" | "tillvaxt" | "business" | "partner";
const VALID_TIERS = new Set<string>(["solo", "tillvaxt", "business", "partner"]);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Ogiltigt session_id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Betalning ej genomförd" }, { status: 402 });
    }

    const email =
      checkoutSession.customer_email ??
      (typeof checkoutSession.customer === "object" && checkoutSession.customer !== null
        ? (checkoutSession.customer as { email?: string }).email
        : null) ??
      "";

    if (!email) {
      return NextResponse.json({ error: "Ingen e-postadress i sessionen" }, { status: 400 });
    }

    const tier = (checkoutSession.metadata?.tier ?? "solo") as TierId;
    if (!VALID_TIERS.has(tier)) {
      return NextResponse.json({ error: "Okänd plan" }, { status: 400 });
    }

    const stripeCustomerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : (checkoutSession.customer as { id: string } | null)?.id ?? "";

    const stripeSubscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : (checkoutSession.subscription as { id: string } | null)?.id ?? "";

    // Skicka subscription-event till Opti EC2 för BQ-logging
    const apiBase = process.env.OPTI_API_BASE ?? "https://51.21.116.7";
    const apiKey = process.env.OPTI_API_KEY ?? "";
    fetch(`${apiBase}/api/affarsboost/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({
        event_id: `checkout_${sessionId}`,
        stripe_session_id: sessionId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        email,
        tier,
        status: "active",
        amount_sek: checkoutSession.metadata?.amount_sek
          ? Number(checkoutSession.metadata.amount_sek)
          : null,
        currency: "SEK",
        started_at: new Date().toISOString(),
      }),
    }).catch((e) => console.error("BQ subscription log failed:", e?.message));

    // Skapa signerad session-token
    const token = signSession({
      email,
      tier,
      stripeCustomerId,
      stripeSubscriptionId,
      exp: sessionExpiry(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://affarsboost.se";
    const isSecure = appUrl.startsWith("https");

    const response = NextResponse.json({ ok: true, email, tier });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 dagar
    });

    return response;
  } catch (err) {
    console.error("Stripe session verify error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Kunde inte verifiera session" }, { status: 500 });
  }
}
