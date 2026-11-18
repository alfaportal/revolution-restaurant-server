"use client";

import { useState } from "react";
import { useGjuha } from "@/i18n/gjuha";
import { produktiNgaSlug } from "@/data/produktet";

function euro(cmimi: string) {
  const n = Number(cmimi.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const bizneset = [
  { emri: "KAFENE", slug: "kafene" },
  { emri: "HOTEL", slug: "hotel" },
  { emri: "MARKET", slug: "market" },
  { emri: "FURRA", slug: "furra" },
  { emri: "DYQANE", slug: "dyqane" },
  { emri: "BUTIKA", slug: "butika" },
  { emri: "DISTRIBUTOR", slug: "distributor" },
  { emri: "ARGJENDARI", slug: "argjendari" },
  { emri: "BARNATORE", slug: "barnatore" },
  { emri: "FISKALIZIM", slug: "fiskalizim" },
  { emri: "KONTABILISTI", slug: "kontabilisti" },
  { emri: "SECURITY", slug: "security" },
  { emri: "MJEKËSIA", slug: "mjekesia" },
  { emri: "POSTA / TAXI", slug: "posta-taxi" },
  { emri: "RENTACAR", slug: "rentacar" },
];

export default function Pricing() {
  const { t } = useGjuha();
  const [slug, setSlug] = useState(bizneset[0].slug);
  const [sa, setSa] = useState(3);
  const produkti = produktiNgaSlug(slug);
  const paketat = produkti?.paketat ?? [];

  return (
    <section id="cmimet" className="bg-[#0A0A0F] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{t.cmimet.sy}</p>
      <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">{t.cmimet.titulli}</h2>
      <p className="mt-4 text-center text-[#94A3B8]">{t.cmimet.nentitulli}</p>

      <div className="mx-auto mt-10 grid w-full max-w-6xl items-start gap-8 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-[#94A3B8]">
          {t.cmimet.programi}
          <select
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-12 rounded-xl border border-white/10 bg-[#12121A] px-3 text-white outline-none focus:border-[#0EA5E9]"
          >
            {bizneset.map((biznesi) => (
              <option key={biznesi.slug} value={biznesi.slug}>
                {biznesi.emri}
              </option>
            ))}
          </select>
        </label>
        {!produkti?.spiashpejti ? (
          <div>
            <h3 className="text-sm text-[#94A3B8]">{t.cmimet.llogaria}</h3>
            <div className="mt-2 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-[#12121A] text-[#94A3B8]">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t.cmimet.programi}</th>
                    <th className="px-4 py-3 font-medium">{t.cmimet.nje}</th>
                    <th className="px-4 py-3 font-medium">{t.cmimet.dy}</th>
                    <th className="px-4 py-3 font-medium">
                      <label className="flex items-center gap-2">
                        {t.cmimet.sa}
                        <input
                          type="number"
                          min={1}
                          value={sa}
                          onChange={(event) => setSa(Math.max(1, Number(event.target.value) || 1))}
                          className="h-9 w-16 rounded-lg border border-white/10 bg-[#0A0A0F] px-2 text-white outline-none focus:border-[#0EA5E9]"
                        />
                      </label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paketat.map((paketa) => {
                    const n = euro(paketa.cmimi);
                    return (
                      <tr key={`${slug}-${paketa.emri}`} className="border-t border-white/10">
                        <td className="px-4 py-3">{paketa.emri}</td>
                        <td className="px-4 py-3">€{n}</td>
                        <td className="px-4 py-3">€{n * 2}</td>
                        <td className="px-4 py-3 font-semibold">€{n * sa}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>

      {produkti?.spiashpejti ? (
        <div className="mx-auto mt-10 max-w-xl text-center">
          <p className="text-2xl font-bold text-white">Së shpejti — Kontaktoni për më shumë</p>
          <a
            href="#kontakti"
            className="mt-8 inline-block rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
          >
            Kontaktoni
          </a>
        </div>
      ) : (
        <div key={slug}>
        <h3 className="mt-10 text-center text-2xl font-bold text-white">{produkti?.emri}</h3>
        <div
          className={`mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-4 ${paketat.length >= 5 ? "md:grid-cols-2 xl:grid-cols-3" : paketat.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : paketat.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}
        >
          {paketat.map((paketa, index) => (
            <article
              key={`${slug}-${paketa.emri}`}
              className={`relative flex flex-col rounded-2xl border bg-[#12121A] p-6 ${paketa.popullor ? "border-[#0EA5E9]" : "border-[#0EA5E9]/10"}`}
            >
              {paketa.popullor ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0EA5E9] px-3 py-1 text-xs text-white">
                  {t.paketat.popullor}
                </span>
              ) : null}
              <h3 className="text-xl font-semibold text-white">{paketa.emri}</h3>
              <p className="mt-3 text-3xl font-bold text-white">
                {index === 0 ? <span className="mr-2 text-base font-medium text-[#94A3B8]">{t.cmimet.nga}</span> : null}
                {paketa.cmimi}
                <span className="ml-1 text-base font-medium text-[#94A3B8]">/{t.cmimet.neVit}</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {paketa.pikat.map((pika) => (
                  <li key={pika} className="text-sm text-[#94A3B8]">
                    <span className="text-[#0EA5E9]">✓ </span>
                    {pika}
                  </li>
                ))}
              </ul>
              <a
                href="#pagesa"
                onClick={() => {
                  const n = euro(paketa.cmimi);
                  const plan = n === 150 ? "p1" : n === 180 ? "p2" : n === 220 ? "p3" : n === 250 ? "p4" : "";
                  sessionStorage.setItem(
                    "revolution-pako",
                    JSON.stringify({ plan, emri: paketa.emri, cmimi: paketa.cmimi, programi: produkti?.emri || "" }),
                  );
                  window.dispatchEvent(new Event("revolution-pako"));
                }}
                className="mt-8 rounded-full border border-white/40 px-4 py-3 text-center text-sm font-semibold text-white hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
              >
                {t.paketat.demo}
              </a>
            </article>
          ))}
        </div>
        </div>
      )}
      {produkti?.spiashpejti ? null : <p className="mt-8 text-center text-sm text-[#94A3B8]">{t.cmimet.prova}</p>}
    </section>
  );
}
