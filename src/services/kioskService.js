const { normalizeItems } = require("./salesService");
const {
  getLicenseForClient,
  cancelTableOrder,
  submitPhysicalTableWebOrder,
  findUnacceptedKioskOrderOnTable,
} = require("./waiterService");
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

  const { sale } = await submitPhysicalTableWebOrder(client.id, {
    tableNumber,
    items: body.items,
    deviceId: KIOSK_DEVICE,
    waiterName: tableWaiterLabel(tableNumber),
  });

  if (sale?.id) {
    try {
      const { notifyKitchenUpdate } = require("./kdsEvents");
      notifyKitchenUpdate(client.id, {
        order_id: sale.id,
        table_number: tableNumber,
        status: "ordered",
        device_id: WEB_KIOSK,
        waiter_name: tableWaiterLabel(tableNumber),
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
  const pending = await findUnacceptedKioskOrderOnTable(client.id, tableNumber);
  if (!pending) {
    throw new Error("Nuk ka porosi QR në pritje për anullim në këtë tavolinë.");
  }
  const sale = await cancelTableOrder(client.id, { tableNumber, existing: pending });
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
