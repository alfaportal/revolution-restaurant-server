"use client";

import { FormEvent, useEffect, useState } from "react";

function adresaELejuar(url: string) {
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("?") && !url.includes("key=") && !url.includes("\\");
}

export default function FormaKycu() {
  const [hapi, setHapi] = useState<"hyrje" | "kod" | "harrova" | "reset">("hyrje");
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [kodi, setKodi] = useState("");
  const [ruaj, setRuaj] = useState(false);
  const [kodIRi, setKodIRi] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [fjalekalimiRi, setFjalekalimiRi] = useState("");
  const [gabim, setGabim] = useState("");
  const [mesazh, setMesazh] = useState("");
  const [dukeKerkur, setDukeKerkur] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset") || "";
    if (token) {
      setResetToken(token);
      setHapi("reset");
    }
  }, []);

  function hyr(data: { step?: string; token?: string; url?: string } | null) {
    if (data?.step === "done" && typeof data.token === "string" && adresaELejuar(data.url || "")) {
      localStorage.setItem("owner_token", data.token);
      localStorage.removeItem("owner_portal");
      window.location.assign(data.url || "");
      return true;
    }
    return false;
  }

  async function dergoFjalekalimin(event: FormEvent) {
    event.preventDefault();
    setGabim("");
    setDukeKerkur(true);
    try {
      const res = await fetch("/api/auth/kycu/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: fjalekalimi }),
      });
      const data = await res.json().catch(() => null);
      if (hyr(data)) return;
      if (res.ok && data?.step === "code") {
        setHapi("kod");
        setDukeKerkur(false);
        return;
      }
      setGabim(data?.gabim || "Email ose fjalëkalimi gabim");
    } catch {
      setGabim("Email ose fjalëkalimi gabim");
    }
    setDukeKerkur(false);
  }

  async function dergoKodin(event: FormEvent) {
    event.preventDefault();
    setGabim("");
    setDukeKerkur(true);
    try {
      const res = await fetch("/api/auth/kycu/code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: kodi.trim(), remember: ruaj }),
      });
      const data = await res.json().catch(() => null);
      if (hyr(data)) return;
      setGabim(data?.gabim || "Kodi është gabim.");
      if (data?.gabim && /përsëri/i.test(data.gabim)) setHapi("hyrje");
    } catch {
      setGabim("Kodi është gabim.");
    }
    setDukeKerkur(false);
  }

  async function dergoHarrova(event: FormEvent) {
    event.preventDefault();
    setGabim("");
    setMesazh("");
    setDukeKerkur(true);
    try {
      const res = await fetch("/api/auth/kycu/forgot", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), new_code: kodIRi }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) setGabim(data?.gabim || "Nuk u dërgua. Provo përsëri.");
      else setMesazh(data?.message || "Nëse ky email është i regjistruar, shiko kutinë.");
    } catch {
      setGabim("Nuk u dërgua. Provo përsëri.");
    }
    setDukeKerkur(false);
  }

  async function dergoReset(event: FormEvent) {
    event.preventDefault();
    setGabim("");
    setMesazh("");
    setDukeKerkur(true);
    try {
      const res = await fetch("/api/auth/kycu/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: fjalekalimiRi }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) setGabim(data?.gabim || "Nuk u ndryshua.");
      else {
        setMesazh(data?.message || "Fjalëkalimi u ndryshua.");
        setHapi("hyrje");
      }
    } catch {
      setGabim("Nuk u ndryshua.");
    }
    setDukeKerkur(false);
  }

  const inputClass = "h-14 w-full rounded-2xl border border-[#1E293B] bg-[#12121A] px-4 text-base text-white outline-none focus:border-[#0EA5E9]";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-4xl font-bold text-white md:text-5xl">Kyçu</h1>
      {hapi === "hyrje" ? (
        <form onSubmit={dergoFjalekalimin} className="mt-8 space-y-4">
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <input type="password" required autoComplete="current-password" value={fjalekalimi} onChange={(e) => setFjalekalimi(e.target.value)} placeholder="Fjalëkalimi" className={inputClass} />
          {gabim ? <p className="text-sm text-red-400">{gabim}</p> : null}
          {mesazh ? <p className="text-sm text-[#94A3B8]">{mesazh}</p> : null}
          <button type="submit" disabled={dukeKerkur} className="h-14 w-full rounded-full bg-[#0EA5E9] text-base font-semibold text-white disabled:opacity-60">Vazhdo</button>
          <button type="button" className="w-full text-sm text-[#0EA5E9]" onClick={() => { setGabim(""); setMesazh(""); setHapi("harrova"); }}>Harrova fjalëkalimin ose kodin</button>
        </form>
      ) : null}
      {hapi === "kod" ? (
        <form onSubmit={dergoKodin} className="mt-8 space-y-4">
          <p className="text-lg leading-relaxed text-[#94A3B8]">Shkruaj kodin 6-shifror</p>
          <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={kodi} onChange={(e) => setKodi(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputClass} text-center text-2xl tracking-[0.4em]`} />
          <label className="flex items-center gap-3 text-sm text-white">
            <input type="checkbox" checked={ruaj} onChange={(e) => setRuaj(e.target.checked)} />
            Ruaje kodin
          </label>
          {gabim ? <p className="text-sm text-red-400">{gabim}</p> : null}
          <button type="submit" disabled={dukeKerkur} className="h-14 w-full rounded-full bg-[#0EA5E9] text-base font-semibold text-white disabled:opacity-60">Hyr</button>
        </form>
      ) : null}
      {hapi === "harrova" ? (
        <form onSubmit={dergoHarrova} className="mt-8 space-y-4">
          <p className="text-lg leading-relaxed text-[#94A3B8]">Të dërgojmë lidhjen e fjalëkalimit dhe kodin 6-shifror.</p>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
          <label className="flex items-center gap-3 text-sm text-white">
            <input type="checkbox" checked={kodIRi} onChange={(e) => setKodIRi(e.target.checked)} />
            Dua kod të ri
          </label>
          {gabim ? <p className="text-sm text-red-400">{gabim}</p> : null}
          {mesazh ? <p className="text-sm text-[#94A3B8]">{mesazh}</p> : null}
          <button type="submit" disabled={dukeKerkur} className="h-14 w-full rounded-full bg-[#0EA5E9] text-base font-semibold text-white disabled:opacity-60">Dërgo</button>
          <button type="button" className="w-full text-sm text-[#0EA5E9]" onClick={() => { setGabim(""); setHapi("hyrje"); }}>Kthehu</button>
        </form>
      ) : null}
      {hapi === "reset" ? (
        <form onSubmit={dergoReset} className="mt-8 space-y-4">
          <p className="text-lg leading-relaxed text-[#94A3B8]">Shkruaj fjalëkalimin e ri.</p>
          <input type="password" required minLength={6} autoComplete="new-password" value={fjalekalimiRi} onChange={(e) => setFjalekalimiRi(e.target.value)} placeholder="Fjalëkalimi i ri" className={inputClass} />
          {gabim ? <p className="text-sm text-red-400">{gabim}</p> : null}
          <button type="submit" disabled={dukeKerkur} className="h-14 w-full rounded-full bg-[#0EA5E9] text-base font-semibold text-white disabled:opacity-60">Ruaj</button>
        </form>
      ) : null}
      <p className="mt-10 text-center">
        <a href="/api/public/setup-download" className="text-sm font-semibold text-[#0EA5E9]">
          Shkarko Setup.exe për Windows
        </a>
      </p>
    </div>
  );
}
