import type { Metadata } from "next";
import FaqeLigjore from "@/components/FaqeLigjore";

export const metadata: Metadata = {
  title: "Kushtet e përdorimit — Revolution POS",
};

export default function Kushtet() {
  return <FaqeLigjore lloji="kushtet" />;
}
