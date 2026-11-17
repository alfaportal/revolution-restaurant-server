"use client";

import { useState } from "react";
import { PRODUKTET_MANUAL } from "@/lib/manualet-lista";

type Rreshti = {
  token: string;
  product: string;
  used: boolean;
  created: string;
  email: string;
  link: string;
};

export default function ManualetAdmin() {
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [hapur, setHapur] = useState(false);
  const [gabim, setGabim] = useState("");
  const [lista, setLista] = useState<Rreshti[]>([]);
  const [produkti, setProdukti] = useState<string>(PRODUKTET_MANUAL[0]);
  const [email, setEmail] = useState("");
  const [linkuRi, setLinkuRi] = useState("");

  async function hyr(event: React.FormEvent) {
    event.preventDefault();
    setGabim("");
    const pergjigja = await fetch("/api/admin/manuals", {
      headers: { "x-manual-password": fjalekalimi },
    });
    if (!pergjigja.ok) {
      setGabim("Fjalëkalimi nuk është i saktë.");
      return;
    }
    const data = (await pergjigja.json()) as { lista: Rreshti[] };
    setLista(data.lista);
    setHapur(true);
  }

  async function rifresko() {
    const pergjigja = await fetch("/api/admin/manuals", {
      headers: { "x-manual-password": fjalekalimi },
    });
    if (!pergjigja.ok) return;
    const data = (await pergjigja.json()) as { lista: Rreshti[] };
    setLista(data.lista);
  }

  async function krijo(event: React.FormEvent) {
    event.preventDefault();
    setGabim("");
    setLinkuRi("");
    const pergjigja = await fetch("/api/admin/manuals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-manual-password": fjalekalimi,
      },
      body: JSON.stringify({ product: produkti, email }),
    });
    const data = (await pergjigja.json()) as { link?: string; gabim?: string };
    if (!pergjigja.ok || !data.link) {
      setGabim(data.gabim || "Nuk u krijua.");
      return;
    }
    setLinkuRi(data.link);
    setEmail("");
    await rifresko();
  }

  async function kopjo(link: string) {
    await navigator.clipboard.writeText(link);
  }

  if (!hapur) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
        <form onSubmit={hyr} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121A] p-6">
          <h1 className="text-xl font-semibold">Udhëzuesit</h1>
          <input
            type="password"
            value={fjalekalimi}
            onChange={(event) => setFjalekalimi(event.target.value)}
            placeholder="Fjalëkalimi"
            className="mt-4 w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-4 py-3 outline-none"
          />
          {gabim ? <p className="mt-3 text-sm text-red-300">{gabim}</p> : null}
          <button type="submit" className="mt-4 w-full rounded-full bg-[#0EA5E9] py-3 font-semibold">
            Hyr
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Udhëzuesit për klientët</h1>
        <form onSubmit={krijo} className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#12121A] p-5 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-2 text-sm text-[#94A3B8]">
            Programi
            <select
              value={produkti}
              onChange={(event) => setProdukti(event.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-[#0A0A0F] px-3 text-white"
            >
              {PRODUKTET_MANUAL.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-2 text-sm text-[#94A3B8]">
            Email i klientit
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-[#0A0A0F] px-3 text-white"
            />
          </label>
          <button type="submit" className="h-12 rounded-full bg-[#0EA5E9] px-5 font-semibold">
            Krijo linkun
          </button>
        </form>
        {gabim ? <p className="mt-3 text-sm text-red-300">{gabim}</p> : null}
        {linkuRi ? (
          <p className="mt-3 break-all text-sm text-[#7dd3fc]">
            {linkuRi}{" "}
            <button type="button" className="underline" onClick={() => kopjo(linkuRi)}>
              Kopjo
            </button>
          </p>
        ) : null}
        <ul className="mt-8 flex flex-col gap-3">
          {lista.map((rreshti) => (
            <li key={rreshti.token} className="rounded-2xl border border-white/10 bg-[#12121A] p-4">
              <p className="font-semibold">
                {rreshti.product} · {rreshti.email}
              </p>
              <p className="mt-1 text-sm text-[#94A3B8]">
                {rreshti.created} · {rreshti.used ? "përdorur" : "i papërdorur"}
              </p>
              <button type="button" className="mt-2 text-sm text-[#0EA5E9]" onClick={() => kopjo(rreshti.link)}>
                Kopjo linkun
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
