"use client";

import { useState } from "react";
import { useGjuha } from "@/i18n/gjuha";

export default function Faq() {
  const { t } = useGjuha();
  const pyetjet = t.pyetje.lista;
  const [hapur, setHapur] = useState(0);

  return (
    <section id="pyetjet" className="bg-[#09090b] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{t.pyetje.sy}</p>
      <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
        {t.pyetje.titulli}
      </h2>
      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
        {pyetjet.map((pika, index) => {
          const eshteHapur = hapur === index;
          return (
            <div key={pika.pyetja} className="rounded-2xl border border-white/10 bg-[#12121A]">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white"
                aria-expanded={eshteHapur}
                onClick={() => setHapur(eshteHapur ? -1 : index)}
              >
                <span className="font-medium">{pika.pyetja}</span>
                <span className="text-[#0EA5E9]">{eshteHapur ? "−" : "+"}</span>
              </button>
              {eshteHapur ? (
                <p className="px-5 pb-5 text-sm leading-relaxed text-[#94A3B8]">{pika.pergjigja}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
