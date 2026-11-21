const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../db");
const { verifyWaiterPin } = require("./waiterPinService");
const { normalizeItems } = require("./salesService");
const { loadAreasForClient } = require("./venueService");
const { attachClientPhoto } = require("./menuCatalogService");
const { loadFloorTables } = require("./floorLayoutService");

const ARKA_ROLE = "arka";
const ARKA_DEVICE_PREFIX = "WEB-ARKA-";
const PIN_RE = /^\d{4}$/;

function browserRegisterId(clientId) {
  return crypto
    .createHash("sha256")
    .update(`revolution-browser-arka|${String(clientId || "").trim()}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

function isLegacyBrowserDevice(deviceId) {
  const d = String(deviceId || "").trim().toUpperCase();
  return d === "WEB-ARKA" || d.startsWith(ARKA_DEVICE_PREFIX);
}

async function setupPrimaryDeviceId(clientId) {
  const db = getSupabase();
  const { data: licenses, error } = await db
    .from("licenses")
    .select("id")
    .eq("client_id", clientId);
  if (error || !licenses || !licenses.length) return "";
  const { data: terminals, error: termErr } = await db
    .from("license_terminals")
    .select("device_id, last_seen_at")
    .in("license_id", licenses.map(row => row.id))
    .eq("terminal_role", "arka1")
    .order("last_seen_at", { ascending: false })
    .limit(1);
  if (termErr || !terminals || !terminals.length) return "";
  const id = String(terminals[0].device_id || "").trim().toUpperCase();
  if (!id || id.startsWith("WEB-")) return "";
  return id;
}

async function arkaSaleDeviceId(clientId) {
  const setupId = await setupPrimaryDeviceId(clientId);
  return setupId || browserRegisterId(clientId);
}

function isBrowserOrderRow(row, clientId, setupId) {
  const d = String(row?.device_id || "").trim().toUpperCase();
  const setup = String(setupId || "").trim().toUpperCase();
  if (setup && d === setup) return true;
  if (d === browserRegisterId(clientId)) return true;
  if (isLegacyBrowserDevice(d)) return true;
  const local = String(row?.local_order_id || "").toLowerCase();
  return d === "WEB-WAITER" && local.startsWith("arka-");
}

function isLocalPosDevice(deviceId, clientId, setupId) {
  const d = String(deviceId || "").trim().toUpperCase();
  if (!d || d.startsWith("WEB-")) return false;
  const setup = String(setupId || "").trim().toUpperCase();
  if (setup && d === setup) return false;
  if (clientId && d === browserRegisterId(clientId)) return false;
  return true;
}

function classifyTableOrder(deviceId, clientId, localOrderId, setupId) {
  const d = String(deviceId || "").trim().toUpperCase();
  if (!d) return { occupied: false, editable: true, view_only: false, owner: "free" };
  const setup = String(setupId || "").trim().toUpperCase();
  if ((setup && d === setup) || d === browserRegisterId(clientId) || isLegacyBrowserDevice(d)) {
    return { occupied: true, editable: true, view_only: false, owner: "arka" };
  }
  if (d === "WEB-WAITER" && String(localOrderId || "").toLowerCase().startsWith("arka-")) {
    return { occupied: true, editable: true, view_only: false, owner: "arka" };
  }
  if (isLocalPosDevice(d, clientId, setupId)) return { occupied: true, editable: false, view_only: true, owner: "pos" };
  return { occupied: true, editable: false, view_only: true, owner: "other" };
}

async function loadArkaStaff(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_staff")
    .select("id, name, role, active, pin_hash")
    .eq("client_id", clientId)
    .eq("role", ARKA_ROLE)
    .eq("active", true)
    .not("pin_hash", "is", null);
  if (error) throw error;
  return data || [];
}

async function loginArkaWithPin(clientId, pin) {
  const p = String(pin || "").trim();
  if (!PIN_RE.test(p)) {
    const err = new Error("PIN duhet të jetë 4 shifra.");
    err.status = 400;
    throw err;
  }
  const staff = await loadArkaStaff(clientId);
  for (const row of staff) {
    let ok = false;
    try {
      ok = await bcrypt.compare(p, row.pin_hash);
    } catch {
      ok = false;
    }
    if (ok) return { id: row.id, name: row.name, role: ARKA_ROLE };
  }
  try {
    const waiter = await verifyWaiterPin(clientId, p);
    return { id: waiter.id, name: waiter.name, role: "waiter" };
  } catch (e) {
    const err = new Error(e.message || "PIN i gabuar.");
    err.status = 401;
    throw err;
  }
}

async function getArkaStaffById(clientId, staffId) {
  const id = String(staffId || "").trim();
  if (!id) return null;
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_staff")
    .select("id, name, role, active")
    .eq("client_id", clientId)
    .eq("id", id)
    .in("role", [ARKA_ROLE, "waiter"])
    .maybeSingle();
  if (error) throw error;
  if (!data?.id || data.active === false) return null;
  return { id: data.id, name: data.name, role: data.role || "waiter" };
}

async function loadOpenOrders(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("id, table_number, waiter_name, status, total, items_json, device_id, ordered_at, local_order_id")
    .eq("client_id", clientId)
    .in("status", ["ordered", "ready"])
    .order("ordered_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

function pickTableFace(rows, clientId, setupId) {
  const list = rows || [];
  const local = list.find(r => isLocalPosDevice(r.device_id, clientId, setupId));
  if (local) return local;
  const arka = list.find(r => isBrowserOrderRow(r, clientId, setupId));
  if (arka) return arka;
  return list[0] || null;
}

function arkaAreaGroups(areas, fallbackTableCount) {
  const activeAreas = (areas || [])
    .filter(a => a.active !== false)
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  const groups = [];
  let number = 1;
  if (activeAreas.length) {
    for (const area of activeAreas) {
      const count = Math.min(30, Math.max(0, Number(area.table_count) || 0));
      const tables = [];
      for (let i = 0; i < count; i += 1, number += 1) {
        tables.push({ number, area_name: area.name });
      }
      if (tables.length) groups.push({ id: area.id, name: area.name, tables });
    }
    return groups;
  }
  const count = Math.min(30, Math.max(1, Number(fallbackTableCount) || 10));
  const tables = [];
  for (let n = 1; n <= count; n += 1) tables.push({ number: n, area_name: null });
  return [{ id: null, name: "Tavolinat", tables }];
}

function floorAreas(rows) {
  const byZone = new Map();
  for (const row of rows || []) {
    const name = String(row.zone_name || "").trim() || "Kryesore";
    if (!byZone.has(name)) {
      byZone.set(name, { id: name, name, sort: Number(row.zone_sort) || 0, tables: [] });
    }
    byZone.get(name).tables.push({
      number: Number(row.table_number),
      area_name: name,
      layout_x: Number(row.layout_x),
      layout_y: Number(row.layout_y),
    });
  }
  return [...byZone.values()].sort((a, b) => a.sort - b.sort);
}

async function getArkaTables(clientId) {
  const db = getSupabase();
  const { data: settings } = await db
    .from("pos_settings")
    .select("table_count")
    .eq("client_id", clientId)
    .maybeSingle();
  const areas = await loadAreasForClient(clientId);
  const orders = await loadOpenOrders(clientId);
  const setupId = await setupPrimaryDeviceId(clientId);
  const floorRows = await loadFloorTables(clientId);
  const byTable = new Map();
  for (const row of orders) {
    const n = Number(row.table_number);
    if (!n || n < 1) continue;
    if (!byTable.has(n)) byTable.set(n, []);
    byTable.get(n).push(row);
  }
  const active = new Map();
  for (const [n, rows] of byTable) {
    const face = pickTableFace(rows, clientId, setupId);
    if (!face) continue;
    active.set(n, {
      waiter_name: face.waiter_name,
      total: face.total,
      device_id: face.device_id,
      local_order_id: face.local_order_id,
      items_json: face.items_json,
      order_count: rows.length,
    });
  }
  const layoutAreas = floorRows.length
    ? floorAreas(floorRows)
    : arkaAreaGroups(areas, settings?.table_count);
  const areasOut = layoutAreas.map(area => ({
    id: area.id,
    name: area.name,
    tables: (area.tables || []).map(t => {
      const extra = active.get(t.number);
      const items = normalizeItems(extra?.items_json);
      const qty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      const access = classifyTableOrder(extra?.device_id, clientId, extra?.local_order_id, setupId);
      return {
        number: t.number,
        area_name: t.area_name,
        layout_x: t.layout_x == null ? -1 : Number(t.layout_x),
        layout_y: t.layout_y == null ? -1 : Number(t.layout_y),
        status: access.occupied ? "occupied" : "free",
        waiter_name: extra?.waiter_name || null,
        total: access.occupied ? Number(extra?.total) || Number(t.order_total) || 0 : 0,
        item_count: access.occupied ? qty : 0,
        order_count: access.occupied ? Number(extra?.order_count) || 1 : 0,
        device_id: extra?.device_id || null,
        editable: access.editable && access.owner === "arka",
        view_only: access.view_only,
        owner: access.owner,
        items: access.occupied
          ? items.map(it => ({
            id: it.menu_id != null && it.menu_id !== "" ? String(it.menu_id) : null,
            name: it.name,
            quantity: it.quantity,
            price: it.price,
          }))
          : [],
      };
    }),
  }));
  return {
    areas: areasOut,
    table_count: areasOut.reduce((sum, area) => sum + (area.tables || []).length, 0),
    cash_total: await cashInDrawer(clientId),
  };
}

function belgradeDayStartIso() {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const utcGuess = new Date(`${day}T00:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(utcGuess));
  return new Date(utcGuess.getTime() - hour * 60 * 60000).toISOString();
}

