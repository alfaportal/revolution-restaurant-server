"use client";

import Link from "next/link";
import logo from "@/assets/revolution-marka.png";
import { produktet } from "@/data/produktet";
import { useGjuha } from "@/i18n/gjuha";

export default function Footer() {
  const { t } = useGjuha();
  const faqja = [
    { href: "/#ballina", label: t.footer.ballina },
    { href: "/#produktet", label: t.nav.produktet },
    { href: "/#fiskalizimi", label: t.nav.fiskalizimi },
    { href: "/#si-funksionon", label: t.footer.si },
    { href: "/#cmimet", label: t.nav.cmimet },
    { href: "/#pagesa", label: t.nav.pagesa },
    { href: "/#pyetjet", label: t.nav.pyetjet },
    { href: "/#kontakti", label: t.nav.kontakti },
  ];
  return (
    <footer className="border-t border-[#0EA5E9]/10 bg-[#0A0A0F] px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-[1.1fr_1.4fr_0.8fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <img src={logo.src} alt="" className="h-20 w-auto" />
            <span className="text-2xl font-semibold tracking-wide text-white">Revolution POS</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[#94A3B8]">
            {t.footer.tekst}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{t.footer.produktet}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {produktet.map((produkti) => (
              <li key={produkti.slug}>
                <Link
                  href={`/${produkti.slug}`}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]"
                >
                  {produkti.emri}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{t.footer.faqja}</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {faqja.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-[#0EA5E9]/10 pt-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{t.footer.kompania}</h2>
            <p className="mt-3 text-sm text-white">Revolution Invest SH.P.K.</p>
            <p className="mt-1 text-sm text-[#94A3B8]">{t.footer.vendi}</p>
            <a href="mailto:revolutioninvest05@gmail.com" className="mt-1 block text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
              revolutioninvest05@gmail.com
            </a>
            <a href="tel:+38348707880" className="mt-1 block text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
              +383 48 707 880
            </a>
            <a href="https://wa.me/38348707880" className="mt-1 block text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
              WhatsApp
            </a>
            <a href="/#kontakti" className="mt-1 block text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
              {t.nav.kontakti}
            </a>
          </div>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/privatesia" className="text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
                {t.footer.privatesia}
              </Link>
            </li>
            <li>
              <Link href="/kushtet" className="text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
                {t.footer.kushtet}
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-sm text-[#94A3B8] transition-colors hover:text-[#0EA5E9]">
                {t.footer.cookies}
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-8 text-center text-sm text-[#94A3B8]">© 2026 Revolution POS</p>
      </div>
    </footer>
  );
}
