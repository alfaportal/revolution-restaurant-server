import { NextRequest, NextResponse } from "next/server";
import {
  FJALEKALIMI,
  eshteProdukt,
  lexoTokenet,
  ruajTokenet,
  type TokenManual,
} from "@/lib/manualet";

function lejuar(request: NextRequest) {
  return request.headers.get("x-manual-password") === FJALEKALIMI;
}

export async function GET(request: NextRequest) {
  if (!lejuar(request)) {
    return NextResponse.json({ gabim: "Fjalëkalimi nuk është i saktë." }, { status: 401 });
  }
  const tokenet = lexoTokenet();
  const lista = Object.entries(tokenet).map(([token, rreshti]) => ({
    token,
    ...rreshti,
    link: `${request.nextUrl.origin}/api/download-manual?token=${token}`,
  }));
  return NextResponse.json({ lista });
}

export async function POST(request: NextRequest) {
  if (!lejuar(request)) {
    return NextResponse.json({ gabim: "Fjalëkalimi nuk është i saktë." }, { status: 401 });
  }
  const body = (await request.json()) as { product?: string; email?: string };
  const product = String(body.product || "");
  const email = String(body.email || "").trim();
  if (!eshteProdukt(product) || !email.includes("@")) {
    return NextResponse.json({ gabim: "Zgjidhni programin dhe një email." }, { status: 400 });
  }
  const token = crypto.randomUUID();
  const rreshti: TokenManual = {
    product,
    used: false,
    created: new Date().toISOString().slice(0, 10),
    email,
  };
  const tokenet = lexoTokenet();
  tokenet[token] = rreshti;
  ruajTokenet(tokenet);
  return NextResponse.json({
    token,
    link: `${request.nextUrl.origin}/api/download-manual?token=${token}`,
  });
}