async function cashInDrawer(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("sales_orders")
    .select("total")
    .eq("client_id", clientId)
    .eq("status", "closed")
    .eq("payment_method", "cash")
    .gte("closed_at", belgradeDayStartIso())
    .limit(1000);
  if (error) return 0;
  return (data || []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);
}

function arkaDeviceId(staffId) {
  return ARKA_DEVICE_PREFIX + String(staffId || "").trim();
}

function mapProduct(row, categoryId) {
  const stock = row.stock_quantity == null ? null : Number(row.stock_quantity);
  const base = {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    barcode: row.barcode || "",
    sold_by_weight: false,
    stock_quantity: Number.isFinite(stock) ? stock : null,
    category_id: categoryId || null,
    low_stock: Number.isFinite(stock) && stock <= 0,
  };
  return attachClientPhoto(base, row);
}

async function listArkaCategories(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_categories")
    .select("id, name, sort_order")
    .eq("client_id", clientId)
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data || [];
}

async function listArkaProducts(clientId, categoryId) {
  const db = getSupabase();
  const { data: cat, error: catErr } = await db
    .from("pos_categories")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("id", categoryId)
    .maybeSingle();
  if (catErr) throw catErr;
  if (!cat) {
    const err = new Error("Kategoria nuk u gjet.");
    err.status = 404;
    throw err;
  }
  const { data, error } = await db
    .from("pos_menu_items")
    .select("id, name, price, barcode, stock_quantity, category, active, photo")
    .eq("client_id", clientId)
    .eq("active", true)
    .eq("category", cat.name)
    .order("name");
  if (error) throw error;
  return (data || []).map(row => mapProduct(row, cat.id));
}

