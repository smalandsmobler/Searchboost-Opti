import Stripe from "stripe";

// Lazy singleton — undviker initialisering vid import utan STRIPE_SECRET_KEY (t.ex. under build)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY saknas i miljövariabler");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

// Stripe Price IDs (skapas i Stripe Dashboard → Products → Prices)
export const STRIPE_PRICES: Record<"solo" | "tillvaxt", string> = {
  solo: process.env.STRIPE_PRICE_SOLO ?? "",
  tillvaxt: process.env.STRIPE_PRICE_TILLVAXT ?? "",
};

export const TIER_AMOUNTS: Record<"solo" | "tillvaxt", number> = {
  solo: 299,
  tillvaxt: 1000,
};
