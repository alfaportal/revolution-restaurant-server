import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { GjuhaProvider } from "@/i18n/gjuha";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Revolution POS — Sistemi POS për çdo biznes",
  description: "Revolution POS është sistemi POS për çdo biznes.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="sq" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <GjuhaProvider>{children}</GjuhaProvider>
      </body>
    </html>
  );
}
