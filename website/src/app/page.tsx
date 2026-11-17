import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Perparesia from "@/components/Perparesia";
import Products from "@/components/Products";
import Fiskal from "@/components/Fiskal";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Perparesia />
      <Products />
      <Fiskal />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Contact />
      <Footer />
    </>
  );
}
