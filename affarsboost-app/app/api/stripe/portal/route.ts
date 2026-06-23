/**
 * POST /api/stripe/portal
 * Skapar en Stripe Customer Portal-session så betalande kunder kan
 * hantera sin prenumeration (byta kort, säga upp, se fakturor).
 * Kräver giltig ab_session-cookie.
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });
  }

  const session = verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Session utgången eller ogiltig" }, { status: 401 });
  }

  if (!session.stripeCustomerId) {
    return NextResponse.json({ error: "Inget Stripe-konto kopplat" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://affarsboost.se";

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: session.stripeCustomerId,
      return_url: `${appUrl}/konto`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Kunde inte öppna hanteringssidan" }, { status: 500 });
  }
}
