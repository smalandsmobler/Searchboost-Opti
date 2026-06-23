"use client";

import { useEffect, useRef, useState } from "react";
import TypingDots from "./TypingDots";
import { renderChatContent } from "@/lib/chat-format";

const MAJA_AVATAR = "/avatars/maja-1-dark-blazer.jpg";
const STORAGE_KEY = "affarsboost_private_chat";
const MAX_STORED = 60;

/** Karaktär-för-karaktär typing-fördröjning per tecken (ms). */
function charDelay(ch: string): number {
  if (".!?".includes(ch)) return 160 + Math.random() * 120; // paus vid meningsslutt
  if (",;:".includes(ch)) return 70 + Math.random() * 40;   // kortare paus vid komma
  if (ch === "\n") return 80 + Math.random() * 40;
  return 28 + Math.random() * 22; // 28–50ms per vanligt tecken
}

interface Msg {
  role: "user" | "maja";
  content: string;
  ts: string;
}

interface LinnéaInfo {
  status: "online" | "lunch" | "offline";
  label: string;
  sublabel: string;
  nextOnline?: string;
}

const TIER_LABELS: Record<string, string> = {
  tillvaxt: "Tillväxt",
  business: "Business",
  partner: "Partner",
};

interface Props {
  name: string;
  tier: string;
}

