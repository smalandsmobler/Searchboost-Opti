"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ArrowRight, Loader2, CheckCircle } from "lucide-react";

const LEAD_ENDPOINT = "https://opti.searchboost.se/api/chatbot/capture-lead";

interface HeroWithVideoProps {
  backgroundImage?: string;
  videoUrl?: string;
}

export function HeroWithVideo({
  backgroundImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2072&q=80",
  videoUrl = "",
}: HeroWithVideoProps) {
  const [email,   setEmail]   = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const [videoActive,  setVideoActive]  = useState(false);
  const [videoPaused,  setVideoPaused]  = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domain: website || undefined, sessionId: "hero-form" }),
      });
      if (res.ok) setDone(true);
      else setError("Något gick fel. Ring oss på 0728-634 279.");
    } catch {
      setError("Kunde inte ansluta. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const playVideo = () => {
    videoRef.current?.play();
    setVideoActive(true);
    setVideoPaused(false);
  };
  const togglePause = () => {
    if (!videoRef.current) return;
    if (videoPaused) { videoRef.current.play(); setVideoPaused(false); }
    else             { videoRef.current.pause(); setVideoPaused(true); }
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">

      {/* Background image */}
      <img
        src={backgroundImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: videoActive ? 0 : 1, transition: "opacity 0.6s" }}
      />

      {/* Video layer */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          onEnded={() => { setVideoActive(false); setVideoPaused(false); }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: videoActive ? 1 : 0, transition: "opacity 0.6s" }}
        />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(4,4,16,0.72) 0%, rgba(4,4,16,0.45) 45%, rgba(4,4,16,0.85) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-10 py-36 text-center">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <span
            className="relative inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase overflow-hidden"
            style={{
              color: "rgba(255,255,255,0.82)",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 0 0 1px rgba(233,30,140,0.3), 0 0 24px rgba(233,30,140,0.12)",
            }}
          >
            {/* shimmer sweep */}
            <motion.span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 30%, rgba(233,30,140,0.18) 50%, transparent 70%)",
              }}
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            />
            {/* live dot with ring */}
            <span className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
              <motion.span
                className="absolute rounded-full"
                style={{ background: "rgba(233,30,140,0.25)" }}
                animate={{ width: ["6px","14px"], height: ["6px","14px"], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#e91e8c", boxShadow: "0 0 8px #e91e8c" }} />
            </span>
            Searchboost SEO-byrå
          </span>
        </motion.div>

        {/* H1 */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <motion.h1
            className="font-bold tracking-tight leading-[1.15]"
            style={{ fontSize: "clamp(1.4rem, 4vw, 3rem)", color: "#ffffff" }}
            animate={{
              textShadow: [
                "0 0 30px rgba(233,30,140,0.55), 0 0 70px rgba(233,30,140,0.15)",
                "0 0 30px rgba(147,51,234,0.55), 0 0 70px rgba(147,51,234,0.15)",
                "0 0 30px rgba(233,30,140,0.55), 0 0 70px rgba(233,30,140,0.15)",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            Digital AI Marketing &amp; Personlig Service
          </motion.h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-10"
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          Det bästa av två världar — intelligent teknik
          och äkta mänsklig omtanke, under ett tak.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.form key="form" exit={{ opacity: 0, y: -8 }} onSubmit={handleSubmit}>
                <div
                  className="p-2 rounded-2xl mb-3"
                  style={{
                    background: "rgba(6,6,20,0.75)",
                    border: "1px solid rgba(233,30,140,0.22)",
                    backdropFilter: "blur(28px)",
                    boxShadow: "0 0 60px rgba(233,30,140,0.08), 0 24px 64px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="email"
                      placeholder="Din e-postadress"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#5a5070] text-[#f5f0ff] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(233,30,140,0.5)"; }}
                      onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                    <input
                      type="text"
                      placeholder="dinsajt.se"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium placeholder-[#5a5070] text-[#f5f0ff] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(233,30,140,0.38)"; }}
                      onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #e91e8c 0%, #b5157b 100%)",
                      boxShadow: "0 0 32px rgba(233,30,140,0.4), 0 8px 20px rgba(0,0,0,0.35)",
                    }}
                  >
                    {!loading && (
                      <motion.span
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.28) 50%, transparent 75%)" }}
                        animate={{ x: ["-150%", "250%"] }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5 }}
                      />
                    )}
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyserar...</>
                      : <>Kom igång gratis <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
                {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Gratis · Inget kreditkort · Svar inom 24h
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 220 }}
                className="py-8 px-6 rounded-2xl flex flex-col items-center gap-3"
                style={{
                  background: "rgba(6,6,20,0.88)",
                  border: "1px solid rgba(233,30,140,0.3)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: "#e91e8c" }} />
                <p className="text-lg font-bold" style={{ color: "#f5f0ff" }}>Tack! Vi hör av oss inom 24h.</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Kolla din inbox — och gärna skräpposten.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust + video play */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-6"
          >
            {["50+ nöjda kunder", "4.9 / 5 betyg", "Ingen bindningstid"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                <span className="w-1 h-1 rounded-full" style={{ background: "#e91e8c" }} />
                {t}
              </span>
            ))}

            {videoUrl && (
              <button
                onClick={videoActive ? togglePause : playVideo}
                className="inline-flex items-center gap-2 text-xs font-semibold transition-colors"
                style={{ color: "rgba(255,255,255,0.38)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#e91e8c"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)"; }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  {videoActive && !videoPaused
                    ? <Pause className="w-3 h-3" />
                    : <Play  className="w-3 h-3 ml-0.5" />
                  }
                </span>
                Se hur det fungerar
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(4,4,16,0.98))", zIndex: 2 }}
      />
    </section>
  );
}
