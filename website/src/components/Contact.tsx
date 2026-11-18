"use client";

import { motion } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from "react";
import { useGjuha } from "@/i18n/gjuha";

const bizneset = [
  "KAFENE",
  "HOTEL",
  "MARKET",
  "FURRA",
  "DYQANE",
  "BUTIKA",
  "DISTRIBUTOR",
  "ARGJENDARI",
  "BARNATORE",
  "FISKALIZIM",
  "KONTABILISTI",
  "SECURITY",
  "MJEKËSIA",
  "POSTA/TAXI",
  "RENTACAR",
];

const fieldClass =
  "w-full rounded-xl border border-[#0EA5E9]/15 bg-[#0A0A0F] px-4 py-3 text-white placeholder-[#94A3B8] outline-none transition focus:border-[#0EA5E9]";

export default function Contact() {
  const { t } = useGjuha();
  const [derguar, setDerguar] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const emri = String(data.get("emri") || "").trim();
    const email = String(data.get("email") || "").trim();
    const telefoni = String(data.get("telefoni") || "").trim();
    if (!emri || !email || !telefoni) return;
    setDerguar(true);
  }

  return (
    <section id="kontakti" className="bg-[#12121A] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{t.kontakt.sy}</p>
      <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
        {t.kontakt.titulli}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[#94A3B8]">
        {t.kontakt.nentitulli}
      </p>

      <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-12 md:flex-row">
        <motion.div
          className="flex flex-1 flex-col gap-4"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-[#0EA5E9]/15 bg-[#0A0A0F] p-5">
            <p className="text-sm text-[#94A3B8]">{t.kontakt.vendi}</p>
            <p className="mt-1 font-semibold text-white">{t.kontakt.qyteti}</p>
          </div>
          <div className="rounded-2xl border border-[#0EA5E9]/15 bg-[#0A0A0F] p-5">
            <p className="text-sm text-[#94A3B8]">{t.kontakt.email}</p>
            <p className="mt-1 font-semibold text-white">info@revolution-pos.com</p>
          </div>
          <div className="rounded-2xl border border-[#0EA5E9]/20 bg-[#0EA5E9]/10 p-5">
            <p className="font-semibold text-white">{t.kontakt.sheh}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-300">
              {t.kontakt.pikat.map((pika) => (
                <li key={pika}><span className="text-[#0EA5E9]">✓ </span>{pika}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {derguar ? (
          <div className="flex flex-1 items-center rounded-2xl border border-[#0EA5E9]/30 bg-[#0A0A0F] p-8">
            <p className="text-lg text-white">
              {t.kontakt.faleminderit}
            </p>
          </div>
        ) : (
          <motion.form
            className="flex flex-1 flex-col gap-4"
            onSubmit={onSubmit}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <input className={fieldClass} name="emri" aria-label={t.kontakt.emri} placeholder={t.kontakt.emri} required />
            <select className={fieldClass} name="biznesi" aria-label={t.kontakt.programi} defaultValue="KAFENE">
              {bizneset.map((emri) => (
                <option key={emri}>{emri}</option>
              ))}
            </select>
            <input className={fieldClass} name="telefoni" aria-label={t.kontakt.telefoni} placeholder={t.kontakt.telefoni} required />
            <input className={fieldClass} type="email" name="email" aria-label={t.kontakt.email} placeholder={t.kontakt.email} required />
            <textarea className={fieldClass} name="mesazhi" rows={4} aria-label={t.kontakt.mesazhi} placeholder={t.kontakt.mesazhi} />
            <button
              type="submit"
              className="w-full rounded-full bg-[#0EA5E9] py-3 font-semibold text-white transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            >
              {t.kontakt.dergo}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
