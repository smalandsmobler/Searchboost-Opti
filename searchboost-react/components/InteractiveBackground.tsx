"use client";

import { useEffect, useRef } from "react";

interface Blob {
  baseX: number;  // normalized 0-1
  baseY: number;
  r: number;      // normalized radius relative to min(w,h)
  phase: number;
  speed: number;
  ampX: number;
  ampY: number;
  rgb: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0;

    /* ── Resize ── */
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    /* ── Aurora blobs ── */
    const blobs: Blob[] = [
      { baseX: 0.22, baseY: 0.25, r: 0.60, phase: 0,    speed: 0.00026, ampX: 0.13, ampY: 0.11, rgb: "233,30,140" },
      { baseX: 0.78, baseY: 0.55, r: 0.55, phase: 2.1,  speed: 0.00033, ampX: 0.10, ampY: 0.14, rgb: "147,51,234" },
      { baseX: 0.50, baseY: 0.12, r: 0.48, phase: 4.2,  speed: 0.00021, ampX: 0.09, ampY: 0.09, rgb: "192,38,211" },
      { baseX: 0.08, baseY: 0.72, r: 0.42, phase: 1.05, speed: 0.00038, ampX: 0.15, ampY: 0.11, rgb: "233,30,140" },
      { baseX: 0.88, baseY: 0.18, r: 0.40, phase: 3.15, speed: 0.00029, ampX: 0.08, ampY: 0.13, rgb: "110,20,170" },
    ];

    /* ── Particles ── */
    const PARTICLE_COUNT = 90;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.4,
      alpha: Math.random() * 0.35 + 0.06,
    }));

    /* ── Draw loop ── */
    const draw = () => {
      const t = performance.now();
      ctx.clearRect(0, 0, w, h);

      // Solid base
      ctx.fillStyle = "#04040c";
      ctx.fillRect(0, 0, w, h);

      // --- Aurora blobs (screen blend) ---
      ctx.globalCompositeOperation = "screen";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hasM = mx > -9000;

      blobs.forEach((b) => {
        // Organic drift
        let px = (b.baseX + Math.sin(t * b.speed + b.phase) * b.ampX) * w;
        let py = (b.baseY + Math.cos(t * b.speed * 0.73 + b.phase + 1.2) * b.ampY) * h;

        // Mouse attraction — blobs gently drift toward cursor
        if (hasM) {
          const dist = Math.hypot(mx - px, my - py);
          const thresh = Math.min(w, h) * 0.7;
          if (dist < thresh) {
            const pull = ((1 - dist / thresh) ** 2) * 0.14;
            px += (mx - px) * pull;
            py += (my - py) * pull;
          }
        }

        const r = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0,    `rgba(${b.rgb},0.20)`);
        g.addColorStop(0.35, `rgba(${b.rgb},0.10)`);
        g.addColorStop(0.65, `rgba(${b.rgb},0.04)`);
        g.addColorStop(1,    `rgba(${b.rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Cursor radial glow
      if (hasM) {
        const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        cg.addColorStop(0,   "rgba(233,30,140,0.28)");
        cg.addColorStop(0.5, "rgba(233,30,140,0.07)");
        cg.addColorStop(1,   "rgba(233,30,140,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(mx, my, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      // --- Particles ---
      particles.forEach((p) => {
        // Update
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Repel from mouse
        if (hasM) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0) {
            const force = ((120 - dist) / 120) * 0.8;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233,30,140,${p.alpha})`;
        ctx.fill();
      });

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.72);
      vig.addColorStop(0, "rgba(4,4,12,0)");
      vig.addColorStop(1, "rgba(4,4,12,0.60)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
