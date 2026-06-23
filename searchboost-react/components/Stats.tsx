"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 90, suffix: "%", label: "rankar bättre inom 3 månader", color: "#e91e8c" },
  { value: 12, prefix: "+", label: "positioner per optimering i snitt", color: "#f5f0ff" },
  { value: 67, suffix: "%", label: "mer organisk trafik på 6 månader", color: "#e91e8c" },
  { value: 52, suffix: "×", label: "optimeringar per år, per kund", color: "#f5f0ff" },
];

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  color,
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  color: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [active, value]);

  return (
    <span
      className="text-3xl sm:text-4xl font-black tracking-tight"
      style={{ color }}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative py-14 overflow-hidden">
      {/* Top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.3) 30%, rgba(255,255,255,0.08) 70%, transparent 100%)",
        }}
      />
      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-y-0">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center py-7 px-4"
            >
              {/* Vertical separator */}
              {i < stats.length - 1 && (
                <div
                  className="absolute right-0 top-1/4 bottom-1/4 w-px hidden lg:block"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              )}

              <AnimatedNumber
                value={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                color={s.color}
                active={inView}
              />
              <span
                className="text-sm leading-snug mt-2 max-w-[140px]"
                style={{ color: "#8a7ea8" }}
              >
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
