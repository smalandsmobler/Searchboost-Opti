"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Turnstile from "./Turnstile";
import TypingDots from "./TypingDots";
import { renderChatContent } from "@/lib/chat-format";

const QUICK_QUESTIONS = [
  "Vad kan jag dra av som enskild firma?",
  "Hur sätter jag rätt timpris?",
  "Vilka startbidrag finns just nu?",
  "Behöver jag ett uppdragsavtal?",
];

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

/** Karaktär-för-karaktär typing-fördröjning per tecken (ms). */
function charDelay(ch: string): number {
  if (".!?".includes(ch)) return 160 + Math.random() * 120;
  if (",;:".includes(ch)) return 70 + Math.random() * 40;
  if (ch === "\n") return 80 + Math.random() * 40;
  return 28 + Math.random() * 22;
}

interface CommunityChatProps {
  prefillName?: string;
  prefillTier?: string;
}

export default function CommunityChat({ prefillName, prefillTier }: CommunityChatProps = {}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [linnea, setLinnea] = useState<LinnéaInfo | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // Namn-steg — om vi har inloggad användare hoppar vi över dialogrutan
  const [name, setName] = useState(prefillName ?? "");
  const [nameSet, setNameSet] = useState(!!prefillName);
  const [nameInput, setNameInput] = useState(prefillName ?? "");
  const [tier, setTier] = useState<string>(prefillTier ?? "besokare");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileExpired, setTurnstileExpired] = useState(false);
  const [nameError, setNameError] = useState("");

  // Chat
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number } | null>(null);
  const [typingEntry, setTypingEntry] = useState<{ id: string; full: string; shown: number } | null>(null);
  const isFirstMessage = useRef(true); // första meddelandet kräver token
  const prevMessagesRef = useRef<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ladda sparat namn + tier (bara om vi inte fick prefill från session)
  useEffect(() => {
    if (prefillName) return; // Inloggad — använd session-data
    const savedName = localStorage.getItem("affarsboost_name");
    const savedTier = localStorage.getItem("affarsboost_tier");
    if (savedName) {
      setName(savedName);
      setTier(savedTier ?? "besokare");
      setNameSet(true);
    }
  }, [prefillName]);

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
          if (typeof data.onlineCount === "number") {
            setOnlineCount(data.onlineCount);
          }
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
  }, [messages, typingEntry]);

  // Detektera pending→icke-pending transition och starta animering
  useEffect(() => {
    const prev = prevMessagesRef.current;
    for (const msg of messages) {
      if (msg.role !== "linnea" || msg.pending) continue;
      const prevMsg = prev.find((p) => p.id === msg.id);
      if (prevMsg?.pending === true) {
        setTypingEntry({ id: msg.id, full: msg.content, shown: 0 });
        break;
      }
    }
    prevMessagesRef.current = messages;
  }, [messages]);

  // Karaktär-för-karaktär animering
  useEffect(() => {
    if (!typingEntry) return;
    if (typingEntry.shown >= typingEntry.full.length) {
      setTypingEntry(null);
      return;
    }
    const ch = typingEntry.full[typingEntry.shown];
    const timer = setTimeout(() => {
      setTypingEntry((prev) => prev ? { ...prev, shown: prev.shown + 1 } : null);
    }, charDelay(ch));
    return () => clearTimeout(timer);
  }, [typingEntry]);

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
    localStorage.setItem("affarsboost_tier", tier);
    localStorage.setItem("affarsboost_verified", "1");
    setName(n);
    setNameSet(true);
  }

  async function send(retryText?: string) {
    const text = (retryText ?? input).trim();
    if (!text || sending) return;
    if (!retryText) setInput("");
    setSendError("");
    setLastFailedText(null);
    setSending(true);

    try {
      const payload: Record<string, unknown> = {
        content: text,
        name,
        tier,
        website: "",
      };
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
        setLastFailedText(text);
        setSending(false);
        return;
      }
      if (res.status === 403) {
        setSendError("Säkerhetsverifieringen misslyckades. Ladda om sidan.");
        setSending(false);
        return;
      }
      if (res.status === 402) {
        // Solo har slut på kvot
        const data = await res.json().catch(() => ({}));
        setSendError(data.message ?? "Du har använt månadens frågor.");
        setQuotaInfo({ used: data.quotaUsed ?? 20, limit: data.quotaLimit ?? 20 });
        setLastFailedText(text);
        setSending(false);
        return;
      }
      if (!res.ok) {
        setSendError("Något gick fel — försök igen.");
        setLastFailedText(text);
        setSending(false);
        return;
      }

      // Hämta uppdaterade meddelanden direkt
      const updated = await fetch("/api/chat");
      if (updated.ok) {
        const data = await updated.json();
        setMessages(data.messages ?? []);
        setLinnea(data.linnea);
        if (typeof data.onlineCount === "number") {
          setOnlineCount(data.onlineCount);
        }
      }
    } catch {
      setSendError("Nätverksfel — försök igen.");
      setLastFailedText(text);
    } finally {
      setSending(false);
    }
  }

  function autoresize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
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
            className="w-full px-4 py-3 rounded-lg border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-ink-900 mb-4"
          />

          {/* Tier-väljare */}
          <p className="text-ink-500 text-xs mb-2 text-left">Din plan hos Affärsboost:</p>
          <div className="grid grid-cols-1 gap-1.5 mb-3">
            {[
              { id: "besokare", label: "Besökare", sub: "Testar plattformen" },
              { id: "solo",     label: "Solo",     sub: "299 kr/mån" },
              { id: "tillvaxt",label: "Tillväxt",  sub: "1 000 kr/mån" },
              { id: "business", label: "Business", sub: "5 000 kr/mån" },
              { id: "partner",  label: "Partner",  sub: "10 000 kr/mån" },
            ].map((t) => (
              <label key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                tier === t.id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-ink-200 hover:border-ink-300 text-ink-700"
              }`}>
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  checked={tier === t.id}
                  onChange={() => setTier(t.id)}
                  className="sr-only"
                />
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  tier === t.id ? "border-emerald-500 bg-emerald-500" : "border-ink-300"
                }`} />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="ml-auto text-xs text-ink-400">{t.sub}</span>
              </label>
            ))}
          </div>

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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-180px)] min-h-[480px] lg:h-[640px] max-h-[800px]">

      {/* Sidebar — kompakt på mobil, full på desktop */}
      <div className="hidden lg:flex lg:w-72 bg-navy-900 rounded-2xl p-6 flex-shrink-0 flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-500/30">
            <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
          </div>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-navy-900 ${dotColor}`} />
        </div>
        <h3 className="font-display font-bold text-white text-lg mb-0.5">Linnéa</h3>
        <p className="text-emerald-400 text-xs font-medium mb-3">Affärscoach · Affärsboost</p>

        {linnea && (
          <div className={`w-full rounded-xl px-3 py-2 text-xs mb-4 ${
            isOnline ? "bg-emerald-900/40 text-emerald-300" : "bg-navy-800 text-navy-200"
          }`}>
            <span className="font-semibold">{linnea.label}</span>
            {linnea.sublabel ? ` · ${linnea.sublabel}` : ""}
          </div>
        )}

        <p className="text-navy-200 text-xs leading-relaxed mb-6">
          Affärscoach på Affärsboost. Jag svarar på frågor om skatt, startbidrag, avtal och affärsutveckling för svenska företagare.
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

        {/* Privat chatt — bara Tillväxt+ */}
        {nameSet && ["tillvaxt","business","partner"].includes(tier) && (
          <div className="w-full mt-4 pt-4 border-t border-navy-700">
            <Link
              href="/privat"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-emerald-900/30 hover:bg-emerald-900/50 transition-colors text-emerald-300 text-xs font-medium"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
              </svg>
              Privat chatt med Maja →
            </Link>
          </div>
        )}
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
              <p className="text-xs text-ink-500">Affärscoach · svenska företag</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onlineCount !== null && (
              <span className="flex items-center gap-1.5 text-xs text-navy-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {onlineCount} online
              </span>
            )}
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
            <div className="text-center text-ink-500 mt-8 px-2">
              <p className="text-sm mb-1">Inga meddelanden ännu.</p>
              <p className="text-xs text-ink-400 mb-5">Ställ en affärsfråga eller välj en nedan.</p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                    className="text-left text-sm bg-cream hover:bg-cream-dark border border-cream-sand rounded-lg px-3 py-2 text-navy-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isLinnea
                      ? "bg-navy-50 text-navy-900 rounded-tl-sm"
                      : "bg-emerald-600 text-white rounded-tr-sm"
                  }`}>
                    {msg.pending ? (
                      <span className="inline-flex items-center gap-2 text-navy-500">
                        Linnéa skriver <TypingDots className="text-navy-400" />
                      </span>
                    ) : typingEntry?.id === msg.id ? (
                      <span className="whitespace-pre-wrap">
                        {typingEntry.full.slice(0, typingEntry.shown)}
                        <span className="inline-block w-0.5 h-[1em] bg-navy-400 ml-px align-middle animate-pulse" />
                      </span>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: renderChatContent(msg.content) }} />
                    )}
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
          {quotaInfo && (
            <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 mb-2 flex items-center justify-between gap-2">
              <span>
                <strong>{quotaInfo.used}/{quotaInfo.limit}</strong> frågor använda denna månad.
              </span>
              <Link href="/konto" className="font-semibold underline hover:no-underline">
                Uppgradera →
              </Link>
            </div>
          )}
          {sendError && (
            <div className="text-xs text-red-600 mb-2 flex items-center justify-between gap-2">
              <span>{sendError}</span>
              {lastFailedText && (
                <button
                  onClick={() => send(lastFailedText)}
                  disabled={sending}
                  className="font-semibold underline hover:no-underline shrink-0"
                >
                  Försök igen
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoresize(e.target); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                isOnline
                  ? "Ställ en affärsfråga till Linnéa…  (Shift+Enter för ny rad)"
                  : "Skriv ett meddelande — Linnéa svarar vid nästa tillfälle"
              }
              disabled={sending}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm text-ink-900 disabled:opacity-50 resize-none leading-relaxed max-h-40"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              aria-label="Skicka"
              className="shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {sending ? (
                <TypingDots className="text-white" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-ink-300 mt-2 flex items-center justify-between">
            <span>
              Chattar som <strong className="text-ink-500">{name}</strong>
              {tier && tier !== "besokare" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wide">
                  {tier === "tillvaxt" ? "Tillväxt" : tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
              )}
              {" "}·{" "}
              <button
                onClick={() => {
                  localStorage.removeItem("affarsboost_name");
                  localStorage.removeItem("affarsboost_tier");
                  localStorage.removeItem("affarsboost_verified");
                  setNameSet(false);
                  setNameInput("");
                  setTier("besokare");
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
