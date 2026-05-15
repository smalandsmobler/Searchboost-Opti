"use client";

import { useEffect, useRef, useState } from "react";

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
  const [name, setName] = useState<string>("");
  const [nameSet, setNameSet] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ladda sparat namn
  useEffect(() => {
    const saved = localStorage.getItem("affarsboost_name");
    if (saved) {
      setName(saved);
      setNameSet(true);
    }
  }, []);

  // Poll efter meddelanden
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
      } catch {
        // tyst
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Scrolla ned vid nya meddelanden
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveName() {
    const n = nameInput.trim().slice(0, 40);
    if (!n) return;
    localStorage.setItem("affarsboost_name", n);
    setName(n);
    setNameSet(true);
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, name }),
      });
      // Poll direkt för att hämta svaret
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setLinnea(data.linnea);
      }
    } catch {
      // tyst
    } finally {
      setSending(false);
    }
  }

  const isOnline = linnea?.status === "online";
  const dotColor = linnea?.status === "online"
    ? "bg-emerald-500"
    : linnea?.status === "lunch"
    ? "bg-amber-400"
    : "bg-gray-300";

  // Namn-dialog
  if (!nameSet) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="bg-white border border-ink-100 rounded-2xl p-8 max-w-sm w-full shadow-sm text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-emerald-100">
            <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
          </div>
          <h3 className="font-display font-bold text-xl text-navy-900 mb-1">Välkommen!</h3>
          <p className="text-ink-600 text-sm mb-6">
            Vad ska Linnéa kalla dig?
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            placeholder="Ditt namn eller företagsnamn"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-ink-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 text-ink-900 mb-3"
          />
          <button
            onClick={saveName}
            disabled={!nameInput.trim()}
            className="w-full btn-primary justify-center disabled:opacity-50"
          >
            Starta chatt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[640px]">
      {/* Sidebar — Linnéa-profil */}
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

        <div className="text-navy-200 text-xs leading-relaxed mb-6">
          Jag är en AI. Jag svarar på frågor om skatt, startbidrag, avtal och affärsutveckling för svenska företagare.
        </div>

        <div className="w-full border-t border-navy-700 pt-4 text-left">
          <p className="text-navy-400 text-xs font-semibold uppercase tracking-wider mb-2">Öppettider</p>
          <ul className="text-navy-200 text-xs space-y-1">
            <li>Mån–fre <span className="text-white">08:00–12:00</span></li>
            <li>Mån–fre <span className="text-white">13:00–17:00</span></li>
            <li className="text-navy-400">Lör–sön: stängd</li>
          </ul>
          <p className="text-navy-400 text-xs mt-3">
            Utanför öppettiderna sparas meddelanden och besvaras när Linnéa är online.
          </p>
        </div>
      </div>

      {/* Chat-yta */}
      <div className="flex-1 flex flex-col bg-white border border-ink-100 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src={LINNEA_AVATAR} alt="Linnéa" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-navy-900 text-sm leading-tight">Linnéa</p>
              <p className="text-xs text-ink-500">AI-rådgivare · svarar på affärsfrågor</p>
            </div>
          </div>
          {linnea && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isOnline
                ? "bg-emerald-50 text-emerald-700"
                : "bg-ink-50 text-ink-500"
            }`}>
              {isOnline ? "Online" : linnea.label}
            </span>
          )}
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
                  <span className="text-xs text-ink-400 bg-ink-50 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }
            const isLinnea = msg.role === "linnea";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isLinnea ? "" : "flex-row-reverse"}`}
              >
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
                <div className={`max-w-[70%] ${isLinnea ? "" : "items-end"} flex flex-col`}>
                  <span className={`text-xs text-ink-400 mb-1 ${isLinnea ? "" : "text-right"}`}>
                    {msg.name}
                  </span>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isLinnea
                        ? "bg-navy-50 text-navy-900 rounded-tl-sm"
                        : "bg-emerald-600 text-white rounded-tr-sm"
                    } ${msg.pending ? "opacity-60 italic" : ""}`}
                  >
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
            <p className="text-xs text-amber-600 mb-2 flex items-center gap-1.5">
              <span>Linnéa är offline — {linnea.sublabel}. Meddelandet sparas.</span>
            </p>
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
                  : "Skriv ett meddelande — Linnéa svarar nästa gång hon är online"
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
          <p className="text-xs text-ink-300 mt-2 text-center">
            Du chattar som <strong className="text-ink-500">{name}</strong> ·{" "}
            <button
              onClick={() => {
                localStorage.removeItem("affarsboost_name");
                setNameSet(false);
                setNameInput("");
              }}
              className="underline hover:text-ink-600"
            >
              Byt namn
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
