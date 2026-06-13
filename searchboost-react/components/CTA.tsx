"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Phone, Mail, ArrowRight, Sparkles, CheckCircle, Loader2 } from "lucide-react";

const LEAD_ENDPOINT = "https://opti.searchboost.se/api/chatbot/capture-lead";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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
          sessionId: "cta-form",
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
    <section id="cta" className="relative py-24 overflow-hidden">
      {/* Background layers */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(5,5,18,0.96)" }}
      />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
      {/* Glow blobs */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(233,30,140,0.15) 0%, rgba(233,30,140,0.04) 50%, transparent 75%)",
          filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 400,
          height: 400,
          top: "30%",
          right: "10%",
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Border lines */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.6) 30%, rgba(255,255,255,0.14) 70%, transparent 100%)" }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 30%, rgba(233,30,140,0.3) 70%, transparent 100%)" }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.2 }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-8"
            style={{
              background: "rgba(233,30,140,0.08)",
              border: "1px solid rgba(233,30,140,0.3)",
              color: "#e91e8c",
            }}
            animate={{ boxShadow: ["0 0 0px rgba(233,30,140,0)", "0 0 20px rgba(233,30,140,0.3)", "0 0 0px rgba(233,30,140,0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Kom igång idag
          </motion.div>

          {/* Headline */}
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 leading-[1.1]"
            style={{ color: "#f0eafa" }}
          >
            Redo att synas
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 40%, #c026d3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(233,30,140,0.5))",
              }}
            >
              på Google?
            </span>
          </h2>

          <p className="text-lg mb-14 max-w-lg mx-auto leading-relaxed" style={{ color: "#a096b8" }}>
            Gratis SEO-analys av din sajt. Inga förbindelser, ingen säljpitch. Bara ett ärligt svar.
          </p>

          {/* Form */}
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto mb-12"
              >
                <div
                  className="p-2 rounded-2xl mb-3"
                  style={{
                    background: "rgba(8,8,24,0.8)",
                    border: "1px solid rgba(233,30,140,0.25)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 0 40px rgba(233,30,140,0.08), 0 20px 60px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="email"
                      required
                      placeholder="din@email.se"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(233,30,140,0.15)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.5)"; e.target.style.boxShadow = "0 0 16px rgba(233,30,140,0.15)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(233,30,140,0.15)"; e.target.style.boxShadow = "none"; }}
                    />
                    <input
                      type="text"
                      placeholder="dinsajt.se"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#7a6e90] text-[#f0eafa] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.14)"; e.target.style.boxShadow = "0 0 16px rgba(255,255,255,0.05)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full relative py-4 rounded-xl text-base font-black text-white overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
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
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Analyserar...</>
                      ) : (
                        <>Analysera min sajt <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" /></>
                      )}
                    </span>
                  </button>
                </div>
                {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
                <p className="text-xs" style={{ color: "#a096b8" }}>
                  Gratis &middot; Inget kreditkort &middot; Svar inom 24 timmar
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto mb-12 py-10 rounded-2xl flex flex-col items-center gap-4"
                style={{ background: "rgba(8,8,24,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle className="w-14 h-14" style={{ color: "#f5f0ff" }} />
                </motion.div>
                <p className="text-xl font-bold" style={{ color: "#f0eafa" }}>Tack! Vi hör av oss inom 24h.</p>
                <p className="text-sm" style={{ color: "#a096b8" }}>Kolla din inbox — och gärna din skräppost.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="tel:0728634279"
              className="flex items-center gap-2.5 text-sm font-medium transition-all duration-200 hover:text-[#e91e8c] group"
              style={{ color: "#a096b8" }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.2)" }}
              >
                <Phone className="w-4 h-4" style={{ color: "#e91e8c" }} />
              </span>
              0728-634 279
            </a>
            <div className="hidden sm:block w-px h-5" style={{ background: "rgba(255,255,255,0.1)" }} />
            <a
              href="mailto:info@searchboost.se"
              className="flex items-center gap-2.5 text-sm font-medium transition-all duration-200 hover:text-[#c026d3] group"
              style={{ color: "#a096b8" }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <Mail className="w-4 h-4" style={{ color: "#f5f0ff" }} />
              </span>
              info@searchboost.se
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
