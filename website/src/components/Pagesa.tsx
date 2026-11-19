"use client";

import { useEffect, useState } from "react";

type Pako = { plan: string; emri: string; cmimi: string; programi: string };
type Banka = { company: string; bank: string; account: string; currency: string; nui: string };
type Forma = "kartë" | "bankë" | null;

const bankat = [
  { id: "teb", emri: "TEB" },
  { id: "raiffeisen", emri: "Raiffeisen" },
  { id: "nlb", emri: "NLB" },
  { id: "bkt", emri: "BKT" },
  { id: "procredit", emri: "ProCredit" },
  { id: "bpb", emri: "BPB" },
];

function ShenjaKartes({ id }: { id: string }) {
  if (id === "stripe") {
    return (
      <svg viewBox="0 0 92 36" className="h-9 w-[5.75rem]" aria-hidden="true">
        <rect width="92" height="36" rx="6" fill="#ffffff" />
        <text x="46" y="24" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#635bff">Stripe</text>
      </svg>
    );
  }
  if (id === "visa") {
    return (
      <svg viewBox="0 0 72 36" className="h-9 w-[4.5rem]" aria-hidden="true">
        <rect width="72" height="36" rx="6" fill="#1a1f71" />
        <text x="36" y="24" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="900" letterSpacing="1" fill="#ffffff">VISA</text>
      </svg>
    );
  }
  if (id === "mc") {
    return (
      <svg viewBox="0 0 72 36" className="h-9 w-[4.5rem]" aria-hidden="true">
        <rect width="72" height="36" rx="6" fill="#ffffff" />
        <circle cx="30" cy="18" r="10" fill="#eb001b" />
        <circle cx="42" cy="18" r="10" fill="#f79e1b" />
        <path d="M36 9.4a10 10 0 0 1 0 17.2 10 10 0 0 1 0-17.2z" fill="#ff5f00" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 92 36" className="h-9 w-[5.75rem]" aria-hidden="true">
      <rect width="92" height="36" rx="6" fill="#ffffff" />
      <text x="46" y="24" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="800" fontStyle="italic" fill="#003087">PayPal</text>
    </svg>
  );
}

function ShenjaBankes({ id }: { id: string }) {
  const markat: Record<string, { bg: string; fg: string; label: string; size: number }> = {
    teb: { bg: "#006b3f", fg: "#ffffff", label: "TEB", size: 18 },
    raiffeisen: { bg: "#ffe600", fg: "#111111", label: "Raiffeisen", size: 13 },
    nlb: { bg: "#003d7a", fg: "#ffffff", label: "NLB", size: 18 },
    bkt: { bg: "#c8102e", fg: "#ffffff", label: "BKT", size: 18 },
    procredit: { bg: "#005ca9", fg: "#ffffff", label: "ProCredit", size: 14 },
    bpb: { bg: "#e30613", fg: "#ffffff", label: "BPB", size: 18 },
  };
  const m = markat[id] || markat.bpb;
  return (
    <svg viewBox="0 0 160 40" className="h-10 w-full" aria-hidden="true">
      <rect width="160" height="40" rx="6" fill={m.bg} />
      <text x="80" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={m.size} fontWeight="800" fill={m.fg}>
        {m.label}
      </text>
    </svg>
  );
}

function lexoPakon(): Pako | null {
  try {
    const raw = sessionStorage.getItem("revolution-pako");
    if (!raw) return null;
    return JSON.parse(raw) as Pako;
  } catch {
    return null;
  }
}

export default function Pagesa() {
  const [pako, setPako] = useState<Pako | null>(null);
  const [forma, setForma] = useState<Forma>(null);
  const [banka, setBanka] = useState("raiffeisen");
  const [llogaria, setLlogaria] = useState<Banka | null>(null);
  const [mesazhi, setMesazhi] = useState("");
  const [duke, setDuke] = useState(false);
  const [emri, setEmri] = useState("");
  const [biznesi, setBiznesi] = useState("");
  const [email, setEmail] = useState("");
  const [telefoni, setTelefoni] = useState("");
  const [tipi, setTipi] = useState("kafene");

  useEffect(() => {
    const rifresko = () => setPako(lexoPakon());
    rifresko();
    window.addEventListener("revolution-pako", rifresko);
    return () => window.removeEventListener("revolution-pako", rifresko);
  }, []);

  function mbyll() {
    setForma(null);
    setMesazhi("");
    setDuke(false);
  }

  function kontrollo(): boolean {
    if (!pako) {
      setMesazhi("Zgjidhni një pako te Çmimet, pastaj paguani këtu.");
      document.getElementById("cmimet")?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    if (!pako.plan || pako.plan === "p4") {
      setMesazhi("Kjo pako paguhet me kontakt.");
      return false;
    }
    setMesazhi("");
    return true;
  }

  async function hapKarten() {
    if (!kontrollo()) return;
    setForma("kartë");
  }

  async function hapBanken(id: string) {
    if (!kontrollo()) return;
    setBanka(id);
    setForma("bankë");
    setLlogaria(null);
    try {
      const res = await fetch("/api/payments/bank-transfer");
      const data = (await res.json()) as Banka & { ok?: boolean; account?: string };
      if (res.ok && data.ok && data.account) setLlogaria(data);
    } catch {
      setLlogaria(null);
    }
  }

  async function dergo(event: React.FormEvent) {
    event.preventDefault();
    if (!pako?.plan || pako.plan === "p4") return;
    if (!emri.trim() || !biznesi.trim() || !email.trim()) {
      setMesazhi("Shkruani emrin, biznesin dhe email-in.");
      return;
    }
    setDuke(true);
    setMesazhi("");
    try {
      if (forma === "kartë") {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: pako.plan,
            emri: emri.trim(),
            emri_biznesit: biznesi.trim(),
            email: email.trim(),
            telefoni: telefoni.trim(),
            tipi,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; url?: string; gabim?: string };
        if (!res.ok || !data.ok || !data.url) throw new Error(data.gabim || "Pagesa nuk u hap.");
        window.location.href = data.url;
        return;
      }
      const res = await fetch("/api/payments/bank-transfer/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: pako.plan,
          bank: banka,
          emri: emri.trim(),
          emri_biznesit: biznesi.trim(),
          email: email.trim(),
          telefoni: telefoni.trim(),
          tipi,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; gabim?: string };
      if (!res.ok || !data.ok) throw new Error(data.gabim || "Kërkesa nuk u dërgua.");
      setMesazhi(data.message || "Kërkesa u dërgua. Fatura del pasi të shihet pagesa në bankë.");
    } catch (err) {
      setMesazhi(err instanceof Error ? err.message : "Nuk u krye.");
    } finally {
      setDuke(false);
    }
  }

  return (
    <section id="pagesa" className="bg-[#09090b] px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Pagesa</h2>
        <p className="mt-3 text-[#94a3b8]">
          Paguani me kartë ose me bankat vendore — zgjidhni mënyrën që ju përshtatet.
        </p>
        {pako ? (
          <p className="mt-3 text-sm font-semibold text-white">
            {pako.programi} · {pako.emri} · {pako.cmimi}
          </p>
        ) : null}
      </div>

      <div className="mx-auto mt-12 flex max-w-xl flex-col gap-10 text-left">
        <div>
          <h3 className="text-lg font-bold">Kartë bankare</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Visa, Mastercard dhe pagesë online</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ShenjaKartes id="stripe" />
            <ShenjaKartes id="visa" />
            <ShenjaKartes id="mc" />
            <ShenjaKartes id="paypal" />
          </div>
          <button
            type="button"
            onClick={hapKarten}
            className="mt-6 w-full rounded-full bg-white py-3 text-sm font-semibold text-[#09090b] transition hover:bg-zinc-200"
          >
            Vazhdo me pagesë
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold">Banka vendore</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Transfer bankar te llogaria e Revolution Invest</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {bankat.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-label={b.emri}
                onClick={() => hapBanken(b.id)}
                className="rounded-xl border border-[#e2e8f0] bg-white p-2 transition hover:border-[#e63946]"
              >
                <ShenjaBankes id={b.id} />
              </button>
            ))}
          </div>
        </div>
        {mesazhi && !forma ? <p className="text-center text-sm font-semibold">{mesazhi}</p> : null}
      </div>

      {forma ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={mbyll}>
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={dergo}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121A] p-6 text-left text-white"
          >
            <h3 className="text-xl font-bold">{forma === "kartë" ? "Pagesa me kartë" : "Pagesë me transfer bankar"}</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {pako?.emri} · {pako?.cmimi}
            </p>
            {forma === "bankë" && llogaria ? (
              <div className="mt-4 rounded-xl bg-[#09090b] p-3 text-sm">
                <p>{llogaria.company}</p>
                <p>{llogaria.bank}</p>
                <p className="font-bold">{llogaria.account}</p>
                <p>
                  {llogaria.currency} · {llogaria.nui}
                </p>
              </div>
            ) : null}
            <label className="mt-4 block text-sm">
              Emri juaj
              <input required value={emri} onChange={(e) => setEmri(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-white" />
            </label>
            <label className="mt-3 block text-sm">
              Emri i biznesit
              <input required value={biznesi} onChange={(e) => setBiznesi(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-white" />
            </label>
            <label className="mt-3 block text-sm">
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-white" />
            </label>
            <label className="mt-3 block text-sm">
              Telefoni
              <input value={telefoni} onChange={(e) => setTelefoni(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-white" />
            </label>
            <label className="mt-3 block text-sm">
              Lloji i biznesit
              <select value={tipi} onChange={(e) => setTipi(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#09090b] px-3 text-white">
                <option value="restorant">Restorant</option>
                <option value="kafene">Kafene</option>
                <option value="dyqan">Dyqan</option>
              </select>
            </label>
            {mesazhi ? <p className="mt-3 text-sm font-semibold">{mesazhi}</p> : null}
            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={duke} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#09090b] transition hover:bg-zinc-200">
                {duke ? "Duke hapur…" : forma === "kartë" ? "Vazhdo me pagesë" : "Dërgo kërkesën"}
              </button>
              <button type="button" onClick={mbyll} className="rounded-full border border-white/20 px-5 py-3 text-sm">
                Anulo
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
