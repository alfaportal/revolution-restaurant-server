/**
 * Ping Supabase projects that are not on this server (FISKAL, MARKET, SECURITY, KONTABILISTI, + FURRA nëse env)
 * so free-tier pauses less often. Does NOT ping KAFENE/POS (always active on this hub).
 */
const https = require("https");

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 30 * 1000;

function furraSupabaseRefFromEnv() {
  const direct = String(process.env.SUPABASE_KEEPALIVE_FURRA_REF || "").trim();
  if (direct) return direct;
  const url = String(
    process.env.SUPABASE_FURRA_URL || process.env.SUPABASE_KEEPALIVE_FURRA_URL || "",
  ).trim();
  const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : "";
}

/** Public anon/publishable keys from respective product repos (optional env overrides). */
const BASE_PROJECTS = [
  {
    name: "FISKALIZIM",
    ref: "oqquiuisreztzcyehpiq",
    anonKey: process.env.SUPABASE_KEEPALIVE_FISKALIZIM_ANON_KEY || "",
  },
  {
    name: "MARKET",
    ref: "lbcjmpwvfqonsfjlutfp",
    anonKey:
      process.env.SUPABASE_KEEPALIVE_MARKET_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiY2ptcHd2ZnFvbnNmamx1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDA1ODksImV4cCI6MjEwMjI3NjU4OX0.yf2MdWyi3oGimDJVyEO3hWHSrKpHWZmB18FKG9krBH4",
  },
  {
    name: "SECURITY",
    ref: "kkoppkugdolcvxgvumvn",
    anonKey:
      process.env.SUPABASE_KEEPALIVE_SECURITY_ANON_KEY ||
      "sb_publishable_MNBVUHsNcDhU4a13kpT4Nw_eF6-7RPp",
  },
  {
    name: "KONTABILISTI",
    ref: "smjqzefnktatzwydhunr",
    anonKey: process.env.SUPABASE_KEEPALIVE_KONTABILISTI_ANON_KEY || "",
  },
];

function getKeepaliveProjects() {
  const list = [...BASE_PROJECTS];
  const furraRef = furraSupabaseRefFromEnv();
  if (furraRef) {
    list.push({
      name: "FURRA",
      ref: furraRef,
      anonKey:
        process.env.SUPABASE_KEEPALIVE_FURRA_ANON_KEY ||
        process.env.SUPABASE_FURRA_ANON_KEY ||
        "",
    });
  }
  return list;
}

function httpsGet(hostname, path, headers = {}) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname, path, method: "GET", timeout: 25000, headers },
      (res) => {
        res.resume();
        const code = res.statusCode || 0;
        resolve(code >= 200 && code < 500);
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function pingOnce({ ref, anonKey }) {
  const host = `${ref}.supabase.co`;
  const key = String(anonKey || "").trim();
  if (key) {
    const restOk = await httpsGet(host, "/rest/v1/", {
      apikey: key,
      Authorization: `Bearer ${key}`,
    });
    if (restOk) return true;
  }
  return httpsGet(host, "/");
}

async function runSupabaseKeepalive() {
  for (const project of getKeepaliveProjects()) {
    let ok = false;
    try {
      ok = await pingOnce(project);
    } catch {
      ok = false;
    }
    console.log(`[supabase-keepalive] Pinged ${project.name}: ${ok ? "OK" : "FAIL"}`);
  }
}

function startSupabaseKeepalive() {
  if (process.env.SUPABASE_KEEPALIVE_DISABLED === "1") {
    console.log("  ⏭️  Supabase keepalive: çaktivizuar (SUPABASE_KEEPALIVE_DISABLED=1)");
    return;
  }

  setTimeout(() => {
    runSupabaseKeepalive().catch((err) => {
      console.error("[supabase-keepalive]", err.message || err);
    });
  }, BOOT_DELAY_MS);

  setInterval(() => {
    runSupabaseKeepalive().catch((err) => {
      console.error("[supabase-keepalive]", err.message || err);
    });
  }, SIX_DAYS_MS);

  console.log(
    "  ⏰ Supabase keepalive: FISKAL/MARKET/SECURITY/KONTABILISTI (+FURRA nëse env) — çdo 6 ditë (+ 30s pas start)",
  );
}

module.exports = { startSupabaseKeepalive, runSupabaseKeepalive };
