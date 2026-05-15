"use client";

import { useState } from "react";
import { trackLead } from "./TrackingScripts";

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<"nystartad" | "etablerad" | "">("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, segment, source: "landing-hero" }),
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
          disabled={state === "loading"}
          className="btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === "loading" ? "Skickar…" : "Notifiera mig"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-ink-500">
        <span>Jag är:</span>
        <label className="cursor-pointer">
          <input
            type="radio"
            name="segment"
            value="nystartad"
            checked={segment === "nystartad"}
            onChange={() => setSegment("nystartad")}
            className="sr-only peer"
          />
          <span className="px-2.5 py-1 rounded-full border border-ink-300 peer-checked:bg-navy-700 peer-checked:text-white peer-checked:border-navy-700 transition">
            nystartad
          </span>
        </label>
        <label className="cursor-pointer">
          <input
            type="radio"
            name="segment"
            value="etablerad"
            checked={segment === "etablerad"}
            onChange={() => setSegment("etablerad")}
            className="sr-only peer"
          />
          <span className="px-2.5 py-1 rounded-full border border-ink-300 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600 transition">
            etablerad
          </span>
        </label>
      </div>
      {state === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <p className="text-xs text-ink-500">
        Vi använder din mail endast för lanseringsnotis + gratisguiden. Inga andra utskick.
      </p>
    </form>
  );
}
