"use client";
import { useEffect, useRef } from "react";
export default function HeroEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let time = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ── Large diagonal light beam (Resend-style) ──
      ctx.save();
      ctx.translate(canvas.width * 0.5, canvas.height * 0.3);
      ctx.rotate(-0.5);
      const beamGrad = ctx.createLinearGradient(-400, -300, 400, 300);
      beamGrad.addColorStop(0, "rgba(255,255,255,0)");
      beamGrad.addColorStop(0.3, "rgba(255,255,255,0.04)");
      beamGrad.addColorStop(0.5, `rgba(255,255,255,${0.07 + Math.sin(time) * 0.02})`);
      beamGrad.addColorStop(0.7, "rgba(255,255,255,0.04)");
      beamGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-canvas.width, -280, canvas.width * 2, 560);
      ctx.restore();
      // ── Second beam, crossing ──
      ctx.save();
      ctx.translate(canvas.width * 0.6, canvas.height * 0.5);
      ctx.rotate(0.8);
      const beam2 = ctx.createLinearGradient(-300, -200, 300, 200);
      beam2.addColorStop(0, "rgba(255,255,255,0)");
      beam2.addColorStop(0.4, "rgba(255,255,255,0.03)");
      beam2.addColorStop(0.5, `rgba(255,255,255,${0.05 + Math.sin(time * 1.3) * 0.015})`);
      beam2.addColorStop(0.6, "rgba(255,255,255,0.03)");
      beam2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = beam2;
      ctx.fillRect(-canvas.width, -150, canvas.width * 2, 300);
      ctx.restore();
      // ── Glowing orb top-right ──
      const orbX = canvas.width * 0.75 + Math.sin(time * 0.7) * 50;
      const orbY = canvas.height * 0.2 + Math.cos(time * 0.5) * 30;
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 250);
      orbGrad.addColorStop(0, `rgba(255,255,255,${0.08 + Math.sin(time) * 0.02})`);
      orbGrad.addColorStop(0.5, "rgba(255,255,255,0.03)");
      orbGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = orbGrad;
      ctx.fillRect(orbX - 250, orbY - 250, 500, 500);
      // ── Small glowing orb bottom-left ──
      const orb2X = canvas.width * 0.15 + Math.cos(time * 0.6) * 40;
      const orb2Y = canvas.height * 0.7 + Math.sin(time * 0.8) * 25;
      const orb2Grad = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 180);
      orb2Grad.addColorStop(0, "rgba(255,255,255,0.05)");
      orb2Grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = orb2Grad;
      ctx.fillRect(orb2X - 180, orb2Y - 180, 360, 360);
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