async function searchArkaProducts(clientId, query) {
  const q = String(query || "").trim();
  if (q.length < 1) {
    const err = new Error("Shkruani emrin ose barkodin.");
    err.status = 400;
    throw err;
  }
  const db = getSupabase();
  const safe = q.replace(/[%_,]/g, "");
  if (!safe) {
    const err = new Error("Shkruani emrin ose barkodin.");
    err.status = 400;
    throw err;
  }
  const { data, error } = await db
    .from("pos_menu_items")
    .select("id, name, price, barcode, stock_quantity, category, active, photo")
    .eq("client_id", clientId)
    .eq("active", true)
    .or(`name.ilike.%${safe}%,barcode.eq.${safe}`)
    .order("name")
    .limit(40);
  if (error) throw error;
  const cats = await listArkaCategories(clientId);
  const byName = new Map(cats.map(c => [String(c.name), c.id]));
  return (data || []).map(row => mapProduct(row, byName.get(String(row.category)) || null));
}

function paymentMethodFor(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "cash") return "cash";
  if ([
    "card", "karte", "kartë", "kart",
    "debit_card", "credit_card", "sms", "check", "bank_account", "voucher",
  ].includes(v)) return "karte";
  const err = new Error("Pagesa nuk njihet.");
  err.status = 400;
  throw err;
}

