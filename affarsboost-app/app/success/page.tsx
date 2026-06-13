"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trackSubscribe } from "@/components/TrackingScripts";
import { TIERS } from "@/lib/pricing";
import { Suspense } from "react";

type Status = "loading" | "success" | "error";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Ingen session hittad.");
      return;
    }

    async function verifySession() {
      try {
        const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error ?? "Verifiering misslyckades.");
          setStatus("error");
          return;
        }
        setEmail(data.email);
        setTier(data.tier);
        setStatus("success");

        // Conversion tracking
        const tierInfo = TIERS.find((t) => t.id === data.tier);
        if (tierInfo) {
          trackSubscribe(tierInfo.name, tierInfo.price);
        }
      } catch {
        setErrorMsg("Nätverksfel vid verifiering.");
        setStatus("error");
      }
    }

    verifySession();
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-ink-700">Bekräftar din betalning…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-10 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-navy-900 mb-3">Något gick fel</h1>
          <p className="text-ink-700 mb-6">{errorMsg}</p>
          <p className="text-sm text-ink-500 mb-6">
            Om du genomfört en betalning — oroa dig inte. Hör av dig till{" "}
            <a href="mailto:hej@affarsboost.se" className="text-emerald-600 underline">
              hej@affarsboost.se
            </a>{" "}
            med ditt kvitto så löser vi det.
          </p>
          <a
            href="/"
            className="inline-block bg-navy-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-navy-700 transition-colors"
          >
            Tillbaka till startsidan
          </a>
        </div>
      </div>
    );
  }

  const tierInfo = TIERS.find((t) => t.id === tier);

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-10 max-w-md text-center">
        {/* Check-ikon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="font-display font-bold text-3xl text-navy-900 mb-2">
          Välkommen till Affärsboost!
        </h1>

        {tierInfo && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-4">
            {tierInfo.name}-plan aktiv
          </div>
        )}

        <p className="text-ink-700 mb-2">
          Bekräftelse skickad till <strong>{email}</strong>.
        </p>
        <p className="text-ink-500 text-sm mb-8">
          Ditt konto är aktivt. Du kan nu chatta med Maja, ta del av mallar och allt annat som ingår i din plan.
        </p>

        <div className="space-y-3">
          <a
            href="/privat"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Öppna din personliga AI-strateg →
          </a>
          <a
            href="/community"
            className="block w-full border border-ink-200 hover:border-emerald-400 text-navy-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Gå till community-chatten
          </a>
        </div>

        <p className="text-xs text-ink-400 mt-6">
          Vill du ändra eller avsluta din prenumeration?{" "}
          <ManageSubscriptionButton />
        </p>
      </div>
    </div>
  );
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      /* tyst fail */
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="text-emerald-600 underline hover:no-underline"
    >
      {loading ? "Öppnar…" : "Hantera prenumeration"}
    </button>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-50 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
