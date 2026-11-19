import type { Metadata } from "next";
import FaqeLigjore from "@/components/FaqeLigjore";

export const metadata: Metadata = {
  title: "Politika e privatësisë — Revolution POS",
};

export default function Privatesia() {
  return <FaqeLigjore lloji="privatesia" />;
}
