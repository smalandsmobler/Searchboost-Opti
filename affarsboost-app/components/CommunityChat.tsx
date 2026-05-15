"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Turnstile from "./Turnstile";

interface Msg {
  id: string;
  role: "user" | "linnea" | "system";
  name: string;
  content: string;
  timestamp: string;
  pending?: boolean;
}

interface LinnéaInfo {
  status: "online" | "lunch" | "offline";
  label: string;
  sublabel: string;
}

const LINNEA_AVATAR = "/avatars/linnea-r1-auburn-waves.jpg";
const POLL_MS = 4000;

export default function CommunityChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [linnea, setLinnea] = useState<LinnéaInfo | null>(null);

  // Namn-steg
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileExpired, setTurnstileExpired] = useState(false);
  const [nameError, setNameError] = useState("");

  // Chat
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const isFirstMessage = useRef(true); // första meddelandet kräver token
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ladda sparat namn
  useEffect(() => {
    const saved = localStorage.getItem("affarsboost_name");
    if (saved) {
      setName(saved);
      setNameSet(true);
    }
  }, []);

  // Poll
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok && active) {
          const data = await res.json();
          setMessages(data.messages ?? []);
          setLinnea(data.linnea);
        }
      } catch { /* tyst */ }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Scrolla ned
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileExpired(false);
  }, []);

  const handleExpire = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileExpired(true);
  }, []);

  function saveName() {
    const n = nameInput.trim().slice(0, 40);
    if (!n) { setNameError("Ange ett namn för att fortsätta."); return; }
    if (!turnstileToken) { setNameError("Slutför säkerhetskontrollen nedan."); return; }
    setNameError("");
    localStorage.setItem("affarsboost_name", n);
    localStorage.setItem("affarsboost_verified", "1");
    setName(n);
    setNameSet(true);
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSendError("");
    setSending(true);

    try {
      const payload: Record<string, unknown> = {
        content: text,
        name,
        website: "", // honeypot — aldrig fyllt av riktig användare
      };

      // Första meddelandet skickar med token
      if (isFirstMessage.current) {
        payload.firstMessage = true;
        payload.turnstileToken = turnstileToken;
        isFirstMessage.current = false;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setSendError("Du har skickat för många meddelanden. Vänta lite och försök igen.");
        setSending(false);
        return;
      }
      if (res.status === 403) {
        setSendError("Säkerhetsverifieringen misslyckades. Ladda om sidan.");
        setSending(false);
        return;
      }

      // Hämta uppdaterade meddelanden direkt
      const updated = await fetch("/api/chat");
      if (updated.ok) {
        const data = await updated.json();
        setMessages(data.messages ?? []);
        setLinnea(data.linnea);
      }
    } catch {
      setSendError("Nätverksfel — försök igen.");
    } finally {
      setSending(false);
    }
  }

  const isOnline = linnea?.status === "online";
  const dotColor =
    linnea?.status === "online" ? "bg-emerald-500"
    : linnea?.status === "lunch" ? "bg-amber-400"
    : "bg-gray-300";

  // ── Namn-dialog ────────────────────────────────────────────────────────────
  if (!nameSet) {
    return (
      <div className="flex items-center justify-center min-h-[480px]">
        <div className="bg-white border border-ink-100 rounded-2xl p-8 max-w-sm w-full shadow-sm text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-emerald-100">
            <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
          </div>
          <h3 className="font-display font-bold text-xl text-navy-900 mb-1">Välkommen!</h3>
          <p className="text-ink-600 text-sm mb-5">
            Vad ska Linnéa kalla dig? Ange ditt namn eller företagsnamn.
          </p>

          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            placeholder="Ditt namn eller företag"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-ink-900 mb-1"
          />

          {/* Cloudflare Turnstile */}
          <div className="flex justify-center mb-1">
            <Turnstile onToken={handleToken} onExpire={handleExpire} theme="light" />
          </div>

          {turnstileExpired && (
            <p className="text-amber-600 text-xs mb-2">Säkerhetskontrollen löpte ut — vänta tills den laddas om.</p>
          )}

          {nameError && (
            <p className="text-red-500 text-xs mb-2">{nameError}</p>
          )}

          <button
            onClick={saveName}
            disabled={!nameInput.trim() || !turnstileToken}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
          >
            {!turnstileToken ? "Slutför säkerhetskontrollen ovan" : "Starta chatt →"}
          </button>

          <p className="text-ink-300 text-xs mt-4">
            Skyddas av Cloudflare Turnstile · Inga cookies sätts
          </p>
        </div>
      </div>
    );
  }

  // ── Chattvy ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[640px]">

      {/* Sidebar */}
      <div className="lg:w-72 bg-navy-900 rounded-2xl p-6 flex-shrink-0 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-500/30">
            <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
          </div>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-navy-900 ${dotColor}`} />
        </div>
        <h3 className="font-display font-bold text-white text-lg mb-0.5">Linnéa</h3>
        <p className="text-emerald-400 text-xs font-medium mb-3">AI-affärsrådgivare · Affärsboost</p>

        {linnea && (
          <div className={`w-full rounded-xl px-3 py-2 text-xs mb-4 ${
            isOnline ? "bg-emerald-900/40 text-emerald-300" : "bg-navy-800 text-navy-200"
          }`}>
            <span className="font-semibold">{linnea.label}</span>
            {linnea.sublabel ? ` · ${linnea.sublabel}` : ""}
          </div>
        )}

        <p className="text-navy-200 text-xs leading-relaxed mb-6">
          Jag är en AI. Jag svarar på frågor om skatt, startbidrag, avtal och affärsutveckling för svenska företagare.
        </p>

        <div className="w-full border-t border-navy-700 pt-4 text-left">
          <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider mb-2">Öppettider</p>
          <ul className="text-navy-200 text-xs space-y-1">
            <li>Mån–fre <span className="text-white">08:00–12:00</span></li>
            <li>Mån–fre <span className="text-white">13:00–17:00</span></li>
            <li className="text-navy-400">Lör–sön: stängd</li>
          </ul>
          <p className="text-navy-400 text-xs mt-3">
            Meddelanden utanför öppettider sparas och besvaras nästa gång Linnéa är online.
          </p>
        </div>
      </div>

      {/* Chattyta */}
      <div className="flex-1 flex flex-col bg-white border border-ink-100 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-navy-900 text-sm leading-tight">Linnéa</p>
              <p className="text-xs text-ink-500">AI-rådgivare · affärsfrågor på svenska</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {linnea && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isOnline ? "bg-emerald-50 text-emerald-700" : "bg-ink-50 text-ink-500"
              }`}>
                {isOnline ? "Online" : linnea.label}
              </span>
            )}
            {/* Cloudflare-badge */}
            <span className="hidden sm:flex items-center gap-1 text-xs text-ink-300">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-orange-400">
                <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7a11.8 11.8 0 01.104-1.589.5.5 0 01.479-.425 11.947 11.947 0 007.078-2.749z" clipRule="evenodd" />
              </svg>
              Skyddat
            </span>
          </div>
        </div>

        {/* Meddelanden */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-ink-400 text-sm mt-16">
              <p className="mb-1">Inga meddelanden ännu.</p>
              <p>Ställ en affärsfråga till Linnéa!</p>
            </div>
          )}
          {messages.map((msg) => {
            if (msg.role === "system") {
              return (
                <div key={msg.id} className="text-center">
                  <span className="text-xs text-ink-400 bg-ink-50 px-3 py-1 rounded-full inline-block">
                    {msg.content}
                  </span>
                </div>
              );
            }
            const isLinnea = msg.role === "linnea";
            return (
              <div key={msg.id} className={`flex gap-3 ${isLinnea ? "" : "flex-row-reverse"}`}>
                {isLinnea ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                    <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-navy-600 text-xs font-bold">
                      {msg.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className={`max-w-[70%] flex flex-col ${isLinnea ? "" : "items-end"}`}>
                  <span className={`text-xs text-ink-400 mb-1 ${isLinnea ? "" : "text-right"}`}>
                    {msg.name}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isLinnea
                      ? "bg-navy-50 text-navy-900 rounded-tl-sm"
                      : "bg-emerald-600 text-white rounded-tr-sm"
                  } ${msg.pending ? "opacity-60 italic" : ""}`}>
                    {msg.pending ? "Linnéa skriver…" : msg.content}
                  </div>
                  <span className={`text-xs text-ink-300 mt-1 ${isLinnea ? "" : "text-right"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-ink-100 bg-white">
          {!isOnline && linnea && (
            <p className="text-xs text-amber-600 mb-2">
              Linnéa är offline — {linnea.sublabel}. Meddelandet sparas och besvaras nästa gång.
            </p>
          )}
          {sendError && (
            <p className="text-xs text-red-500 mb-2">{sendError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={
                isOnline
                  ? "Ställ en affärsfråga till Linnéa…"
                  : "Skriv ett meddelande — Linnéa svarar vid nästa tillfälle"
              }
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm text-ink-900 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "…" : "Skicka"}
            </button>
          </div>
          <p className="text-xs text-ink-300 mt-2 flex items-center justify-between">
            <span>
              Chattar som <strong className="text-ink-500">{name}</strong> ·{" "}
              <button
                onClick={() => {
                  localStorage.removeItem("affarsboost_name");
                  localStorage.removeItem("affarsboost_verified");
                  setNameSet(false);
                  setNameInput("");
                  setTurnstileToken(null);
                  isFirstMessage.current = true;
                }}
                className="underline hover:text-ink-600"
              >
                Byt namn
              </button>
            </span>
            <span className="flex items-center gap-1">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-orange-400">
                <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7a11.8 11.8 0 01.104-1.589.5.5 0 01.479-.425 11.947 11.947 0 007.078-2.749z" clipRule="evenodd" />
              </svg>
              Cloudflare Turnstile
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