export default function PrivateChat({ name, tier }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [majaStatus, setMajaStatus] = useState<LinnéaInfo | null>(null);
  const [error, setError] = useState("");
  const [typingEntry, setTypingEntry] = useState<{ full: string; shown: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const storageKey = `${STORAGE_KEY}_${name.toLowerCase().replace(/\s+/g, "_")}_${tier}`;

  // Ladda historik från localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Kolla Majas status (samma schema som Linnéa)
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setMajaStatus(data.linnea);
        }
      } catch { /* ignore */ }
    }
    checkStatus();
    const id = setInterval(checkStatus, 60000);
    return () => clearInterval(id);
  }, []);

  // Scrolla ned
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, typingEntry]);

  // Karaktär-för-karaktär animering av Majas svar
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

  function saveMessages(msgs: Msg[]) {
    const trimmed = msgs.slice(-MAX_STORED);
    try { localStorage.setItem(storageKey, JSON.stringify(trimmed)); } catch { /* ignore */ }
    setMessages(trimmed);
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setError("");
    setSending(true);

    const userMsg: Msg = { role: "user", content: text, ts: new Date().toISOString() };
    const updated = [...messages, userMsg];
    saveMessages(updated);

    try {
      const res = await fetch("/api/private-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          tier,
          website: "",
          history: updated.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.status === 429) {
        setError("Du har skickat för många meddelanden — vänta lite.");
        setSending(false);
        return;
      }

      const data = await res.json();

      // Offline
      if (data.offline) {
        const info: LinnéaInfo = data.info;
        const offlineMsg: Msg = {
          role: "maja",
          content: `Jag är offline just nu. ${info?.sublabel ?? "Jag är tillgänglig mån–fre 08:00–17:00."} Skicka gärna ditt meddelande så återkommer jag när jag är tillbaka.`,
          ts: new Date().toISOString(),
        };
        saveMessages([...updated, offlineMsg]);
        setSending(false);
        return;
      }

      const replyText: string = data.reply ?? "Något gick fel.";

      const majaMsg: Msg = {
        role: "maja",
        content: replyText,
        ts: new Date().toISOString(),
      };
      saveMessages([...updated, majaMsg]);
      setTypingEntry({ full: replyText, shown: 0 });
    } catch {
      setError("Nätverksfel — försök igen.");
    } finally {
      setSending(false);
    }
  }

  const tierLabel = TIER_LABELS[tier] ?? "Tillväxt";
  const isOnline = majaStatus?.status === "online";
  const dotColor = majaStatus?.status === "online" ? "bg-emerald-500"
    : majaStatus?.status === "lunch" ? "bg-amber-400"
    : "bg-gray-400";

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[680px]">

      {/* Sidebar */}
      <div className="lg:w-72 bg-navy-900 rounded-2xl p-6 flex-shrink-0 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-500/40">
            <img src={MAJA_AVATAR} alt="Maja" className="w-full h-full object-cover" />
          </div>
          <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-navy-900 ${dotColor}`} />
        </div>

        <h3 className="font-display font-bold text-white text-lg mb-0.5">Maja</h3>
        <p className="text-emerald-400 text-xs font-medium mb-1">affärsstrateg · Affärsboost</p>
        <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 text-[10px] font-semibold uppercase tracking-wide mb-4">
          {tierLabel}-plan
        </span>

        <p className="text-navy-200 text-xs leading-relaxed mb-6">
          Din personliga affärscoach. Det här är vår privata kanal — ingen annan ser vad vi pratar om.
        </p>

        <div className="w-full border-t border-navy-700 pt-4 text-left space-y-3">
          <div>
            <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider mb-1">Du chattar som</p>
            <p className="text-white text-sm font-medium">{name}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider mb-1">Din plan</p>
            <p className="text-white text-sm font-medium">{tierLabel}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider mb-1">Öppettider</p>
            <ul className="text-navy-200 text-xs space-y-0.5">
              <li>Mån–fre <span className="text-white">08:00–17:00</span></li>
              <li className="text-navy-400">Lör–sön: stängd</li>
            </ul>
            {majaStatus && (
              <p className={`text-xs mt-1.5 font-medium ${isOnline ? "text-emerald-400" : "text-amber-400"}`}>
                {majaStatus.label}
              </p>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Rensa konversationshistorik?")) {
                localStorage.removeItem(storageKey);
                setMessages([]);
              }
            }}
            className="mt-6 text-navy-500 hover:text-navy-300 text-xs underline transition-colors"
          >
            Rensa historik
          </button>
        )}
      </div>

      {/* Chattyta */}
      <div className="flex-1 flex flex-col bg-white border border-ink-100 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src={MAJA_AVATAR} alt="Maja" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-navy-900 text-sm leading-tight">Maja</p>
              <p className="text-xs text-ink-500">Din personliga affärscoach · privat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className={`text-xs font-medium ${isOnline ? "text-emerald-700" : "text-ink-400"}`}>
              {majaStatus ? majaStatus.label : "Online"}
            </span>
          </div>
        </div>

        {/* Meddelanden */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-ink-400 text-sm mt-16 space-y-2">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-ink-100">
                <img src={MAJA_AVATAR} alt="Maja" className="w-full h-full object-cover" />
              </div>
              <p className="font-medium text-navy-900">Hej {name}!</p>
              <p className="text-ink-500 max-w-xs mx-auto">
                Jag är Maja, din personliga affärscoach. Vad vill du jobba med idag?
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMaja = msg.role === "maja";
            const isAnimating = typingEntry !== null && i === messages.length - 1 && isMaja;
            return (
              <div key={i} className={`flex gap-3 ${isMaja ? "" : "flex-row-reverse"}`}>
                {isMaja ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                    <img src={MAJA_AVATAR} alt="Maja" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-navy-600 text-xs font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className={`max-w-[72%] flex flex-col ${isMaja ? "" : "items-end"}`}>
                  <span className={`text-xs text-ink-400 mb-1 ${isMaja ? "" : "text-right"}`}>
                    {isMaja ? "Maja" : name}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMaja
                      ? "bg-navy-50 text-navy-900 rounded-tl-sm"
                      : "bg-emerald-600 text-white rounded-tr-sm"
                  }`}>
                    {isAnimating ? (
                      <span className="whitespace-pre-wrap">
                        {typingEntry!.full.slice(0, typingEntry!.shown)}
                        <span className="inline-block w-0.5 h-[1em] bg-navy-400 ml-px align-middle animate-pulse" />
                      </span>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: renderChatContent(msg.content) }} />
                    )}
                  </div>
                  <span className={`text-xs text-ink-300 mt-1 ${isMaja ? "" : "text-right"}`}>
                    {new Date(msg.ts).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                <img src={MAJA_AVATAR} alt="Maja" className="w-full h-full object-cover" />
              </div>
              <div className="bg-navy-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-navy-500 text-sm">
                  Maja skriver <TypingDots className="text-navy-400" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-ink-100 bg-white">
          {!isOnline && majaStatus && (
            <p className="text-xs text-amber-600 mb-2">
              Maja är offline — {majaStatus.sublabel}. Meddelandet sparas och besvaras nästa dag.
            </p>
          )}
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={isOnline ? "Skriv till Maja…  (Shift+Enter för ny rad)" : "Skriv ett meddelande — Maja svarar nästa dag"}
              disabled={sending || !!typingEntry}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-sm text-ink-900 disabled:opacity-50 resize-none leading-relaxed max-h-40"
            />
            <button
              onClick={send}
              disabled={sending || !!typingEntry || !input.trim()}
              aria-label="Skicka"
              className="shrink-0 w-10 h-10 rounded-xl bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
          <p className="text-xs text-ink-300 mt-2">
            Privat konversation · sparas lokalt i din webbläsare
          </p>
        </div>
      </div>
    </div>
  );
}
