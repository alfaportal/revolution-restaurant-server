export const PRODUKTET_MANUAL = [
  "kafene",
  "hotel",
  "market",
  "furra",
  "dyqane",
  "butika",
  "distributor",
  "argjendari",
  "barnatore",
  "fiskalizim",
  "kontabilisti",
  "security",
  "mjekesia",
  "posta-taxi",
  "rentacar",
] as const;

export type ProduktManual = (typeof PRODUKTET_MANUAL)[number];

export type TokenManual = {
  product: ProduktManual;
  used: boolean;
  created: string;
  email: string;
};

export function eshteProdukt(vlera: string): vlera is ProduktManual {
  return (PRODUKTET_MANUAL as readonly string[]).includes(vlera);
}
