"use client";

import { useEffect, useState } from "react";

type Pako = { plan: string; emri: string; cmimi: string; programi: string };
type Banka = { company: string; bank: string; account: string; currency: string; nui: string };
type Forma = "kartë" | "bankë" | null;

const bankat = [
  { id: "teb", emri: "TEB", klasi: "bg-[#006b3f] text-white" },
  { id: "raiffeisen", emri: "Raiffeisen", klasi: "bg-[#ffe600] text-black" },
  { id: "nlb", emri: "NLB", klasi: "bg-[#003d7a] text-white" },
  { id: "bkt", emri: "BKT", klasi: "bg-[#c8102e] text-white" },
  { id: "procredit", emri: "ProCredit", klasi: "bg-[#005ca9] text-white" },
  { id: "bpb", emri: "BPB", klasi: "bg-[#e30613] text-white" },
];

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
    <section id="pagesa" className="bg-white px-6 py-20 text-[#0f172a]">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-4xl font-bold">Pagesa</h2>
        <p className="mt-3 text-[#94a3b8]">
          Paguani me kartë ose me bankat vendore — zgjidhni mënyrën që ju përshtatet.
        </p>
        {pako ? (
          <p className="mt-3 text-sm font-semibold text-[#0f172a]">
            {pako.programi} · {pako.emri} · {pako.cmimi}
          </p>
        ) : null}
      </div>

      <div className="mx-auto mt-12 flex max-w-xl flex-col gap-10 text-left">
        <div>
          <h3 className="text-lg font-bold">Kartë bankare</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Visa, Mastercard dhe pagesë online</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold text-[#635bff]">Stripe</span>
            <span className="rounded bg-[#1a1f71] px-3 py-1 text-sm font-black tracking-wide text-white">VISA</span>
            <span className="relative h-7 w-12" aria-hidden="true">
              <span className="absolute left-0 top-0 h-7 w-7 rounded-full bg-[#eb001b]" />
              <span className="absolute left-4 top-0 h-7 w-7 rounded-full bg-[#f79e1b]" />
            </span>
            <span className="text-lg font-extrabold italic text-[#003087]">PayPal</span>
          </div>
          <button
            type="button"
            onClick={hapKarten}
            className="mt-6 w-full rounded-full bg-[#e63946] py-3 text-sm font-semibold text-white"
          >
            Vazhdo me pagesë
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold">Banka vendore</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Transfer bankar te llogaria e Revolution Invest</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {bankat.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => hapBanken(b.id)}
                className={`rounded-lg py-3 text-sm font-black ${b.klasi}`}
              >
                {b.emri}
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
            className="w-full max-w-md rounded-2xl bg-white p-6 text-left text-[#0f172a]"
          >
            <h3 className="text-xl font-bold">{forma === "kartë" ? "Pagesa me kartë" : "Pagesë me transfer bankar"}</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              {pako?.emri} · {pako?.cmimi}
            </p>
            {forma === "bankë" && llogaria ? (
              <div className="mt-4 rounded-xl bg-[#f8fafc] p-3 text-sm">
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
              <input required value={emri} onChange={(e) => setEmri(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3" />
            </label>
            <label className="mt-3 block text-sm">
              Emri i biznesit
              <input required value={biznesi} onChange={(e) => setBiznesi(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3" />
            </label>
            <label className="mt-3 block text-sm">
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3" />
            </label>
            <label className="mt-3 block text-sm">
              Telefoni
              <input value={telefoni} onChange={(e) => setTelefoni(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3" />
            </label>
            <label className="mt-3 block text-sm">
              Lloji i biznesit
              <select value={tipi} onChange={(e) => setTipi(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#e2e8f0] px-3">
                <option value="restorant">Restorant</option>
                <option value="kafene">Kafene</option>
                <option value="dyqan">Dyqan</option>
              </select>
            </label>
            {mesazhi ? <p className="mt-3 text-sm font-semibold">{mesazhi}</p> : null}
            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={duke} className="rounded-full bg-[#e63946] px-5 py-3 text-sm font-semibold text-white">
                {duke ? "Duke hapur…" : forma === "kartë" ? "Vazhdo me pagesë" : "Dërgo kërkesën"}
              </button>
              <button type="button" onClick={mbyll} className="rounded-full border border-[#e2e8f0] px-5 py-3 text-sm">
                Anulo
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
