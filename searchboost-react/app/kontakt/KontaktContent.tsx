"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Phone, Mail, CheckCircle, Loader2, ArrowRight, Sparkles,
  Clock, Shield, TrendingUp,
} from "lucide-react";

const LEAD_ENDPOINT = "https://opti.searchboost.se/api/chatbot/capture-lead";

const trustPoints = [
  { icon: Shield, text: "Ingen bindningstid" },
  { icon: Clock, text: "Svar inom 24 timmar" },
  { icon: TrendingUp, text: "+180% trafik i snitt" },
];

const included = [
  "Teknisk SEO-genomgång",
  "Konkurrensanalys",
  "Nyckelordsmöjligheter",
  "Prioriterad åtgärdslista",
  "Potentiell trafikestimering",
];

export default function KontaktContent() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          domain: website || undefined,
          name: name || undefined,
          message: message || undefined,
          sessionId: "kontakt-form",
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Något gick fel. Ring oss på 0728-634 279.");
      }
    } catch {
      setError("Kunde inte ansluta. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pb-24 sm:pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

          {/* ── Left: Form ── */}
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                className="p-6 sm:p-10 rounded-3xl"
                style={{
                  background: "rgba(8,8,24,0.8)",
                  border: "1px solid rgba(233,30,140,0.2)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 0 60px rgba(233,30,140,0.06), 0 30px 80px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex items-center gap-2 mb-8">
                  <motion.div
                    animate={{ boxShadow: ["0 0 0px rgba(233,30,140,0)", "0 0 20px rgba(233,30,140,0.5)", "0 0 0px rgba(233,30,140,0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-2 rounded-xl"
                    style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.2)" }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: "#e91e8c" }} />
                  </motion.div>
                  <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#e91e8c" }}>
                    Gratis SEO-analys
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7a6e90" }}>
                      Ditt namn
                    </label>
                    <input
                      type="text"
                      placeholder="Anna Andersson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(233,30,140,0.12)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7a6e90" }}>
                      E-postadress <span style={{ color: "#e91e8c" }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="din@email.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(233,30,140,0.2)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.6)"; e.target.style.boxShadow = "0 0 16px rgba(233,30,140,0.2)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.2)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7a6e90" }}>
                      Din webbplats
                    </label>
                    <input
                      type="text"
                      placeholder="dinsajt.se"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.12)"; e.target.style.boxShadow = "0 0 16px rgba(255,255,255,0.06)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7a6e90" }}>
                      Meddelande (valfritt)
                    </label>
                    <textarea
                      placeholder="Berätta gärna lite om ditt företag och vad du vill uppnå..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200 resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.4)"; e.target.style.boxShadow = "0 0 16px rgba(233,30,140,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="mt-3 text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full relative mt-6 py-4 rounded-xl text-base font-black text-white overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #9333ea 100%)",
                    boxShadow: "0 0 40px rgba(233,30,140,0.5), 0 8px 24px rgba(233,30,140,0.3)",
                  }}
                >
                  {!loading && (
                    <motion.span
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)" }}
                      animate={{ x: ["-150%", "250%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Analyserar...</>
                    ) : (
                      <>Skicka in för gratis analys <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" /></>
                    )}
                  </span>
                </button>

                <p className="mt-4 text-xs text-center" style={{ color: "#7a6e90" }}>
                  Gratis &middot; Inget kreditkort &middot; Svar inom 24 timmar
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="p-10 sm:p-14 rounded-3xl flex flex-col items-center gap-5 text-center"
                style={{
                  background: "rgba(8,8,24,0.9)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, delay: 0.15 }}
                >
                  <CheckCircle className="w-16 h-16" style={{ color: "#f5f0ff" }} />
                </motion.div>
                <div>
                  <p className="text-2xl font-black mb-2" style={{ color: "#f0eafa" }}>
                    Tack! Vi hör av oss.
                  </p>
                  <p className="text-base" style={{ color: "#7a6e90" }}>
                    Kolla din inbox — vi skickar en konkret rapport inom 24h.
                  </p>
                </div>
                <p className="text-sm" style={{ color: "#7a6e90" }}>
                  Har du frågor i mellantiden? Ring{" "}
                  <a href="tel:0728634279" className="font-bold hover:text-[#e91e8c] transition-colors" style={{ color: "#c8b8e0" }}>
                    0728-634 279
                  </a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right: Info ── */}
          <div className="flex flex-col gap-6">
            {/* What's included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="p-6 sm:p-7 rounded-2xl"
              style={{
                background: "rgba(8,8,24,0.7)",
                border: "1px solid rgba(233,30,140,0.15)",
              }}
            >
              <h3 className="text-sm font-bold tracking-widest uppercase mb-5" style={{ color: "#e91e8c" }}>
                Ingår i analysen
              </h3>
              <ul className="flex flex-col gap-3">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#f5f0ff" }} />
                    <span className="text-sm" style={{ color: "#c8b8e0" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Trust points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-col gap-3"
            >
              {trustPoints.map((t) => (
                <div
                  key={t.text}
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: "rgba(8,8,24,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <t.icon className="w-4 h-4" style={{ color: "#f5f0ff" }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#c8b8e0" }}>{t.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Direct contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 sm:p-7 rounded-2xl"
              style={{
                background: "rgba(8,8,24,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-sm font-bold tracking-widest uppercase mb-5" style={{ color: "#f5f0ff" }}>
                Direktkontakt
              </h3>
              <div className="flex flex-col gap-4">
                <a
                  href="tel:0728634279"
                  className="group flex items-center gap-3 hover:text-[#e91e8c] transition-colors"
                  style={{ color: "#7a6e90" }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.2)" }}
                  >
                    <Phone className="w-4 h-4" style={{ color: "#e91e8c" }} />
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#f0eafa" }}>0728-634 279</p>
                    <p className="text-xs">Vardagar 9–17</p>
                  </div>
                </a>
                <a
                  href="mailto:info@searchboost.se"
                  className="group flex items-center gap-3 hover:text-[#c026d3] transition-colors"
                  style={{ color: "#7a6e90" }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <Mail className="w-4 h-4" style={{ color: "#f5f0ff" }} />
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#f0eafa" }}>info@searchboost.se</p>
                    <p className="text-xs">Svarar inom 24h</p>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Quick link to services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
            >
              <Link
                href="/tjanster"
                className="group flex items-center justify-between p-5 rounded-2xl transition-all duration-200 hover:border-[rgba(233,30,140,0.3)]"
                style={{
                  background: "rgba(233,30,140,0.05)",
                  border: "1px solid rgba(233,30,140,0.12)",
                }}
              >
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "#f0eafa" }}>
                    Se alla tjänster
                  </p>
                  <p className="text-xs" style={{ color: "#7a6e90" }}>
                    Priser, vad som ingår och hur det fungerar
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#e91e8c" }} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
