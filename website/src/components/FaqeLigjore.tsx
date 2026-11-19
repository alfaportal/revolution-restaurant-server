"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ligjore, type LlojLigjor } from "@/data/ligjore";
import { useGjuha } from "@/i18n/gjuha";

export default function FaqeLigjore({ lloji }: { lloji: LlojLigjor }) {
  const { gjuha, t } = useGjuha();
  const faqe = ligjore[lloji][gjuha === "sq" ? "sq" : "en"];
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#09090b] px-6 pb-24 pt-10">
        <article className="mx-auto max-w-3xl text-base leading-relaxed text-[#94A3B8] [&_a]:text-[#0EA5E9] [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_strong]:text-white [&_ul]:mt-3">
          <h1 className="text-4xl font-bold text-white">{faqe.titulli}</h1>
          <p className="mt-3 text-sm">{faqe.data}</p>
          <div dangerouslySetInnerHTML={{ __html: faqe.html }} />
          <Link href="/" className="mt-10 inline-block text-sm text-[#0EA5E9]">
            {t.faqja.kthehu}
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
