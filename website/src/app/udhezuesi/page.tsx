import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Udhëzuesi — Revolution POS",
};

export default function Udhezuesi() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#09090b] px-6 pb-24 pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-white md:text-5xl">Udhëzuesi</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#94A3B8]">
            Udhëzuesi i përdorimit është i disponueshëm vetëm për klientët e licencuar. Kontaktoni ne për qasje.
          </p>
          <Link
            href="/#kontakti"
            className="mt-8 inline-block rounded-full bg-[#0EA5E9] px-6 py-3 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
          >
            Kontakti
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
