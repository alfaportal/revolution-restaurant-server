function Anash({ zgjedhur, pikat }: { zgjedhur: string; pikat: string[] }) {
  return (
    <aside className="flex w-[78px] shrink-0 flex-col gap-0.5 border-r border-white/10 bg-[#0a0a0c] px-1.5 py-2 text-white">
      <div className="mb-1 px-1 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">POS</div>
      {pikat.map((e) => (
        <div
          key={e}
          className={`truncate rounded px-1 py-1 text-[10px] font-medium ${e === zgjedhur ? "bg-white/10 text-white" : "text-zinc-500"}`}
        >
          {e}
        </div>
      ))}
    </aside>
  );
}

function Koka({ titulli, nentitulli }: { titulli: string; nentitulli: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-white">{titulli}</div>
        <div className="truncate text-[10px] text-zinc-500">{nentitulli}</div>
      </div>
      <div className="flex shrink-0 gap-1">
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300">Sot</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-300">Arka 1</span>
      </div>
    </div>
  );
}

function Tabela({ krye, rreshta }: { krye: string[]; rreshta: string[][] }) {
  const kolona = `repeat(${krye.length}, minmax(0, 1fr))`;
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <div className="grid bg-white/[0.04] px-2 py-1.5 text-[10px] font-medium tracking-wide text-zinc-500" style={{ gridTemplateColumns: kolona }}>
        {krye.map((k) => (
          <span key={k} className="truncate">{k}</span>
        ))}
      </div>
      {rreshta.map((r, i) => (
        <div
          key={i}
          className={`grid items-center border-t border-white/[0.06] px-2 py-1 text-[11px] text-zinc-200 ${i % 2 ? "bg-white/[0.03]" : ""}`}
          style={{ gridTemplateColumns: kolona }}
        >
          {r.map((c, j) => (
            <span key={j} className="truncate">{c}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Vija({ pika }: { pika: number[] }) {
  const w = 220;
  const h = 56;
  const hapi = w / (pika.length - 1);
  const d = pika.map((y, i) => `${i === 0 ? "M" : "L"}${(i * hapi).toFixed(1)} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      {[14, 28, 42].map((y) => (
        <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />
      ))}
      {[0, 55, 110, 165, 220].map((x) => (
        <line key={x} y1="0" y2={h} x1={x} x2={x} stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      ))}
      <path d={d} fill="none" stroke="#e0f2fe" strokeWidth="1.3" />
    </svg>
  );
}

function Shtylla({ lartesite }: { lartesite: number[] }) {
  return (
    <div className="flex h-full items-end gap-[2px]">
      {lartesite.map((h, i) => (
        <div key={i} className="min-w-0 flex-1 rounded-t-sm bg-white/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

const MENU = ["Arka", "Ditari", "Raportet", "Hoteli", "Stoku", "Kontabilisti"];

function VijaShitjeve() {
  const pika = [88, 86, 84, 80, 74, 70, 72, 64, 66, 58, 54, 50, 48, 30, 22, 26, 34, 28, 18, 24, 16, 20, 10, 14, 6];
  const w = 280;
  const h = 110;
  const hapi = w / (pika.length - 1);
  const d = pika.map((y, i) => `${i === 0 ? "M" : "L"}${(i * hapi).toFixed(1)} ${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      {[22, 44, 66, 88].map((y) => (
        <line key={y} x1="28" x2={w} y1={y} y2={y} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      ))}
      {[70, 140, 210, 280].map((x) => (
        <line key={x} x1={x} x2={x} y1="8" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      ))}
      <path d={d} fill="none" stroke="#ffffff" strokeWidth="2" />
      <text x="2" y="26" fill="#a1a1aa" fontSize="9">600</text>
      <text x="2" y="48" fill="#a1a1aa" fontSize="9">400</text>
      <text x="2" y="70" fill="#a1a1aa" fontSize="9">200</text>
      <text x="2" y="92" fill="#a1a1aa" fontSize="9">0</text>
    </svg>
  );
}

function Rreth({ pjeset, fundi }: { pjeset: { emri: string; vlera: number; ngjyra: string }[]; fundi: string }) {
  const total = pjeset.reduce((s, p) => s + p.vlera, 0);
  const r = 14;
  const c = 2 * Math.PI * r;
  let nisja = 0;
  return (
    <svg viewBox="0 0 42 42" className="h-full w-full">
      {pjeset.map((p) => {
        const gjatesia = (p.vlera / total) * c;
        const offset = nisja;
        nisja += gjatesia;
        return (
          <circle
            key={p.emri}
            cx="21"
            cy="21"
            r={r}
            fill="none"
            stroke={p.ngjyra}
            strokeWidth="6"
            strokeDasharray={`${gjatesia} ${c - gjatesia}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 21 21)"
          />
        );
      })}
      <circle cx="21" cy="21" r="8" fill={fundi} />
    </svg>
  );
}

export function EkraniArkes() {
  const artikujt = ["Espresso 1.50", "Kapuçino 2.00", "Makiatto 1.80", "Ujë 1.00", "Buke 1.20", "Sallatë 4.50", "Çaj 1.30", "Lëng 2.20"];
  return (
    <div className="flex h-full bg-[#070709] text-white">
      <Anash zgjedhur="Arka" pikat={MENU} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Koka titulli="Arka · Shitja e hapur" nentitulli="Tavolina 4 · Arta · 16:12" />
        <div className="grid flex-1 grid-cols-4 content-start gap-1 p-1.5">
          {artikujt.map((a) => (
            <div key={a} className="rounded-md border border-white/10 bg-white/[0.05] px-1 py-1.5 text-center text-[10px] font-medium leading-tight text-zinc-100">{a}</div>
          ))}
        </div>
      </div>
      <aside className="flex w-[30%] flex-col border-l border-white/10 bg-[#121216]">
        <div className="border-b border-white/10 px-2 py-1.5 text-[11px] font-medium text-zinc-300">Fatura 1842</div>
        <Tabela
          krye={["Artikulli", "Sasia", "€"]}
          rreshta={[
            ["Espresso", "2", "3.00"],
            ["Kapuçino", "1", "2.00"],
            ["Sallatë", "1", "4.50"],
            ["Ujë", "2", "2.00"],
          ]}
        />
        <div className="m-1.5 rounded-md bg-white py-1.5 text-center text-[12px] font-semibold text-black">11.50€</div>
      </aside>
    </div>
  );
}

export function EkraniDitarit() {
  return (
    <div className="flex h-full bg-[#07111c] text-white">
      <div className="flex min-w-0 flex-1 flex-col p-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Shitjet</span>
          <span className="text-[11px] text-zinc-400">486.20€ sot · 18 porosi</span>
        </div>
        <div className="min-h-0 flex-1">
          <VijaShitjeve />
        </div>
        <div className="mt-1 flex gap-3 text-[11px] text-zinc-300">
          <span>Cash 312€</span>
          <span>Kartë 174€</span>
          <span>TVSH 74€</span>
        </div>
      </div>
    </div>
  );
}

export function EkraniRaporteve() {
  const pagesa = [
    { emri: "Cash", vlera: 62, ngjyra: "#1d4ed8" },
    { emri: "Kartë", vlera: 30, ngjyra: "#22c55e" },
    { emri: "Tjera", vlera: 8, ngjyra: "#38bdf8" },
  ];
  const tvsh = [
    { emri: "18%", vlera: 70, ngjyra: "#0ea5e9" },
    { emri: "8%", vlera: 22, ngjyra: "#6366f1" },
    { emri: "0%", vlera: 8, ngjyra: "#94a3b8" },
  ];
  const artikujt = [
    ["Espresso", "186", 100, "#1d4ed8"],
    ["Kapuçino", "142", 76, "#0ea5e9"],
    ["Dhomë", "96", 52, "#22c55e"],
    ["Buke", "88", 47, "#f59e0b"],
  ];
  return (
    <div className="flex h-full flex-col bg-[#070709] p-2.5 text-white">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold">Raportet</span>
        <span className="text-[11px] text-zinc-400">12,480€ · TVSH 2,246€ · fitim 3,261€</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
        <div className="flex flex-col rounded-lg border border-white/10 bg-[#121216] p-1.5">
          <div className="text-[10px] text-zinc-400">Pagesa</div>
          <div className="min-h-0 flex-1"><Rreth pjeset={pagesa} fundi="#121216" /></div>
        </div>
        <div className="flex flex-col rounded-lg border border-white/10 bg-[#121216] p-1.5">
          <div className="text-[10px] text-zinc-400">TVSH</div>
          <div className="min-h-0 flex-1"><Rreth pjeset={tvsh} fundi="#121216" /></div>
        </div>
        <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-white/10 bg-[#121216] p-2">
          {artikujt.map(([emri, vlera, barra, ngjyra]) => (
            <div key={emri}>
              <div className="flex justify-between text-[10px] text-zinc-300"><span>{emri}</span><span>{vlera}</span></div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${barra}%`, background: ngjyra }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EkraniHotelit() {
  return (
    <div className="flex h-full bg-[#070709] text-white">
      <Anash zgjedhur="Hoteli" pikat={["Pritja", "Dhomat", "Rezervime", "Faturat"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Koka titulli="Pritja · dhomat" nentitulli="101–108 · 3 të lira · 4 të zëna · 1 check-out" />
        <Tabela
          krye={["Dhoma", "Mysafiri", "Hyrja", "Dalja", "Statusi", "Çmimi"]}
          rreshta={[
            ["101", "—", "—", "—", "E lirë", "0.00€"],
            ["102", "A. Krasniqi", "16.11", "18.11", "E zënë", "89.00€"],
            ["103", "—", "15.11", "16.11", "Check-out", "70.00€"],
            ["104", "E. Berisha", "16.11", "19.11", "E zënë", "110.00€"],
            ["105", "D. Hoxha", "14.11", "17.11", "E zënë", "95.00€"],
            ["106", "—", "—", "—", "E lirë", "0.00€"],
            ["107", "M. Gashi", "16.11", "17.11", "E zënë", "75.00€"],
          ]}
        />
      </div>
    </div>
  );
}

export function EkraniStokut() {
  return (
    <div className="flex h-full bg-[#070709] text-white">
      <Anash zgjedhur="Stoku" pikat={MENU} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Koka titulli="Stoku" nentitulli="Artikulli · barkodi · sasia · minimumi · gjendja" />
        <Tabela
          krye={["Artikulli", "Barkodi", "Sasia", "Min", "Gjendja"]}
          rreshta={[
            ["Espresso", "590123400001", "240", "40", "OK"],
            ["Kapuçino", "590123400002", "180", "30", "OK"],
            ["Buke", "590123400014", "22", "20", "Pak"],
            ["Ujë 0.5L", "590123400021", "96", "24", "OK"],
            ["Sallatë", "590123400033", "14", "12", "OK"],
            ["Qumësht", "590123400044", "6", "10", "Pak"],
            ["Sheqer", "590123400055", "40", "8", "OK"],
          ]}
        />
      </div>
    </div>
  );
}

export function EkraniKontabilistit() {
  const pagesa = [
    { emri: "Cash", vlera: 64, ngjyra: "#0284c7" },
    { emri: "Kartë", vlera: 28, ngjyra: "#22c55e" },
    { emri: "Tjera", vlera: 8, ngjyra: "#f59e0b" },
  ];
  const llogarit = [
    { emri: "Shitje", vlera: 46, ngjyra: "#2563eb" },
    { emri: "Blerje", vlera: 22, ngjyra: "#0ea5e9" },
    { emri: "Shpenzime", vlera: 14, ngjyra: "#94a3b8" },
    { emri: "Fitim", vlera: 18, ngjyra: "#16a34a" },
  ];
  const shiritat = [
    ["Shitjet", "18,420€", 100, "#2563eb"],
    ["Blerjet", "6,420€", 35, "#0ea5e9"],
    ["Shpenzimet", "2,180€", 18, "#f59e0b"],
    ["Fitimi", "9,820€", 53, "#16a34a"],
  ];
  return (
    <div className="flex h-full flex-col bg-[#070709] p-2.5 text-white">
      <div className="mb-1.5 text-[13px] font-semibold">Kontabilisti</div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
        <div className="flex flex-col rounded-lg border border-white/10 bg-[#121216] p-1.5">
          <div className="text-[10px] text-zinc-400">Pagesa</div>
          <div className="min-h-0 flex-1"><Rreth pjeset={pagesa} fundi="#121216" /></div>
          <div className="text-[10px] text-zinc-500">Cash · Kartë</div>
        </div>
        <div className="flex flex-col rounded-lg border border-white/10 bg-[#121216] p-1.5">
          <div className="text-[10px] text-zinc-400">Bilanci</div>
          <div className="min-h-0 flex-1"><Rreth pjeset={llogarit} fundi="#121216" /></div>
          <div className="text-[10px] text-zinc-500">Shitje · Fitim</div>
        </div>
        <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-white/10 bg-[#121216] p-2">
          {shiritat.map(([emri, vlera, barra, ngjyra]) => (
            <div key={emri}>
              <div className="flex justify-between text-[10px] text-zinc-300"><span>{emri}</span><span>{vlera}</span></div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${barra}%`, background: ngjyra }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EkraniNderrimit() {
  return (
    <div className="flex h-full bg-[#070709] text-white">
      <Anash zgjedhur="Ndërrimi" pikat={["Ndërrimi", "Cash", "Kartë", "Diferenca"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Koka titulli="Mbyllja e ndërrimit · Arta" nentitulli="08:00–16:00 · Arka 1" />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-1 p-1.5">
          <div className="overflow-hidden rounded bg-[#121216]">
            <div className="px-2 py-1.5 text-[11px] font-medium text-zinc-200">Numërimi i cash-it</div>
            <Tabela
              krye={["Copë", "Vlera", "Shuma"]}
              rreshta={[
                ["12", "20€", "240.00"],
                ["6", "10€", "60.00"],
                ["4", "5€", "20.00"],
                ["14", "1€", "14.00"],
                ["8", "0.50€", "4.00"],
              ]}
            />
          </div>
          <div className="flex flex-col rounded-lg border border-white/10 bg-[#121216] p-2 text-[11px]">
            <div className="mb-1 font-semibold">Krahasimi</div>
            {[
              ["Cash", "312.00€"],
              ["Kartë", "174.20€"],
              ["Pritshme", "486.20€"],
              ["Numëruar", "486.00€"],
              ["Diferenca", "-0.20€"],
            ].map(([e, v]) => (
              <div key={e} className="flex justify-between border-t border-white/10 py-1">
                <span className="text-zinc-400">{e}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EkraniFatures() {
  return (
    <div className="flex h-full bg-[#070709] text-white">
      <Anash zgjedhur="Fatura" pikat={["Fatura", "Blerësi", "TVSH", "Pagesa"]} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Koka titulli="Fatura e shitjes 1842" nentitulli="16.11.2026 16:12 · Arka 1 · Cash · Fiskalizuar" />
        <Tabela
          krye={["Nr", "Artikulli", "Sasia", "Çmimi", "TVSH", "Totali"]}
          rreshta={[
            ["1", "Espresso", "2", "1.50", "18%", "3.00€"],
            ["2", "Kapuçino", "1", "2.00", "18%", "2.00€"],
            ["3", "Sallatë", "1", "4.50", "8%", "4.50€"],
            ["4", "Ujë 0.5L", "2", "1.00", "18%", "2.00€"],
          ]}
        />
        <div className="grid grid-cols-3 gap-1.5 p-2 text-[11px]">
          <div className="rounded-md border border-white/10 bg-[#121216] px-2 py-1.5 text-zinc-300">Pa TVSH 9.75€</div>
          <div className="rounded-md border border-white/10 bg-[#121216] px-2 py-1.5 text-zinc-300">TVSH 1.75€</div>
          <div className="rounded-md bg-white px-2 py-1.5 text-center font-semibold text-black">Totali 11.50€</div>
        </div>
      </div>
    </div>
  );
}

export const PAMJET = [
  { emri: "Arka · Shitja", Ekrani: EkraniArkes },
  { emri: "Ditari", Ekrani: EkraniDitarit },
  { emri: "Raportet", Ekrani: EkraniRaporteve },
  { emri: "Hoteli", Ekrani: EkraniHotelit },
  { emri: "Stoku", Ekrani: EkraniStokut },
  { emri: "Kontabilisti", Ekrani: EkraniKontabilistit },
  { emri: "Ndërrimi", Ekrani: EkraniNderrimit },
  { emri: "Fatura", Ekrani: EkraniFatures },
];

export const LEVIZJET = [
  { initial: { opacity: 0, x: 36 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -36 } },
  { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -28 } },
  { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 } },
  { initial: { opacity: 0, x: -36 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 36 } },
  { initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 24 } },
  { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.92 } },
  { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  { initial: { opacity: 0, x: 16, y: 16 }, animate: { opacity: 1, x: 0, y: 0 }, exit: { opacity: 0, x: -16, y: -16 } },
];