async function completeArkaSale(clientId, staff, body) {
  const tableNumber = Number(body?.table_id ?? body?.table_number);
  if (!tableNumber || tableNumber < 1) {
    const err = new Error("Tavolina mungon.");
    err.status = 400;
    throw err;
  }
  const lines = Array.isArray(body?.items) ? body.items : [];
  if (!lines.length) {
    const err = new Error("Shporta është bosh.");
    err.status = 400;
    throw err;
  }
  const keepOpen = body?.keep_open === true;
  const method = keepOpen ? null : paymentMethodFor(body?.payment_type || body?.payment_method);
  const setupId = await setupPrimaryDeviceId(clientId);
  const deviceId = setupId || browserRegisterId(clientId);
  const db = getSupabase();
  const orders = await loadOpenOrders(clientId);
  const onTable = orders.filter(r => Number(r.table_number) === tableNumber);
  const ids = [...new Set(lines.map(it => String(it.product_id || it.id || "").trim()).filter(Boolean))];
  const uuids = ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  const locals = ids.filter(id => /^\d+$/.test(id)).map(Number);
  const rows = [];
  if (uuids.length) {
    const { data, error: prodErr } = await db
      .from("pos_menu_items")
      .select("id, local_id, name, price, stock_quantity, active")
      .eq("client_id", clientId)
      .in("id", uuids);
    if (prodErr) throw prodErr;
    rows.push(...(data || []));
  }
  if (locals.length) {
    const { data, error: prodErr } = await db
      .from("pos_menu_items")
      .select("id, local_id, name, price, stock_quantity, active")
      .eq("client_id", clientId)
      .in("local_id", locals);
    if (prodErr) throw prodErr;
    rows.push(...(data || []));
  }
  const byId = new Map();
  for (const product of rows) {
    byId.set(String(product.id), product);
    if (product.local_id != null) byId.set(String(product.local_id), product);
  }
  const merged = new Map();
  for (const line of lines) {
    const id = String(line.product_id || line.id || "").trim();
    const product = byId.get(id);
    if (!product || product.active === false) {
      const err = new Error("Një produkt nuk është në listë.");
      err.status = 400;
      throw err;
    }
    const qty = Math.round(Number(line.quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      const err = new Error("Sasia duhet të jetë numër i plotë.");
      err.status = 400;
      throw err;
    }
    const prev = merged.get(id);
    if (prev) prev.quantity += qty;
    else {
      merged.set(id, {
        id: product.id,
        menu_id: product.id,
        name: product.name,
        quantity: qty,
        price: Number(product.price) || 0,
      });
    }
  }
  const items = [...merged.values()];
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const now = new Date().toISOString();
  const own = onTable.find(r => isBrowserOrderRow(r, clientId, setupId)) || null;
  let licenseId = null;
  const { data: lic } = await db
    .from("licenses")
    .select("id")
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();
  if (lic?.id) licenseId = lic.id;
  const row = {
    client_id: clientId,
    local_order_id: own?.local_order_id || `arka-${crypto.randomUUID()}`,
    device_id: deviceId,
    table_number: tableNumber,
    waiter_name: staff.name,
    waiter_id: staff.id,
    items_json: items,
    total,
    status: keepOpen ? "ordered" : "closed",
    payment_status: keepOpen ? "pending" : "paid",
    closed_at: now,
    ordered_at: own?.ordered_at || now,
  };
  if (!keepOpen) {
    row.payment_method = method;
    row.paid_at = now;
  }
  if (licenseId) row.license_id = licenseId;
  let saved;
  let error;
  if (own?.id) {
    ({ data: saved, error } = await db
      .from("sales_orders")
      .update(row)
      .eq("id", own.id)
      .eq("client_id", clientId)
      .select("id")
      .single());
  } else {
    ({ data: saved, error } = await db
      .from("sales_orders")
      .insert(row)
      .select("id")
      .single());
  }
  if (error && row.waiter_id && /waiter_id|schema cache/i.test(String(error.message || ""))) {
    delete row.waiter_id;
    if (own?.id) {
      ({ data: saved, error } = await db.from("sales_orders").update(row).eq("id", own.id).eq("client_id", clientId).select("id").single());
    } else {
      ({ data: saved, error } = await db.from("sales_orders").insert(row).select("id").single());
    }
  }
  if (error) throw new Error(error.message || "Shitja nuk u ruajt.");
  if (!keepOpen && saved?.id) {
    await db
      .from("sales_orders")
      .update({ status: "cancelled", closed_at: now, total: 0, ready_at: null })
      .eq("client_id", clientId)
      .eq("table_number", tableNumber)
      .in("status", ["ordered", "ready"])
      .neq("id", saved.id);
  }
  if (!keepOpen) {
    for (const it of items) {
      const product = byId.get(it.id);
      if (product?.stock_quantity == null) continue;
      const next = Number(product.stock_quantity) - it.quantity;
      await db
        .from("pos_menu_items")
        .update({ stock_quantity: next })
        .eq("id", product.id)
        .eq("client_id", clientId);
    }
  }
  try {
    require("./kdsEvents").notifyKitchenUpdate(clientId, {
      order_id: saved.id,
      table_number: tableNumber,
      status: keepOpen ? "ordered" : "closed",
      device_id: row.device_id,
    });
  } catch (err) {}
  return { sale_id: saved.id, total, payment_method: method, status: keepOpen ? "ordered" : "closed" };
}

module.exports = {
  ARKA_ROLE,
  ARKA_DEVICE_PREFIX,
  browserRegisterId,
  setupPrimaryDeviceId,
  arkaSaleDeviceId,
  classifyTableOrder,
  loginArkaWithPin,
  getArkaStaffById,
  getArkaTables,
  listArkaCategories,
  listArkaProducts,
  searchArkaProducts,
  completeArkaSale,
  arkaDeviceId,
};
