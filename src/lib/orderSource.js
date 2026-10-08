const WEB_WAITER = "WEB-WAITER";
const WEB_KIOSK = "WEB-KIOSK";
const WEB_PUBLIC = "WEB-PUBLIC";

function isKioskWaiterName(name) {
  const n = String(name || "").trim().toLowerCase();
  return n === "kiosk" || n.startsWith("tavolin") || n.startsWith("qr");
}

function publicOrderWaiterLabel(orderType, name, phone, deliveryAddress) {
  const kind = orderType === "delivery" ? "Delivery" : "Takeaway";
  const customer = String(name || "").trim();
  const tel = String(phone || "").trim();
  let label = `${kind}: ${customer} (${tel})`;
  if (orderType === "delivery") {
    const addr = String(deliveryAddress || "").trim();
    if (addr) label += ` · ${addr}`;
  }
  return label;
}

function publicOrderTypeFromWaiter(waiterName) {
  const w = String(waiterName || "").trim().toLowerCase();
  if (w.startsWith("delivery")) return "delivery";
  if (w.startsWith("takeaway")) return "takeaway";
  return null;
}

function posTerminalLabel(terminalRole) {
  const m = /^arka(\d+)$/.exec(String(terminalRole || "").trim().toLowerCase());
  if (!m) return "POS";
  return Number(m[1]) === 1 ? "POS Kryesore" : `POS Arka ${Number(m[1])}`;
}

function orderSourceLabel({ device_id, waiter_name, terminal_role } = {}) {
  const device = String(device_id || "").trim().toUpperCase();
  if (device === WEB_PUBLIC) {
    const kind = publicOrderTypeFromWaiter(waiter_name);
    if (kind === "delivery") return { code: "delivery", label: "Delivery", icon: "🛵" };
    return { code: "takeaway", label: "Takeaway", icon: "🥡" };
  }
  if (device === WEB_KIOSK || isKioskWaiterName(waiter_name)) {
    return { code: "table", label: "Tavolinë", icon: "🪑" };
  }
  if (device === WEB_WAITER) {
    return { code: "waiter", label: "Kamarier", icon: "📱" };
  }
  return { code: "pos", label: posTerminalLabel(terminal_role), icon: "🖥️" };
}

function isPublicWebOrder(order) {
  return String(order?.device_id || "").trim().toUpperCase() === WEB_PUBLIC;
}

function isStaffWaiterOrder(order) {
  return String(order?.device_id || "").trim().toUpperCase() === WEB_WAITER;
}

/** Porosi nga klientët (QR, kiosk, web) — jo nga kamarierët me telefon */
function isCustomerBarOrder(order) {
  if (!isBarMobileOrder(order)) return false;
  if (isStaffWaiterOrder(order)) return false;
  return true;
}

function isBarMobileOrder(order) {
  const device = String(order?.device_id || "").trim().toUpperCase();
  if (device === WEB_WAITER || device === WEB_KIOSK || device === WEB_PUBLIC) return true;
  if (isKioskWaiterName(order?.waiter_name)) return true;
  return false;
}

/** QR / web klient — batch-e të veçanta që nuk duhen anuluar nga sinkronizimi POS */
function isCustomerChannelDevice(deviceId) {
  const d = String(deviceId || "").trim().toUpperCase();
  return d === WEB_KIOSK || d === WEB_PUBLIC;
}

/** Porosi aktive nga telefon/tablet — mos i anulo kur POS thotë «tavolinë e lirë» lokale */
function isRemoteActiveTableOrder(deviceId) {
  const d = String(deviceId || "").trim().toUpperCase();
  return d === WEB_KIOSK || d === WEB_PUBLIC || d === WEB_WAITER;
}

/** Terminali lokal Electron — jo WEB-WAITER/KIOSK/PUBLIC */
function isPosDesktopDevice(deviceId) {
  const d = String(deviceId || "").trim().toUpperCase();
  if (!d) return true;
  return !d.startsWith("WEB-");
}

/** Porosi nga klienti (QR, kiosk, web) — përdoret për banak/online, jo si filtër i përgjithshëm i kuzhinës. */
function isDirectCustomerKitchenOrder(order) {
  if (isPosDesktopDevice(order?.device_id)) return false;
  if (isStaffWaiterOrder(order)) return false;
  return isCustomerBarOrder(order);
}

/**
 * Kuzhina NUK lidhet me tavolinën — vetëm QR në tavolinë fizike pret «Dërgo/Prano» POS.
 * Takeaway, delivery dhe faqja publike (WEB-PUBLIC) shfaqen direkt te KDS.
 */
function isKitchenGatedByPosAccept(order) {
  return isQrTablePosWaiterAcceptOrder(order);
}

/** QR tavolinë — pranimi vetëm në POS (kamarier), jo KDS/banak/kuzhinë. */
function isQrTablePosWaiterAcceptOrder(order) {
  if (isStaffWaiterOrder(order)) return false;
  const device = String(order?.device_id || "").trim().toUpperCase();
  const tableNum = Number(order?.table_number) || 0;
  if (tableNum <= 0) return false;
  if (device === WEB_KIOSK) return true;
  if (isKioskWaiterName(order?.waiter_name)) return true;
  const label = String(order?.source_label || order?.waiter_name || "").toLowerCase();
  return /qr|tavolin|kiosk/.test(label);
}

module.exports = {
  WEB_WAITER,
  WEB_KIOSK,
  WEB_PUBLIC,
  isKioskWaiterName,
  publicOrderWaiterLabel,
  publicOrderTypeFromWaiter,
  orderSourceLabel,
  isPublicWebOrder,
  isStaffWaiterOrder,
  isCustomerBarOrder,
  isBarMobileOrder,
  isCustomerChannelDevice,
  isRemoteActiveTableOrder,
  isPosDesktopDevice,
  isDirectCustomerKitchenOrder,
  isKitchenGatedByPosAccept,
  isQrTablePosWaiterAcceptOrder,
};
