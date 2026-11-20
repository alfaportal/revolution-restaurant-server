const { getSupabase } = require("../db");

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractFloorZones(body) {
  const raw = Array.isArray(body?.zones) && body.zones.some(z => Array.isArray(z?.tables))
    ? body.zones
    : (Array.isArray(body?.floor?.zones)
      ? body.floor.zones
      : (Array.isArray(body?.table_layout?.zones) ? body.table_layout.zones : null));
  if (!raw) return null;
  const zones = [];
  for (let i = 0; i < raw.length; i += 1) {
    const zone = raw[i] || {};
    const name = String(zone.name || "").trim();
    if (!name) continue;
    const tables = (Array.isArray(zone.tables) ? zone.tables : []).map((table, index) => ({
      number: Math.round(num(table.number, 0)),
      layout_x: num(table.layout_x, -1),
      layout_y: num(table.layout_y, -1),
      layout_col: Math.round(num(table.layout_col, -1)),
      layout_row: Math.round(num(table.layout_row, -1)),
      sort_order: Math.round(num(table.sort_order, index)),
    })).filter(table => table.number >= 1 && table.number <= 200);
    zones.push({
      name,
      sort_order: Math.round(num(zone.sort_order, i)),
      layout_rows: Math.round(num(zone.layout_rows, 0)),
      tables,
    });
  }
  return zones.length ? zones : null;
}

async function saveFloorFromPos(clientId, body) {
  const zones = extractFloorZones(body);
  if (!zones) return { saved: false };
  const db = getSupabase();
  const rows = [];
  for (const zone of zones) {
    for (const table of zone.tables) {
      rows.push({
        client_id: clientId,
        zone_name: zone.name,
        zone_sort: zone.sort_order,
        layout_rows: zone.layout_rows,
        table_number: table.number,
        layout_x: table.layout_x,
        layout_y: table.layout_y,
        layout_col: table.layout_col,
        layout_row: table.layout_row,
        sort_order: table.sort_order,
      });
    }
  }
  const { error: delErr } = await db.from("pos_floor_tables").delete().eq("client_id", clientId);
  if (delErr) throw delErr;
  if (rows.length) {
    const { error } = await db.from("pos_floor_tables").insert(rows);
    if (error) throw error;
  }
  const names = new Set(zones.map(zone => zone.name));
  for (const zone of zones) {
    const count = Math.min(30, zone.tables.length);
    const { data: existing } = await db
      .from("pos_areas")
      .select("id")
      .eq("client_id", clientId)
      .eq("name", zone.name)
      .maybeSingle();
    const patch = { table_count: count, sort_order: zone.sort_order, active: count > 0 };
    if (existing?.id) {
      await db.from("pos_areas").update(patch).eq("id", existing.id);
    } else if (count > 0) {
      await db.from("pos_areas").insert({ client_id: clientId, name: zone.name, ...patch });
    }
  }
  const { data: areas } = await db.from("pos_areas").select("id, name").eq("client_id", clientId);
  for (const area of areas || []) {
    if (!names.has(area.name)) {
      await db.from("pos_areas").update({ active: false, table_count: 0 }).eq("id", area.id);
    }
  }
  return { saved: true, zones: zones.length, tables: rows.length };
}

async function loadFloorTables(clientId) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pos_floor_tables")
    .select("zone_name, zone_sort, layout_rows, table_number, layout_x, layout_y, layout_col, layout_row, sort_order")
    .eq("client_id", clientId)
    .order("zone_sort", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("table_number", { ascending: true });
  if (error) return [];
  return data || [];
}

module.exports = { extractFloorZones, saveFloorFromPos, loadFloorTables };
