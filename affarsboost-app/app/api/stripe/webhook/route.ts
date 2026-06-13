/**
 * POST /api/stripe/webhook
 * Tar emot Stripe webhook-events och synkar subscription-status till BQ.
 *
 * VIKTIGT: App Router parsar INTE body automatiskt för denna route —
 * vi måste använda req.text() för att Stripe signatursverifiering ska fungera.
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

// Hindrar Next.js från att cacha webhook-anrop
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET saknas");
    return NextResponse.json({ error: "Webhook inte konfigurerat" }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Saknar stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature fel:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  const apiBase = process.env.OPTI_API_BASE ?? "https://51.21.116.7";
  const apiKey = process.env.OPTI_API_KEY ?? "";

  async function logToOpti(payload: Record<string, unknown>) {
    try {
      await fetch(`${apiBase}/api/affarsboost/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Opti BQ log failed:", e instanceof Error ? e.message : e);
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // Hanteras primärt av /api/stripe/session vid redirect — detta är backup
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" && session.mode === "subscription") {
        await logToOpti({
          event_id: `webhook_${event.id}`,
          stripe_session_id: session.id,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : (session.customer as { id: string } | null)?.id,
          stripe_subscription_id:
            typeof session.subscription === "string" ? session.subscription : null,
          email: session.customer_email ?? "",
          tier: session.metadata?.tier ?? "solo",
          status: "active",
          amount_sek: session.metadata?.amount_sek ? Number(session.metadata.amount_sek) : null,
          currency: "SEK",
          started_at: new Date(event.created * 1000).toISOString(),
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await logToOpti({
        event_id: `webhook_${event.id}`,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
        email: (sub.metadata?.email as string | undefined) ?? "",
        tier: (sub.metadata?.tier as string | undefined) ?? "solo",
        status: sub.status,
        currency: "SEK",
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await logToOpti({
        event_id: `webhook_${event.id}`,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
        email: (sub.metadata?.email as string | undefined) ?? "",
        tier: (sub.metadata?.tier as string | undefined) ?? "solo",
        status: "canceled",
        currency: "SEK",
        canceled_at: new Date(event.created * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
      break;
    }

    default:
      // Okänd event-typ — ignorera tyst
      break;
  }

  return NextResponse.json({ received: true });
}
