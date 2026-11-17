import fs from "fs";
import path from "path";
import { type TokenManual } from "@/lib/manualet-lista";

export const FJALEKALIMI = "revolution";

export { eshteProdukt, PRODUKTET_MANUAL, type ProduktManual, type TokenManual } from "@/lib/manualet-lista";

function rrenja() {
  const ketu = process.cwd();
  if (fs.existsSync(path.join(ketu, "public", "manuals"))) return ketu;
  const brenda = path.join(ketu, "website");
  if (fs.existsSync(path.join(brenda, "public", "manuals"))) return brenda;
  return ketu;
}

export function dosjaTokeneve() {
  return path.join(rrenja(), "data", "manual-tokens.json");
}

export function dosjaManualit(produkti: string) {
  return path.join(rrenja(), "public", "manuals", `manual-${produkti}.pdf`);
}

export function lexoTokenet(): Record<string, TokenManual> {
  const dosja = dosjaTokeneve();
  if (!fs.existsSync(dosja)) return {};
  const lexuar = JSON.parse(fs.readFileSync(dosja, "utf8")) as Record<string, TokenManual>;
  return lexuar && typeof lexuar === "object" ? lexuar : {};
}

export function ruajTokenet(tokenet: Record<string, TokenManual>) {
  const dosja = dosjaTokeneve();
  fs.mkdirSync(path.dirname(dosja), { recursive: true });
  fs.writeFileSync(dosja, JSON.stringify(tokenet, null, 2), "utf8");
}
