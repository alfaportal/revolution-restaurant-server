"use client";

import { motion } from "framer-motion";
import { useGjuha } from "@/i18n/gjuha";

export default function HowItWorks() {
  const { t } = useGjuha();
  const steps = t.si.hapat;
  return (
    <section id="si-funksionon" className="bg-[#09090b] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">
        {t.si.sy}
      </p>
      <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
        {t.si.titulli}
      </h2>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0EA5E9]/40 bg-[#0EA5E9]/10 text-lg font-bold text-[#0EA5E9]">
              {index + 1}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-[#94A3B8]">{step.description}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {step.pikat.map((pika) => (
                <li key={pika} className="text-sm text-zinc-300">
                  <span className="text-[#0EA5E9]">✓ </span>
                  {pika}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
