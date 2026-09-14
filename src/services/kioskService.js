const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../db");
const { normalizeItems, mergeOrderItems, updateActiveSaleFromPos } = require("./salesService");
const { getLicenseForClient, cancelTableOrder } = require("./waiterService");
const { isOrderAccepted } = require("../lib/salesOrderSelect");
const { WEB_KIOSK } = require("../lib/orderSource");
const { getClientMenuCatalog } = require("./menuCatalogService");
const { issueOrderTrackToken } = require("../lib/orderTrackToken");

const KIOSK_DEVICE = WEB_KIOSK;

function tableWaiterLabel(tableNumber) {
  return `QR · T${tableNumber}`;
}

async function getKioskMenu(clientId, { kitchenSlug = "", channel = "kiosk" } = {}) {
  return getClientMenuCatalog(clientId, {
    activeOnly: true,
    kitchenSlug,
    channel,
  });
}

async function submitKioskOrder(client, body) {
  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) {
    throw new Error("Mungon numri i tavolinës (?table=... në link).");
  }

  const newItems = normalizeItems(body.items);
  if (!newItems.length) throw new Error("Shtoni të paktën një artikull.");

  const now = new Date().toISOString();
  const license = await getLicenseForClient(client.id);
  const waiterName = tableWaiterLabel(tableNumber);

  // Një porosi QR në pritje për T — përditëso të njëjtin rresht cloud (jo kiosk-uuid të ri çdo skanim).
  let pendingKiosk = null;
  try {
    const db = getSupabase();
    const { data } = await db
      .from("sales_orders")
      .select("id, local_order_id, items_json, ordered_at, accepted_at, accepted_by_waiter_name")
      .eq("client_id", client.id)
      .eq("table_number", tableNumber)
      .eq("device_id", KIOSK_DEVICE)
      .in("status", ["ordered", "ready"])
      .order("ordered_at", { ascending: false })
      .limit(5);
    pendingKiosk = (data || []).find(row => !isOrderAccepted(row)) || null;
  } catch (err) {
    console.warn("[kiosk/orders] pending lookup:", err.message);
  }

  const items = pendingKiosk
    ? mergeOrderItems(pendingKiosk.items_json, newItems)
    : newItems;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const localOrderId = pendingKiosk?.local_order_id || `kiosk-${uuidv4()}`;

  const sale = await updateActiveSaleFromPos({
    celesi: license.celesi,
    device_id: KIOSK_DEVICE,
    local_order_id: localOrderId,
    table_number: tableNumber,
    waiter_name: waiterName,
    items,
    total,
    status: "ordered",
    ordered_at: pendingKiosk?.ordered_at || now,
  });

  try {
    const { deductStockForOrder } = require("./stockService");
    await deductStockForOrder(client.id, newItems);
  } catch (err) {
    console.warn("[stock] kiosk deduct failed:", err.message);
  }

  try {
    const { deductIngredientsForOrder } = require("./inventoryService");
    await deductIngredientsForOrder(client.id, newItems);
  } catch (err) {
    console.warn("[inventory] kiosk deduct failed:", err.message);
  }

  if (sale?.id) {
    try {
      const { notifyKitchenUpdate } = require("./kdsEvents");
      notifyKitchenUpdate(client.id, {
        order_id: sale.id,
        table_number: tableNumber,
        status: "ordered",
        device_id: WEB_KIOSK,
        waiter_name: waiterName,
      });
    } catch (err) {
      console.warn("[kiosk/orders] SSE notify failed:", err.message);
    }
  }

  return {
    ok: true,
    order: sale,
    order_id: sale?.id || null,
    track_token: sale?.id ? issueOrderTrackToken(client.id, sale.id) : "",
    client_name: client.emri,
    sent_to: "bar",
    table_number: tableNumber,
  };
}

async function cancelKioskOrder(client, body) {
  const tableNumber = Number(body.table_number);
  if (!tableNumber || tableNumber < 1) {
    throw new Error("Mungon numri i tavolinës.");
  }
  const { getActiveTableOrders } = require("./waiterService");
  const active = await getActiveTableOrders(client.id);
  const existing = active.get(tableNumber);
  const sale = await cancelTableOrder(client.id, { tableNumber, existing });
  return {
    ok: true,
    message: "Porosia u anullua",
    order: sale,
    table_number: tableNumber,
  };
}

module.exports = {
  getKioskMenu,
  submitKioskOrder,
  cancelKioskOrder,
};
