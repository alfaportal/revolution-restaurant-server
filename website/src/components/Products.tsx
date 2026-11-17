"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { produktet } from "@/data/produktet";
import { useGjuha } from "@/i18n/gjuha";
import { tekstiIProduktit } from "@/i18n/produktet-gjuhe";

export default function Products() {
  const { t, gjuha } = useGjuha();
  return (
    <section id="produktet" className="bg-[#09090b] px-6 py-24">
      <p className="text-center text-sm font-medium tracking-[0.2em] text-[#0EA5E9]">
        {t.produktet.sy}
      </p>
      <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
        {t.produktet.titulli}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[#94A3B8]">
        {t.produktet.nentitulli}
      </p>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {produktet.map((burimi, index) => {
          const product = tekstiIProduktit(burimi, gjuha);
          return (
          <motion.div
            key={product.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: (index % 6) * 0.05 }}
          >
            <Link
              href={`/${product.slug}`}
              className="block rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#0EA5E9]/50 hover:shadow-[0_0_36px_rgba(14,165,233,0.12)]"
            >
              <img
                src={product.foto}
                alt={product.pershkrimi}
                className="aspect-video w-full rounded-xl object-cover"
              />
              <h3 className="mt-4 font-semibold text-white">{product.emri}</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">{product.pershkrimi}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {product.pikat.map((pika) => (
                  <li key={pika} className="text-sm text-zinc-300">
                    <span className="text-[#0EA5E9]">✓ </span>
                    {pika}
                  </li>
                ))}
              </ul>
            </Link>
          </motion.div>
          );
        })}
      </div>
    </section>
  );
}
