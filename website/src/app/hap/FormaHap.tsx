"use client";

import { FormEvent, useEffect, useState } from "react";

type Platforma = "windows" | "android" | "ios" | "mac" | "tjeter";

function lexoPlatformen(): Platforma {
  const ua = navigator.userAgent || "";
  const touch = navigator.maxTouchPoints > 1;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua) || (touch && /Macintosh/i.test(ua))) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "mac";
  return "tjeter";
}

function adresaELejuar(url: string) {
  return url.startsWith("/") && !url.startsWith("//") && !url.includes("?") && !url.includes("key=") && !url.includes("\\");
}

export default function FormaHap() {
  const [platforma, setPlatforma] = useState<Platforma>("tjeter");
  const [emri, setEmri] = useState("");
  const [gabim, setGabim] = useState("");
  const [dukeKerkur, setDukeKerkur] = useState(false);

  useEffect(() => {
    setPlatforma(lexoPlatformen());
  }, []);

  async function dergo(event: FormEvent) {
    event.preventDefault();
    setGabim("");
    const q = emri.trim();
    if (!q) {
      setGabim("Shkruaj emrin ose kodin e biznesit.");
      return;
    }
    setDukeKerkur(true);
    try {
      const res = await fetch(`/api/public/hap?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => null);
      const url = data && typeof data.url === "string" ? data.url : "";
      if (!res.ok || !data?.ok || !adresaELejuar(url)) {
        if (data?.error === "many") setGabim("Ka më shumë se një biznes me këtë emër. Shkruaj kodin e biznesit.");
        else if (data?.error === "empty") setGabim("Shkruaj emrin ose kodin e biznesit.");
        else setGabim("Nuk u gjet ky biznes. Shkruaj kodin që të ka dhënë programi.");
        setDukeKerkur(false);
        return;
      }
      window.location.assign(url);
    } catch {
      setGabim("Nuk u gjet ky biznes. Provo përsëri.");
      setDukeKerkur(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-4xl font-bold text-white md:text-5xl">Hap Programin</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#94A3B8]">
        Shkruaj emrin ose kodin e biznesit. Hapja të çon te paneli i pronarit.
      </p>

      {platforma === "windows" ? (
        <p className="mt-6 rounded-2xl border border-[#1E293B] bg-[#12121A] px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
          Në Windows programi instalohet me Setup.{" "}
          <a href="/api/public/setup-download" className="font-semibold text-[#0EA5E9]">
            Shkarko Setup.exe
          </a>
        </p>
      ) : null}

      {platforma === "android" ? (
        <p className="mt-6 rounded-2xl border border-[#1E293B] bg-[#12121A] px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
          Pasi të hapet programi, në Chrome shtyp tri pikat dhe zgjidh «Shto në ekranin kryesor». Kështu hapet si program.
        </p>
      ) : null}

      {platforma === "ios" ? (
        <p className="mt-6 rounded-2xl border border-[#1E293B] bg-[#12121A] px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
          Pasi të hapet programi, në Safari shtyp Shpërndaj dhe zgjidh «Shto në Ekranin Kryesor».
        </p>
      ) : null}

      {platforma === "mac" ? (
        <p className="mt-6 rounded-2xl border border-[#1E293B] bg-[#12121A] px-5 py-4 text-sm leading-relaxed text-[#94A3B8]">
          Në Mac programi hapet në shfletues.
        </p>
      ) : null}

      <form onSubmit={dergo} className="mt-8 flex flex-col gap-3">
        <label className="text-sm text-[#94A3B8]" htmlFor="biznesi">
          Emri ose kodi i biznesit
        </label>
        <input
          id="biznesi"
          name="biznesi"
          value={emri}
          onChange={(event) => setEmri(event.target.value)}
          autoComplete="organization"
          className="h-[52px] w-full rounded-xl border border-[#1E293B] bg-[#12121A] px-4 text-base text-white outline-none focus:border-[#0EA5E9]"
        />
        <button
          type="submit"
          disabled={dukeKerkur}
          className="h-[52px] rounded-full bg-[#0EA5E9] text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] disabled:opacity-60"
        >
          Hap Programin
        </button>
        {gabim ? <p className="text-sm text-[#e63946]">{gabim}</p> : null}
      </form>
    </div>
  );
}
