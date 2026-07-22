"use client";

import { useEffect, useRef } from "react";

/** Ambient drifting-dust background, matching the story mode's title screen. */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = 0;
    let height = 0;
    let frameId = 0;

    interface Particle {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
    }
    let particles: Particle[] = [];

    // const (not `function`) so TS can prove these run only after the
    // narrowing check above — keeps `ctx` typed as CanvasRenderingContext2D
    // instead of widening back to `... | null | undefined` inside the closure.
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = Array.from({ length: 44 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        vy: -(Math.random() * 0.25 + 0.05),
        vx: (Math.random() - 0.5) * 0.08,
        a: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,220,${p.a})`;
        ctx.fill();
        if (!reduced) {
          p.y += p.vy;
          p.x += p.vx;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        }
      }
      frameId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
}