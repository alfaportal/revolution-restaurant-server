import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FormaKycu from "./FormaKycu";

export const metadata: Metadata = {
  title: "Kyçu — Revolution POS",
};

export default function Kycu() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#09090b] px-6 pb-24 pt-16">
        <FormaKycu />
      </main>
      <Footer />
    </>
  );
}
