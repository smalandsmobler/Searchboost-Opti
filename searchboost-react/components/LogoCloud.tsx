"use client";

import { motion } from "framer-motion";

const sectors = [
  "E-handel",
  "Konsultbolag",
  "Kontorsmöbler",
  "Teknik & SaaS",
  "Restaurang & Livsstil",
  "HR & Rekrytering",
  "Hälsa & Wellness",
  "Tillverkning",
];

export default function LogoCloud() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(233,30,140,0.03) 0%, transparent 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-xs font-semibold tracking-[0.2em] uppercase mb-7"
          style={{ color: "#8a7ea8" }}
        >
          Kunder inom
        </motion.p>

        <div className="relative overflow-hidden">
          {/* Fade masks */}
          <div
            className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to right, #04040c, transparent)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to left, #04040c, transparent)",
            }}
          />

          {/* Scrolling row */}
          <motion.div
            className="flex gap-10 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: "max-content" }}
          >
            {[...sectors, ...sectors].map((name, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-sm font-semibold tracking-wide px-4 py-2 rounded-lg flex-shrink-0"
                style={{
                  color: "#8a7ea8",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
