"use client";

import { useEffect, useMemo, useRef } from "react";

const MADHESIA = 34;
const BAZA = 2;

function Fytyra({ ngjyra }: { ngjyra: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 16%, ${ngjyra}, transparent 48%),
            linear-gradient(145deg, #4a4558 0%, #2a2638 42%, #14121c 100%)
          `,
          boxShadow: `inset 0 0 12px rgba(0,0,0,0.35), 0 0 14px ${ngjyra}`,
        }}
      />
      <div
        className="absolute inset-[5px] opacity-85"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 0.55px, transparent 0.65px)",
          backgroundSize: "6px 6px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/22 via-transparent to-black/30" />
    </>
  );
}

function KubikInner({ ngjyra }: { ngjyra: string }) {
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
          className="absolute inset-0 overflow-hidden rounded-[5px] border border-white/25"
          style={{
            transform: fytyra.transform,
            backfaceVisibility: "hidden",
          }}
        >
          <Fytyra ngjyra={ngjyra} />
        </div>
      ))}
    </>
  );
}

const NGJYRAT = [
  "rgba(196,181,253,0.55)",
  "rgba(167,139,250,0.5)",
  "rgba(125,211,252,0.45)",
  "rgba(244,114,182,0.4)",
  "rgba(165,180,252,0.5)",
];

export default function Kubi() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseSmooth = useRef({ x: 0, y: 0 });
  const pjeset = useMemo(() => {
    const lista: Array<{ x: number; y: number; z: number; ngjyra: string }> = [];
    let i = 0;
    for (let x = 0; x < 3; x += 1) {
      for (let y = 0; y < 3; y += 1) {
        for (let z = 0; z < 3; z += 1) {
          lista.push({ x, y, z, ngjyra: NGJYRAT[i % NGJYRAT.length] });
          i += 1;
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
      time += 0.008;
      mouseSmooth.current.x += (mouseTarget.current.x - mouseSmooth.current.x) * 0.05;
      mouseSmooth.current.y += (mouseTarget.current.y - mouseSmooth.current.y) * 0.05;
      const mx = mouseSmooth.current.x;
      const my = mouseSmooth.current.y;

      const faza = Math.floor(time / 3.2) % 5;
      const lokale = (time % 3.2) / 3.2;
      const vala = Math.sin(lokale * Math.PI);

      const floatY = Math.sin(time * 0.9) * 10 + Math.sin(time * 0.35) * 4;
      const floatX = Math.cos(time * 0.55) * 12 + Math.sin(time * 0.25) * 5;
      const rotY = time * 14 + mx * 22 + Math.sin(time * 0.4) * 8;
      const rotX = 20 + Math.sin(time * 0.5) * 8 - my * 14;
      const rotZ = Math.sin(time * 0.3) * 6;

      if (boxRef.current) {
        boxRef.current.style.transform =
          `translate3d(${floatX}px, ${floatY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
        const kids = boxRef.current.children;
        for (let i = 0; i < kids.length; i += 1) {
          const kid = kids[i] as HTMLElement;
          const x = Number(kid.dataset.x);
          const y = Number(kid.dataset.y);
          const z = Number(kid.dataset.z);

          let gapX = BAZA;
          let gapY = BAZA;
          let gapZ = BAZA;
          let twist = "";

          if (faza === 0) {
            const g = BAZA + vala * 16;
            gapX = g;
            gapY = g;
            gapZ = g;
          } else if (faza === 1) {
            gapY = BAZA + vala * 22;
            gapX = BAZA + vala * 4;
            gapZ = BAZA + vala * 4;
          } else if (faza === 2) {
            gapX = BAZA + vala * 22;
            gapY = BAZA + vala * 4;
            gapZ = BAZA + vala * 4;
          } else if (faza === 3) {
            gapZ = BAZA + vala * 22;
            gapX = BAZA + vala * 4;
            gapY = BAZA + vala * 4;
          } else {
            const g = BAZA + vala * 8;
            gapX = g;
            gapY = g;
            gapZ = g;
            if (y === 1) {
              twist = ` rotateY(${vala * 90}deg)`;
            } else if (x === 1 && lokale > 0.5) {
              twist = ` rotateX(${(lokale - 0.5) * 2 * 70}deg)`;
            }
          }

          const ox = -(MADHESIA + gapX);
          const oy = -(MADHESIA + gapY);
          const oz = -(MADHESIA + gapZ);
          kid.style.transform =
            `translate3d(${x * (MADHESIA + gapX) + ox}px, ${y * (MADHESIA + gapY) + oy}px, ${z * (MADHESIA + gapZ) + oz}px)${twist}`;
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
      className="relative mx-auto flex h-[230px] w-full max-w-[260px] items-center justify-center"
      style={{ perspective: "1100px" }}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.22),rgba(125,211,252,0.08),transparent_70%)] blur-2xl" />
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
            <KubikInner ngjyra={p.ngjyra} />
          </div>
        ))}
      </div>
    </div>
  );
}
