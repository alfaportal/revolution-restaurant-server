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

function ShenjaBankes({ id }: { id: string }) {
  if (id === "teb") {
    return (
      <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
        <rect width="148" height="44" rx="8" fill="#163528" />
        <path d="M16 32c10-16 16-20 26-22" fill="none" stroke="#9fb8a8" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M38 10c2 3 2 5 0 8 3-1 6-1 8 1-4-5-6-8-8-9z" fill="#9fb8a8" />
        <text x="92" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" fill="#e8ebe9">TEB</text>
      </svg>
    );
  }
  if (id === "raiffeisen") {
    return (
      <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
        <rect width="148" height="44" rx="8" fill="#3a3520" />
        <path d="M14 32 L26 14 L38 32 M26 14 L38 32 L50 14 L62 32" fill="none" stroke="#c4b87a" strokeWidth="3.2" strokeLinejoin="miter" />
        <text x="104" y="27" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#e8ebe9">Raiffeisen</text>
      </svg>
    );
  }
  if (id === "nlb") {
    return (
      <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
        <rect width="148" height="44" rx="8" fill="#1a2a3d" />
        <path d="M16 32 V14 H22 L34 26 V14 H40 V32 H34 L22 20 V32 Z" fill="#b7c4d4" />
        <text x="96" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" fill="#e8ebe9">NLB</text>
      </svg>
    );
  }
  if (id === "bkt") {
    return (
      <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
        <rect width="148" height="44" rx="8" fill="#3a1c22" />
        <path d="M18 30 L28 14 L34 24 L40 12 L52 30 Z" fill="#c9a0a6" />
        <text x="100" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" fill="#e8ebe9">BKT</text>
      </svg>
    );
  }
  if (id === "procredit") {
    return (
      <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
        <rect width="148" height="44" rx="8" fill="#1a2f40" />
        <path d="M16 22 H34" stroke="#b7a86a" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 15 L38 22 L28 29" fill="none" stroke="#8fa88a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <text x="94" y="27" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="800" fill="#e8ebe9">ProCredit</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 148 44" className="h-10 w-full" aria-hidden="true">
      <rect width="148" height="44" rx="8" fill="#3a1c22" />
      <path d="M24 12 L27 20 H36 L29 25 L32 34 L24 28 L16 34 L19 25 L12 20 H21 Z" fill="#c9a0a6" />
      <text x="96" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" fill="#e8ebe9">BPB</text>
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
            <span className="text-lg font-bold text-zinc-300">Stripe</span>
            <span className="rounded border border-white/15 bg-white/5 px-3 py-1 text-sm font-black tracking-wide text-zinc-200">VISA</span>
            <span className="relative h-7 w-12" aria-hidden="true">
              <span className="absolute left-0 top-0 h-7 w-7 rounded-full bg-zinc-500/70" />
              <span className="absolute left-4 top-0 h-7 w-7 rounded-full bg-zinc-400/70" />
            </span>
            <span className="text-lg font-extrabold italic text-zinc-300">PayPal</span>
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
                className="rounded-xl border border-white/10 bg-[#12121A] p-2 transition hover:border-white/30"
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
