"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gjuhet, type Kodi, type Teksti } from "@/i18n/tekstet";

const kodet: Kodi[] = ["sq", "en", "de", "sr"];

type Vlera = {
  gjuha: Kodi;
  setGjuha: (kodi: Kodi) => void;
  t: Teksti;
};

const GjuhaContext = createContext<Vlera>({
  gjuha: "sq",
  setGjuha: () => {},
  t: gjuhet.sq,
});

export function GjuhaProvider({ children }: { children: ReactNode }) {
  const [gjuha, setGjuhaState] = useState<Kodi>("sq");
  const [gati, setGati] = useState(false);

  useEffect(() => {
    const ruajtur = window.localStorage.getItem("revolution-gjuha");
    if (ruajtur === "sq" || ruajtur === "en" || ruajtur === "de" || ruajtur === "sr") {
      setGjuhaState(ruajtur);
    }
    setGati(true);
  }, []);

  useEffect(() => {
    if (!gati) return;
    document.documentElement.lang = gjuha;
    if (window.location.pathname === "/") {
      document.title = gjuhet[gjuha].meta;
    }
    window.localStorage.setItem("revolution-gjuha", gjuha);
  }, [gjuha, gati]);

  return (
    <GjuhaContext.Provider value={{ gjuha, setGjuha: setGjuhaState, t: gjuhet[gjuha] }}>
      {children}
    </GjuhaContext.Provider>
  );
}

export function useGjuha() {
  return useContext(GjuhaContext);
}

export function Gjuhet() {
  const { gjuha, setGjuha } = useGjuha();
  return (
    <div className="flex items-center gap-0.5">
      {kodet.map((kodi) => (
        <button
          key={kodi}
          type="button"
          onClick={() => setGjuha(kodi)}
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            gjuha === kodi ? "bg-[#0EA5E9] text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          {kodi.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
