"use client";

import { useState } from "react";
import Link from "next/link";
import logo from "@/assets/revolution-marka.png";
import { grupet, produktiNgaSlug } from "@/data/produktet";
import { Gjuhet, useGjuha } from "@/i18n/gjuha";

export default function Navbar() {
  const { t } = useGjuha();
  const links = [
    { href: "/#fiskalizimi", label: t.nav.fiskalizimi },
    { href: "/#si-funksionon", label: t.nav.si },
    { href: "/#cmimet", label: t.nav.cmimet },
    { href: "/#pagesa", label: t.nav.pagesa },
    { href: "/#pyetjet", label: t.nav.pyetjet },
    { href: "/#kontakti", label: t.nav.kontakti },
    { href: "/udhezuesi", label: t.nav.udhezuesi },
  ];
  const [open, setOpen] = useState(false);
  const [produktetHapur, setProduktetHapur] = useState(false);

  return (
    <header className="relative z-50 bg-[#0A0A0F]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-24 items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <img src={logo.src} alt="" className="h-16 w-auto" />
          <span className="text-xl font-semibold tracking-wide text-white">Revolution POS</span>
        </Link>

        <div className="flex items-center gap-2">
          <Gjuhet />
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/#kontakti"
              className="rounded-full border border-white/40 bg-transparent px-4 py-2 text-sm text-white transition-colors duration-200 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
            >
              {t.nav.kycu}
            </a>
            <a
              href="/#kontakti"
              className="rounded-full bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            >
              {t.nav.fillo}
            </a>
          </div>
          <button
            type="button"
            className="flex flex-col gap-1.5 lg:hidden"
            aria-label={open ? t.nav.mbyll : t.nav.hap}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-6 bg-white" />
          </button>
        </div>
        </div>

        <nav className="hidden items-center justify-center gap-6 pb-4 lg:flex">
          <a
            href="/#ballina"
            className="text-sm text-white transition-colors duration-200 hover:text-[#0EA5E9]"
          >
            {t.nav.ballina}
          </a>
          <div
            className="group relative"
            onMouseEnter={() => setProduktetHapur(true)}
            onMouseLeave={() => setProduktetHapur(false)}
          >
            <button
              type="button"
              className="text-sm text-white hover:text-[#0EA5E9]"
              aria-expanded={produktetHapur}
              onClick={() => setProduktetHapur(true)}
            >
              {t.nav.produktet}
            </button>
            <div className={`absolute left-1/2 top-full z-50 w-[680px] -translate-x-1/2 pt-4 ${produktetHapur ? "block" : "hidden"} group-hover:block`}>
                <div className="grid grid-cols-4 gap-4 rounded-2xl border border-white/10 bg-[#0A0A0F] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                  {grupet.map((grupi) => (
                    <div key={grupi.titulli}>
                      <p className="text-[11px] font-medium tracking-[0.16em] text-[#0EA5E9]">
                        {t.grupet[grupi.titulli as keyof typeof t.grupet]}
                      </p>
                      <ul className="mt-3 flex flex-col gap-2">
                        {grupi.sluget.map((slug) => {
                          const produkti = produktiNgaSlug(slug);
                          if (!produkti) return null;
                          return (
                            <li key={slug}>
                              <Link
                                href={`/${slug}`}
                                className="text-sm text-zinc-300 hover:text-white"
                                onClick={() => setProduktetHapur(false)}
                              >
                                {produkti.emri}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
            </div>
          </div>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white transition-colors duration-200 hover:text-[#0EA5E9]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {open ? (
        <div className="fixed inset-0 top-24 z-40 overflow-auto bg-[#0A0A0F] px-6 py-8 lg:hidden">
          <a
            href="/#ballina"
            className="mb-6 block text-lg text-white"
            onClick={() => setOpen(false)}
          >
            {t.nav.ballina}
          </a>
          {grupet.map((grupi) => (
            <div key={grupi.titulli} className="mb-6">
              <p className="text-xs tracking-[0.16em] text-[#0EA5E9]">
                {t.grupet[grupi.titulli as keyof typeof t.grupet]}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {grupi.sluget.map((slug) => {
                  const produkti = produktiNgaSlug(slug);
                  if (!produkti) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/${slug}`}
                        className="text-lg text-white"
                        onClick={() => setOpen(false)}
                      >
                        {produkti.emri}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="mt-4 flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-lg text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
