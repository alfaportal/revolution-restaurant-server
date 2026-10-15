const { createClient } = require("@supabase/supabase-js");
const { getSupabaseConfig } = require("./lib/env");
const { formatError, logRouteError } = require("./lib/errors");

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;

  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error(
      "Mungojnë SUPABASE_URL ose SUPABASE_SERVICE_ROLE_KEY në environment variables.",
    );
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

const HEALTH_PROBE_CACHE_MS = 60 * 1000;
let healthProbeCache = null;
let healthProbeCacheAt = 0;

async function testSupabaseConnection(opts = {}) {
  const bypassCache = opts && opts.bypassCache === true;
  if (
    !bypassCache
    && healthProbeCache
    && Date.now() - healthProbeCacheAt < HEALTH_PROBE_CACHE_MS
  ) {
    return healthProbeCache;
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return {
      ok: false,
      error: "Mungojnë SUPABASE_URL ose SUPABASE_SERVICE_ROLE_KEY",
      url_set: !!url,
      key_set: !!key,
    };
  }

  try {
    const db = getSupabase();
    const { error } = await db.from("clients").select("id", { count: "exact", head: true });
    if (error) {
      logRouteError("supabase:test", error);
      const fail = {
        ok: false,
        error: formatError(error),
        code: error.code,
        details: error.details,
        hint: error.hint,
      };
      healthProbeCache = fail;
      healthProbeCacheAt = Date.now();
      return fail;
    }
    const okResult = { ok: true, url: url.replace(/\/+$/, ""), key_length: key.length };
    healthProbeCache = okResult;
    healthProbeCacheAt = Date.now();
    return okResult;
  } catch (e) {
    logRouteError("supabase:test", e);
    const fail = { ok: false, error: formatError(e) };
    healthProbeCache = fail;
    healthProbeCacheAt = Date.now();
    return fail;
  }
}

module.exports = { getSupabase, testSupabaseConnection };
