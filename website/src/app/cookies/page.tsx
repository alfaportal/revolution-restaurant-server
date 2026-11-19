import type { Metadata } from "next";
import FaqeLigjore from "@/components/FaqeLigjore";

export const metadata: Metadata = {
  title: "Politika e cookies — Revolution POS",
};

export default function Cookies() {
  return <FaqeLigjore lloji="cookies" />;
}
