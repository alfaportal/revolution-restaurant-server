/** Kohë minimale e porosisë në radhën e kuzhinës (si pritja e kamarierit). */
const KITCHEN_HOLD_MS = 30 * 60 * 1000;

function orderTouchMs(row) {
  const raw = row?.ordered_at || row?.created_at || row?.pos_synced_at;
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/**
 * Porosi që duhet mbajtur në KDS — mos auto-anulo (table-free, sync, closed race).
 * Deri «Gati» (ready_at) ose deri 30 min nga ordered_at.
 */
function isKitchenLifecycleActive(row) {
  if (!row) return false;
  const st = String(row.status || "").toLowerCase();
  if (st !== "ordered" && st !== "ready") return false;

  const readyAt = String(row.ready_at || "").trim();
  if (readyAt) {
    const rt = new Date(readyAt).getTime();
    if (Number.isFinite(rt) && Date.now() - rt < KITCHEN_HOLD_MS) return true;
    return false;
  }

  const touch = orderTouchMs(row);
  if (touch == null) return true;
  return Date.now() - touch < KITCHEN_HOLD_MS;
}

function isForceKitchenCancel(body) {
  if (!body) return false;
  return (
    body.force_kitchen_cancel === true
    || body.force_kitchen_cancel === 1
    || body.force_kitchen_cancel === "1"
    || body.force_kitchen_cancel === "true"
    || body.waiter_explicit_cancel === true
    || body.waiter_explicit_cancel === 1
  );
}

module.exports = {
  KITCHEN_HOLD_MS,
  isKitchenLifecycleActive,
  isForceKitchenCancel,
};
