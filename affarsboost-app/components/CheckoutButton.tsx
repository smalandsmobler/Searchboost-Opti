"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  tierId: "solo" | "tillvaxt";
  className?: string;
  children: React.ReactNode;
}

export default function CheckoutButton({ tierId, className, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Något gick fel. Prova igen.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Nätverksfel — prova igen om en stund.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={startCheckout}
        disabled={loading}
        className={className}
      >
        {loading ? "Startar betalning…" : children}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
