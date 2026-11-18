"use client";

import { useEffect, useMemo, useRef } from "react";

const MADHESIA = 34;
const BAZA = 2;

function Fytyra() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 22% 18%, rgba(255,255,255,0.28), transparent 45%),
            linear-gradient(145deg, #3a3a42 0%, #1c1c22 55%, #0d0d12 100%)
          `,
          boxShadow: "inset 0 0 14px rgba(0,0,0,0.4), 0 0 10px rgba(255,255,255,0.04)",
        }}
      />
      <div
        className="absolute inset-[5px] opacity-80"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.26) 0.55px, transparent 0.65px)",
          backgroundSize: "6px 6px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/35" />
    </>
  );
}

function KubikInner() {
  const fytyrat = [
    { transform: `rotateY(0deg) translateZ(${MADHESIA / 2}px)` },
    { transform: `rotateY(90deg) translateZ(${MADHESIA / 2}px)` },
    { transform: `rotateY(180deg) translateZ(${MADHESIA / 2}px)` },
    { transform: `rotateY(-90deg) translateZ(${MADHESIA / 2}px)` },
    { transform: `rotateX(90deg) translateZ(${MADHESIA / 2}px)` },
    { transform: `rotateX(-90deg) translateZ(${MADHESIA / 2}px)` },
  ];
  return (
    <>
      {fytyrat.map((fytyra, index) => (
        <div
          key={index}
          className="absolute inset-0 overflow-hidden rounded-[5px] border border-white/20"
          style={{
            transform: fytyra.transform,
            backfaceVisibility: "hidden",
          }}
        >
          <Fytyra />
        </div>
      ))}
    </>
  );
}

export default function Kubi() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseSmooth = useRef({ x: 0, y: 0 });
  const pjeset = useMemo(() => {
    const lista: Array<{ x: number; y: number; z: number }> = [];
    for (let x = 0; x < 3; x += 1) {
      for (let y = 0; y < 3; y += 1) {
        for (let z = 0; z < 3; z += 1) {
          lista.push({ x, y, z });
        }
      }
    }
    return lista;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseTarget.current = {
        x: Math.max(-1, Math.min(1, (e.clientX - cx) / 320)),
        y: Math.max(-1, Math.min(1, (e.clientY - cy) / 240)),
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let animId = 0;
    let time = 0;
    const tick = () => {
      time += 0.007;
      mouseSmooth.current.x += (mouseTarget.current.x - mouseSmooth.current.x) * 0.05;
      mouseSmooth.current.y += (mouseTarget.current.y - mouseSmooth.current.y) * 0.05;
      const mx = mouseSmooth.current.x;
      const my = mouseSmooth.current.y;
      const floatY = Math.sin(time) * 7;
      const rotY = time * 16 + mx * 20;
      const rotX = 22 + Math.sin(time * 0.55) * 5 - my * 12;
      const ndarja = (Math.sin(time * 0.55) + 1) / 2;
      const gap = BAZA + ndarja * 14;
      if (boxRef.current) {
        boxRef.current.style.transform =
          `translateY(${floatY}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        const kids = boxRef.current.children;
        for (let i = 0; i < kids.length; i += 1) {
          const kid = kids[i] as HTMLElement;
          const x = Number(kid.dataset.x);
          const y = Number(kid.dataset.y);
          const z = Number(kid.dataset.z);
          const hap = MADHESIA + gap;
          const offset = -hap;
          kid.style.transform =
            `translate3d(${x * hap + offset}px, ${y * hap + offset}px, ${z * hap + offset}px)`;
        }
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={sceneRef}
      className="relative mx-auto flex h-[210px] w-full max-w-[240px] items-center justify-center"
      style={{ perspective: "1000px" }}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.09),transparent_65%)] blur-2xl" />
      <div
        ref={boxRef}
        className="relative h-[120px] w-[120px] will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {pjeset.map((p) => (
          <div
            key={`${p.x}-${p.y}-${p.z}`}
            data-x={p.x}
            data-y={p.y}
            data-z={p.z}
            className="absolute"
            style={{
              width: MADHESIA,
              height: MADHESIA,
              left: "50%",
              top: "50%",
              marginLeft: -MADHESIA / 2,
              marginTop: -MADHESIA / 2,
              transform: `translate3d(${p.x * (MADHESIA + BAZA) - (MADHESIA + BAZA)}px, ${p.y * (MADHESIA + BAZA) - (MADHESIA + BAZA)}px, ${p.z * (MADHESIA + BAZA) - (MADHESIA + BAZA)}px)`,
              transformStyle: "preserve-3d",
            }}
          >
            <KubikInner />
          </div>
        ))}
      </div>
    </div>
  );
}
