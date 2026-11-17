"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pamje from "@/components/Pamje";
import Perparesia from "@/components/Perparesia";
import type { Produkti } from "@/data/produktet";
import { useGjuha } from "@/i18n/gjuha";
import { tekstiIProduktit } from "@/i18n/produktet-gjuhe";

const fotot: Record<string, [string, string, string]> = {
  kafene: ["/pamje/kafene-arka.jpg", "/pamje/kafene-tavolinat.jpg", "/pamje/kafene-raporti.jpg"],
  hotel: ["/pamje/hotel-recepsioni.jpg", "/pamje/hotel-dhomat.jpg", "/pamje/hotel-fatura.jpg"],
  market: ["/pamje/market-arka.jpg", "/pamje/market-stoku.jpg", "/pamje/market-raporti.jpg"],
  furra: ["/pamje/furra-vitrina.jpg", "/pamje/furra-arka.jpg", "/pamje/furra-nderrimi.jpg"],
  dyqane: ["/pamje/dyqane-arka.jpg", "/pamje/dyqane-stoku.jpg", "/pamje/dyqane-raporti.jpg"],
  butika: ["/pamje/butika-arka.jpg", "/pamje/butika-madhesite.jpg", "/pamje/butika-fatura.jpg"],
  distributor: ["/pamje/distributor-fatura.jpg", "/pamje/distributor-magazina.jpg", "/pamje/distributor-pagesat.jpg"],
  argjendari: ["/pamje/argjendari-arka.jpg", "/pamje/argjendari-artikulli.jpg", "/pamje/argjendari-fatura.jpg"],
  barnatore: ["/pamje/barnatore-arka.jpg", "/pamje/barnatore-skadenca.jpg", "/pamje/barnatore-stoku.jpg"],
  fiskalizim: ["/pamje/fiskalizim-arka.jpg", "/pamje/fiskalizim-kuponi.jpg", "/pamje/fiskalizim-libri.jpg"],
  kontabilisti: ["/pamje/kontabilisti-bilanci.jpg", "/pamje/kontabilisti-tvsh.jpg", "/pamje/kontabilisti-librat.jpg"],
  security: ["/pamje/security-pikat.jpg", "/pamje/security-nderrimi.jpg", "/pamje/security-raporti.jpg"],
  mjekesia: ["/pamje/mjekesia-terminet.jpg", "/pamje/mjekesia-vizita.jpg", "/pamje/mjekesia-pagesa.jpg"],
  "posta-taxi": ["/pamje/posta-udhetimi.jpg", "/pamje/posta-fatura.jpg", "/pamje/posta-dita.jpg"],
  rentacar: ["/pamje/rentacar-mjetet.jpg", "/pamje/rentacar-kontrata.jpg", "/pamje/rentacar-kthimi.jpg"],
};

export default function FaqjaProduktit({ produkti: burimi }: { produkti: Produkti }) {
  const { t, gjuha } = useGjuha();
  const produkti = tekstiIProduktit(burimi, gjuha);
  return (
    <>
      <Navbar />
      <main className="bg-[#09090b] pt-28">
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">{produkti.emri}</p>
            <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">{produkti.titulli}</h1>
            <p className="mt-5 text-lg leading-relaxed text-[#94A3B8]">{produkti.hyrja}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {produkti.bizneset.map((lloji) => (
                <li key={lloji} className="rounded-full border border-white/15 bg-[#12121A] px-3 py-1 text-sm text-zinc-200">
                  {lloji}
                </li>
              ))}
            </ul>
            <Link
              href="/#kontakti"
              className="mt-8 inline-block rounded-full bg-[#0EA5E9] px-6 py-3 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            >
              {t.paketat.demo}
            </Link>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#94A3B8]">
              Udhëzuesi i përdorimit është i disponueshëm vetëm për klientët e licencuar. Kontaktoni ne për qasje.
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
            {produkti.pamjet.map((pamja, i) => (
              <Pamje key={fotot[burimi.slug][i]} emri={produkti.emri} nentitulli={pamja} foto={fotot[burimi.slug][i]} />
            ))}
          </div>
        </section>

        <section className="bg-[#12121A] px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-white">{t.faqja.cka}</h2>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {produkti.vecorite.map((pika) => (
                <li
                  key={pika}
                  className="rounded-xl border border-white/10 bg-[#0A0A0F] px-4 py-3 text-sm text-zinc-200"
                >
                  <span className="text-[#0EA5E9]">✓ </span>
                  {pika}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Perparesia kompakt />

        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-white">{t.paketat.titulli}</h2>
            <p className="mt-3 text-center text-sm text-[#94A3B8]">{t.paketat.nentitulli}</p>
            <div
              className={`mt-8 grid grid-cols-1 gap-4 ${produkti.paketat.length >= 5 ? "md:grid-cols-2 xl:grid-cols-3" : produkti.paketat.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : produkti.paketat.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}
            >
              {produkti.paketat.map((paketa) => (
                <article
                  key={paketa.emri}
                  className={`rounded-2xl border bg-[#12121A] p-6 ${paketa.popullor ? "border-[#0EA5E9]" : "border-[#0EA5E9]/15"}`}
                >
                  {paketa.popullor ? (
                    <p className="mb-3 inline-block rounded-full bg-[#0EA5E9] px-3 py-1 text-xs font-semibold text-white">
                      {t.paketat.popullor}
                    </p>
                  ) : null}
                  <h3 className="text-lg font-semibold text-white">{paketa.emri}</h3>
                  {paketa.cmimi ? (
                    <p className="mt-2 text-3xl font-bold text-white">
                      {paketa.cmimi}
                      <span className="ml-1 text-base font-medium text-[#94A3B8]">/{t.cmimet.neVit}</span>
                    </p>
                  ) : null}
                  <ul className="mt-5 flex flex-col gap-2">
                    {paketa.pikat.map((pika) => (
                      <li key={pika} className="text-sm text-[#94A3B8]">
                        <span className="text-[#0EA5E9]">✓ </span>
                        {pika}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/#kontakti"
                    className="mt-6 block rounded-full border border-white/30 py-2.5 text-center text-sm font-semibold text-white hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
                  >
                    {t.paketat.demo}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <p className="px-6 pb-16 text-center">
          <Link href="/" className="text-sm text-[#0EA5E9] hover:underline">
            {t.faqja.kthehu}
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
