import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FaqjaProduktit from "@/components/FaqjaProduktit";
import { produktet, produktiNgaSlug } from "@/data/produktet";

export function generateStaticParams() {
  return produktet.map((produkti) => ({ slug: produkti.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produkti = produktiNgaSlug(slug);
  if (!produkti) return { title: "Revolution POS" };
  return {
    title: `${produkti.emri} — Revolution POS`,
    description: produkti.hyrja,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produkti = produktiNgaSlug(slug);
  if (!produkti) notFound();
  return <FaqjaProduktit produkti={produkti} />;
}
