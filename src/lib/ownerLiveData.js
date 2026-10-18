/** Panel pronari (telefon) — vetëm porosi «live», jo histori e ngrirë. */
const OWNER_LIVE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const OWNER_OPEN_STATUSES = ["ordered", "ready"];

function ownerLiveCutoffIso(maxAgeMs = OWNER_LIVE_MAX_AGE_MS) {
  return new Date(Date.now() - maxAgeMs).toISOString();
}

function orderCreatedMs(row) {
  const raw = row?.created_at || row?.ordered_at;
  if (!raw) return NaN;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : NaN;
}

function isOwnerLiveOpenOrder(row, { businessYmd = null, maxAgeMs = OWNER_LIVE_MAX_AGE_MS } = {}) {
  if (!row) return false;
  const st = String(row.status || "").toLowerCase();
  if (!OWNER_OPEN_STATUSES.includes(st)) return false;
  const ms = orderCreatedMs(row);
  if (!Number.isFinite(ms) || Date.now() - ms > maxAgeMs) return false;
  if (businessYmd) {
    const day = new Date(ms).toISOString().slice(0, 10);
    if (day !== String(businessYmd).slice(0, 10)) return false;
  }
  return true;
}

module.exports = {
  OWNER_LIVE_MAX_AGE_MS,
  OWNER_OPEN_STATUSES,
  ownerLiveCutoffIso,
  orderCreatedMs,
  isOwnerLiveOpenOrder,
};
