"use client";

import { useEffect, useRef } from "react";

const fytyrat = [
  { transform: "rotateY(0deg) translateZ(70px)" },
  { transform: "rotateY(90deg) translateZ(70px)" },
  { transform: "rotateY(180deg) translateZ(70px)" },
  { transform: "rotateY(-90deg) translateZ(70px)" },
  { transform: "rotateX(90deg) translateZ(70px)" },
  { transform: "rotateX(-90deg) translateZ(70px)" },
];

export default function Kubi() {
  const boxRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseSmooth = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseTarget.current = {
        x: Math.max(-1, Math.min(1, (e.clientX - cx) / 280)),
        y: Math.max(-1, Math.min(1, (e.clientY - cy) / 220)),
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let animId = 0;
    let time = 0;
    const tick = () => {
      time += 0.006;
      mouseSmooth.current.x += (mouseTarget.current.x - mouseSmooth.current.x) * 0.05;
      mouseSmooth.current.y += (mouseTarget.current.y - mouseSmooth.current.y) * 0.05;
      const mx = mouseSmooth.current.x;
      const my = mouseSmooth.current.y;
      const floatY = Math.sin(time) * 8;
      const rotY = time * 18 + mx * 18;
      const rotX = 18 + Math.sin(time * 0.6) * 6 - my * 12;
      if (boxRef.current) {
        boxRef.current.style.transform =
          `translateY(${floatY}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={sceneRef}
      className="relative mx-auto flex h-[220px] w-full max-w-[260px] items-center justify-center"
      style={{ perspective: "900px" }}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_65%)] blur-2xl" />
      <div
        ref={boxRef}
        className="relative h-[140px] w-[140px] will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {fytyrat.map((fytyra, index) => (
          <div
            key={index}
            className="absolute inset-0 overflow-hidden rounded-[10px] border border-white/10"
            style={{
              transform: fytyra.transform,
              backfaceVisibility: "hidden",
              background: `
                radial-gradient(circle at 20% 15%, rgba(255,255,255,0.14), transparent 40%),
                linear-gradient(145deg, #1a1a1f 0%, #0a0a0c 55%, #050506 100%)
              `,
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.55)",
            }}
          >
            <div
              className="absolute inset-[10px] opacity-70"
              style={{
                backgroundImage: `
                  radial-gradient(circle, rgba(255,255,255,0.16) 0.7px, transparent 0.8px)
                `,
                backgroundSize: "10px 10px",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
