"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Cloud, Download, Shield, WifiOff, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useGjuha } from "@/i18n/gjuha";

const ikonat: LucideIcon[] = [Download, Shield, Cloud, WifiOff];

function Shenja({ lloji }: { lloji: string }) {
  if (lloji === "windows") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path fill="currentColor" d="M3 5.2 10.6 4.1v6.7H3V5.2Zm8.4-.9L21 3v7.8h-9.6V4.3ZM3 12.2h7.6V19L3 17.9v-5.7Zm8.4 0H21V21l-9.6-1.3v-7.5Z" />
      </svg>
    );
  }
  if (lloji === "android") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path fill="currentColor" d="M7.2 8.2h9.6a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-1.2v1.2h-1.6V20H9.9v1.2H8.3V20H7.2a2 2 0 0 1-2-2v-7.8a2 2 0 0 1 2-2Zm1.1-2.3.9-1.6.5.3-.9 1.5a6 6 0 0 1 5.4 0l-.9-1.5.5-.3.9 1.6A5.2 5.2 0 0 1 17 7.2H7a5.2 5.2 0 0 1 1.3-1.3ZM9 12.2a.7.7 0 1 0 0-1.4.7.7 0 0 0 0 1.4Zm6 0a.7.7 0 1 0 0-1.4.7.7 0 0 0 0 1.4Z" />
      </svg>
    );
  }
  if (lloji === "mac") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path fill="currentColor" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V15H4V5.5ZM3 16.5h18v1A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path fill="currentColor" d="M16.4 12.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-1-3-1c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1 1.2-2.1 1.6-3.2-4.2-1.6-3.9-6.1-3.9-6.9ZM14.7 6.2c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4Z" />
    </svg>
  );
}

export default function Perparesia({ kompakt = false }: { kompakt?: boolean }) {
  const { t } = useGjuha();
  const pikat = t.perparesia.pikat.map((pika, index) => ({ ...pika, Ikona: ikonat[index] }));
  const pajisjet = t.perparesia.pajisjet;
  const [zgjedhur, setZgjedhur] = useState(pajisjet[0].id);
  const pajisja = pajisjet.find((pika) => pika.id === zgjedhur) ?? pajisjet[0];
  if (kompakt) {
    return (
      <section className="border-y border-[#0EA5E9]/10 bg-[#0A0A0F] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white">{t.perparesia.pse}</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pikat.map((pika) => (
              <article
                key={pika.titulli}
                className="rounded-xl border border-white/10 bg-[#12121A] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#0EA5E9]/40"
              >
                <pika.Ikona className="h-5 w-5 text-[#0EA5E9]" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-white">{pika.titulli}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#94A3B8]">{pika.shkurt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="perparesia" className="bg-[#12121A] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{t.perparesia.sy}</p>
      <h2 className="mx-auto mt-3 max-w-3xl text-center text-3xl font-bold text-white md:text-4xl">
        {t.perparesia.titulli}
      </h2>
      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
        {pikat.map((pika, index) => (
          <motion.article
            key={pika.titulli}
            className="group rounded-2xl border border-[#1E293B] bg-[#0F172A] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#0EA5E9]/50 hover:shadow-[0_0_36px_rgba(14,165,233,0.14)]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] transition duration-300 group-hover:scale-110 group-hover:bg-[#0EA5E9]/20">
              <pika.Ikona className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{pika.titulli}</h3>
            <p className="mt-2 leading-relaxed text-[#94A3B8]">{pika.teksti}</p>
          </motion.article>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-6xl">
        <p className="text-center text-sm text-[#94A3B8]">{t.perparesia.zgjidh}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pajisjet.map((pika) => {
            const aktive = pika.id === pajisja.id;
            return (
              <button
                key={pika.id}
                type="button"
                onClick={() => setZgjedhur(pika.id)}
                aria-pressed={aktive}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition duration-300 ${
                  aktive
                    ? "border-[#0EA5E9] bg-[#0F172A] shadow-[0_0_28px_rgba(14,165,233,0.16)]"
                    : "border-[#1E293B] bg-[#0F172A] hover:-translate-y-0.5 hover:border-[#0EA5E9]/40"
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
                  <Shenja lloji={pika.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{pika.emri}</span>
                  <span className="block text-sm text-[#94A3B8]">{pika.vendi}</span>
                </span>
                <ArrowUpRight className={`h-4 w-4 shrink-0 ${aktive ? "text-[#0EA5E9]" : "text-zinc-500"}`} />
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#0EA5E9]/20 bg-[#0A0A0F] px-5 py-4 sm:flex-row">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">{pajisja.emri}. </span>
            {pajisja.tekst}
          </p>
          <Link
            href="/#kontakti"
            className="shrink-0 rounded-full bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
          >
            {t.perparesia.kerko} {pajisja.emri}
          </Link>
        </div>
      </div>
    </section>
  );
}
