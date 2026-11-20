import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FormaHap from "./FormaHap";

export const metadata: Metadata = {
  title: "Hap Programin — Revolution POS",
};

export default function Hap() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#09090b] px-6 pb-24 pt-10">
        <FormaHap />
      </main>
      <Footer />
    </>
  );
}
