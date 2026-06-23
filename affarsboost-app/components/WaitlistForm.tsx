"use client";

import { useState, useCallback } from "react";
import { trackLead } from "./TrackingScripts";
import Turnstile from "./Turnstile";

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<"nystartad" | "etablerad" | "">("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileExpired, setTurnstileExpired] = useState(false);

  const handleToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileExpired(false);
  }, []);

  const handleExpire = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileExpired(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorMsg("Slutför säkerhetskontrollen nedan innan du skickar.");
      return;
    }
    setState("loading");
    setErrorMsg("");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          segment,
          source: "landing-hero",
          turnstileToken,
          website: "", // honeypot
        }),
      });
      if (!r.ok) {
        const { error } = await r.json().catch(() => ({ error: "" }));
        throw new Error(error || "Något gick fel — prova igen om en stund");
      }
      trackLead(0, "SEK");
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Okänt fel");
    }
  }

  if (state === "success") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900">
        <div className="font-display font-bold text-lg mb-1">Tack!</div>
        <p className="text-sm">
          Vi hör av oss vid lansering. Kolla mailen om några minuter — gratisguiden{" "}
          <em>Momsavdrag 2026</em> är på väg.
        </p>
      </div>
    );
  }

  const canSubmit = state !== "loading" && !!turnstileToken && !turnstileExpired;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@mail.se"
          className="flex-1 px-4 py-3 rounded-lg border border-ink-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-ink-900"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === "loading" ? "Skickar…" : "Notifiera mig"}
        </button>
      </div>

      {/* Segment-val */}
      <div className="flex flex-wrap gap-2 text-xs text-ink-500">
        <span>Jag är:</span>
        {(["nystartad", "etablerad"] as const).map((seg) => (
          <label key={seg} className="cursor-pointer">
            <input
              type="radio"
              name="segment"
              value={seg}
              checked={segment === seg}
              onChange={() => setSegment(seg)}
              className="sr-only peer"
            />
            <span className={`px-2.5 py-1 rounded-full border border-ink-300 transition
              peer-checked:text-white peer-checked:border-transparent
              ${seg === "nystartad" ? "peer-checked:bg-navy-700" : "peer-checked:bg-emerald-600"}
            `}>
              {seg}
            </span>
          </label>
        ))}
      </div>

      {/* Cloudflare Turnstile */}
      <Turnstile onToken={handleToken} onExpire={handleExpire} size="compact" />

      {turnstileExpired && (
        <p className="text-xs text-amber-600">Säkerhetskontrollen löpte ut — vänta en sekund.</p>
      )}

      {state === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      {!turnstileToken && state === "idle" && errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <p className="text-xs text-ink-500">
        Vi använder din mail endast för lanseringsnotis + gratisguiden. Inga andra utskick.
      </p>
    </form>
  );
}
