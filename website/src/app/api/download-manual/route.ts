import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { dosjaManualit, lexoTokenet, ruajTokenet } from "@/lib/manualet";

function skaduar() {
  return new NextResponse(
    `<!doctype html><html lang="sq"><head><meta charset="utf-8"><title>Udhëzuesi</title></head><body style="margin:0;background:#09090b;color:#fff;font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center"><p style="font-size:18px">Ky link ka skaduar ose është përdorur tashmë</p></body></html>`,
    { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const tokenet = lexoTokenet();
  const rreshti = tokenet[token];
  if (!rreshti || rreshti.used) return skaduar();
  const dosja = dosjaManualit(rreshti.product);
  if (!fs.existsSync(dosja)) return skaduar();
  rreshti.used = true;
  tokenet[token] = rreshti;
  ruajTokenet(tokenet);
  const pdf = fs.readFileSync(dosja);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="manual-${rreshti.product}.pdf"`,
    },
  });
}
