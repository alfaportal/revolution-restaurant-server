"use client";

import { motion } from "framer-motion";
import { useGjuha } from "@/i18n/gjuha";

export default function Fiskal() {
  const { t } = useGjuha();
  const hapat = t.fiskal.hapat;
  const rreshtat = [
    ["Espresso", "1.20"],
    ["Kapuçino", "1.50"],
    [t.fiskal.uji, "0.80"],
  ];
  return (
    <section id="fiskalizimi" className="bg-[#12121A] px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm rounded-2xl bg-[#f4f1ea] p-6 text-[#1c1917] shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <p className="text-center text-xs tracking-[0.25em] text-[#78716c]">REVOLUTION POS</p>
          <p className="mt-1 text-center text-sm font-semibold">{t.fiskal.kupon}</p>
          <p className="text-center text-xs text-[#78716c]">{t.fiskal.vendi}</p>
          <div className="my-4 border-t border-dashed border-[#a8a29e]" />
          <ul className="flex flex-col gap-2 text-sm">
            {rreshtat.map(([emri, vlera]) => (
              <li key={emri} className="flex justify-between">
                <span>{emri}</span>
                <span>{vlera} €</span>
              </li>
            ))}
          </ul>
          <div className="my-4 border-t border-dashed border-[#a8a29e]" />
          <div className="flex justify-between text-sm">
            <span>{t.fiskal.tvsh}</span>
            <span>0.53 €</span>
          </div>
          <div className="mt-2 flex justify-between text-lg font-bold">
            <span>{t.fiskal.totali}</span>
            <span>3.50 €</span>
          </div>
          <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-lg border border-[#d6d3d1] bg-white text-[10px] text-[#78716c]">
            QR
          </div>
          <p className="mt-4 text-center text-[11px] text-[#78716c]">
            {t.fiskal.shenim}
          </p>
        </motion.div>

        <div>
          <p className="text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{t.fiskal.sy}</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            {t.fiskal.titulli}
          </h2>
          <p className="mt-4 max-w-xl text-[#94A3B8]">
            {t.fiskal.nentitulli}
          </p>
          <ol className="mt-8 flex flex-col gap-4">
            {hapat.map((hapi, index) => (
              <motion.li
                key={hapi.nr}
                className="flex gap-4 rounded-2xl border border-white/5 bg-[#0A0A0F] p-4"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <span className="text-lg font-bold text-[#0EA5E9]">{hapi.nr}</span>
                <div>
                  <h3 className="font-semibold text-white">{hapi.titulli}</h3>
                  <p className="mt-1 text-sm text-[#94A3B8]">{hapi.teksti}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
