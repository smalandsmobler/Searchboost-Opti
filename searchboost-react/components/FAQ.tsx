"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Hur lång tid tar det innan jag ser resultat?",
    a: "De flesta kunder ser mätbara förbättringar i ranking inom 4–8 veckor. SEO är en långsiktig investering — full effekt ses typiskt efter 3–6 månader. Vi visar öppet vad som görs varje vecka så du aldrig är i ovisshet.",
  },
  {
    q: "Behöver jag ge er tillgång till min WordPress?",
    a: "Ja, vi behöver ett Application Password till din WordPress (tar 2 minuter att skapa). Utöver det kräver vi tillgång till Google Search Console. Du behåller full kontroll och kan återkalla tillgången när som helst.",
  },
  {
    q: "Hur fungerar den automatiska optimeringen i praktiken?",
    a: "Vår AI crawlar din sajt varje vecka, identifierar sidor med störst förbättringspotential och genererar optimerad metadata, schema markup och intern länkning — direkt i din WordPress. Du ser exakt vad som ändrats i veckans rapport.",
  },
  {
    q: "Vad är skillnaden mot att anlita en SEO-konsult?",
    a: "En konsult fakturerar per timme och hinner optimera ett fåtal sidor per månad. Vår AI arbetar parallellt på alla dina sidor varje vecka — med 15–50 optimeringar per månad beroende på plan. Lägre kostnad, högre volym, transparent resultat.",
  },
  {
    q: "Fungerar det för alla typer av webbplatser?",
    a: "Vi är specialiserade på WordPress-sajter — e-handel, tjänsteföretag, lokala verksamheter och B2B. Har du en annan plattform? Hör av dig så berättar vi vad vi kan göra.",
  },
  {
    q: "Kan jag avsluta när jag vill?",
    a: "Absolut. Ingen bindningstid — du avslutar med 1 månads varsel. Inga straffavgifter, inga dolda kostnader. Vi tjänar pengarna när du stannar för att du ser resultat, inte för att vi låst in dig.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" className="py-12 sm:py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(233,30,140,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6" ref={ref}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#f5f0ff",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            Vanliga frågor
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#f0eafa" }}
          >
            Allt du undrar över{" "}
            <span style={{ color: "#e91e8c" }}>SEO</span>
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background:
                  open === i ? "rgba(8,8,24,0.95)" : "rgba(8,8,24,0.6)",
                border:
                  open === i
                    ? "1px solid rgba(233,30,140,0.3)"
                    : "1px solid rgba(255,255,255,0.12)",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span
                  className="text-sm sm:text-base font-semibold pr-4 leading-snug"
                  style={{ color: open === i ? "#f0eafa" : "#c8b8e0" }}
                >
                  {faq.q}
                </span>
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background:
                      open === i
                        ? "rgba(233,30,140,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      open === i
                        ? "1px solid rgba(233,30,140,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: open === i ? "#e91e8c" : "#8a7ea8",
                  }}
                >
                  {open === i ? (
                    <Minus className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-6 pb-5 text-sm leading-relaxed"
                      style={{ color: "#a096b8" }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-sm mb-3" style={{ color: "#8a7ea8" }}>
            Hittar du inte svaret du letar efter?
          </p>
          <a
            href="tel:0728634279"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:text-[#f0eafa]"
            style={{ color: "#e91e8c" }}
          >
            Ring oss på 0728-634 279 →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
