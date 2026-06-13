"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
import type { Variants } from "framer-motion";

const testimonials = [
  {
    person: "Mattias S.",
    role: "Ägare, e-handel",
    quote:
      "Synligheten på Google har förbättrats tydligt. Veckorapporten är konkret och visar exakt vad som hänt — utan krångel.",
    color: "#e91e8c",
  },
  {
    person: "Peter V.",
    role: "VD, konsultbolag",
    quote:
      "Vi ser löpande förbättringar för våra viktigaste produktsidor. Tydlig kommunikation och inga konstigheter.",
    color: "#f5f0ff",
  },
  {
    person: "Patrik C.",
    role: "Marknadschef, tech",
    quote:
      "Enkelt samarbete — Searchboost sköter SEO-arbetet och vi kan fokusera på kärnverksamheten. Rapporten varje vecka ger bra koll.",
    color: "#e91e8c",
    featured: true,
  },
  {
    person: "Mikael N.",
    role: "VD, kontorsmöbler",
    quote:
      "Organisk trafik ökar och vi syns bättre lokalt. En investering som betalar sig och det märks i praktiken.",
    color: "#f5f0ff",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(233,30,140,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6" ref={ref}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#f0eafa" }}>
            Vad kunderna säger
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5" style={{ color: "#e91e8c", fill: "#e91e8c" }} />
              ))}
            </div>
            <span className="text-sm" style={{ color: "#9988aa" }}>
              4.9 / 5 från 50+ kunder
            </span>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="relative flex flex-col p-6 rounded-2xl"
              style={{
                background: t.featured
                  ? "rgba(8,8,24,0.95)"
                  : "rgba(8,8,24,0.65)",
                border: t.featured
                  ? `1px solid rgba(233,30,140,0.3)`
                  : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {t.featured && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(233,30,140,0.06) 0%, transparent 70%)",
                  }}
                />
              )}

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className="w-3 h-3"
                    style={{ color: "#e91e8c", fill: "#e91e8c" }}
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                className="text-sm leading-relaxed flex-1 mb-5"
                style={{ color: t.featured ? "#d4c8ec" : "#b0a4c8" }}
              >
                {t.quote}
              </p>

              {/* Person */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `${t.color}18`,
                    border: `1px solid ${t.color}28`,
                    color: t.color,
                  }}
                >
                  {t.role[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none" style={{ color: "#c8b8e0" }}>
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
