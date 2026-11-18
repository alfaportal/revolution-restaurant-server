"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import HeroEffects from "./HeroEffects";
import { LEVIZJET, PAMJET } from "./HeroScreens";
import { useGjuha } from "@/i18n/gjuha";
export default function Hero() {
  const { t } = useGjuha();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [slide, setSlide] = useState(0);
  const emriEkranit = t.ekranet[PAMJET[slide].emri as keyof typeof t.ekranet] ?? PAMJET[slide].emri;
  // Track mouse for light effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % PAMJET.length), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <section
      id="ballina"
      ref={containerRef}
      className="relative overflow-hidden bg-[#09090b]"
    >
      {/* Canvas effects */}
      <HeroEffects />
      {/* ── Resend-style diagonal light beam ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.05) 0%, transparent 70%),
            linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 55%, transparent 60%, transparent 100%)
          `,
        }}
      />
      {/* Subtle noise grain overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />
      {/* Top glow accent */}
      <div className="pointer-events-none absolute -top-[300px] left-1/2 z-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.06),transparent_70%)] blur-3xl" />
      {/* ── Main content: BetterStack layout ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-[13px] font-medium tracking-wide text-zinc-400">
                {t.hero.badge}
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white"
            >
              {t.hero.rreshti1}
              <br />
              <span className="text-white">
                {t.hero.rreshti2}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-md text-[17px] leading-relaxed text-zinc-300"
            >
              {t.hero.nentitulli}
            </motion.p>
            <motion.form
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              onSubmit={(e) => {
                e.preventDefault();
                document.getElementById("kontakti")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                type="email"
                placeholder={t.hero.email}
                aria-label={t.hero.email}
                className="h-[52px] min-w-0 flex-1 rounded-lg border border-white/10 bg-[#12141c] px-4 text-[15px] text-white outline-none placeholder:text-zinc-500 focus:border-white/40"
              />
              <button
                type="submit"
                className="h-[52px] w-full shrink-0 rounded-lg bg-white px-5 text-[15px] font-semibold text-[#09090b] transition hover:bg-zinc-200 sm:w-auto"
              >
                {t.hero.fillo}
              </button>
            </motion.form>
            <motion.ul
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-8 grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {t.hero.pikat.map((pika) => (
                <li key={pika} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="text-white">✓</span>
                  {pika}
                </li>
              ))}
            </motion.ul>
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 flex items-center gap-10"
            >
              <div>
                <div className="text-2xl font-bold text-white">15</div>
                <div className="text-[13px] text-zinc-500">{t.hero.produkte}</div>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-[13px] text-zinc-500">{t.hero.mbeshtetje}</div>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <div className="rounded-[1.35rem] border border-white/15 bg-[#050506] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
                <div className="mb-2 flex items-center justify-between px-2">
                  <span className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  </span>
                  <span className="text-[11px] tracking-wide text-zinc-500">{emriEkranit}</span>
                  <span className="h-1.5 w-8 rounded-full bg-white/10" />
                </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide}
                    initial={LEVIZJET[slide].initial}
                    animate={LEVIZJET[slide].animate}
                    exit={LEVIZJET[slide].exit}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    {(() => { const Ekrani = PAMJET[slide].Ekrani; return <Ekrani />; })()}
                  </motion.div>
                </AnimatePresence>
              </div>
              </div>
              <div className="mx-auto h-2.5 w-[94%] rounded-b-xl bg-[#141416]" />
              <div className="mx-auto h-1.5 w-[22%] rounded-b-md bg-[#2a2a2e]" />
            </div>
            <p className="mt-4 text-center text-[13px] text-zinc-400">
              {emriEkranit}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label={t.hero.mbrapa}
                onClick={() => setSlide((s) => (s + 7) % PAMJET.length)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-2">
                {PAMJET.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={t.ekranet[p.emri as keyof typeof t.ekranet] ?? p.emri}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${slide === i ? "w-5 bg-white" : "w-1.5 bg-white/20"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label={t.hero.para}
                onClick={() => setSlide((s) => (s + 1) % PAMJET.length)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-32 w-full bg-gradient-to-t from-[#09090b] to-transparent" />
    </section>
  );
}

