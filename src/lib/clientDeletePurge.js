"use strict";

const { getPgPool, withPgTransaction } = require("./pgPool");

/** Tabela me FK license_id — prod shpesh pa ON DELETE CASCADE. */
const LICENSE_CHILD_TABLES = [
  "license_terminals",
  "license_email_notifications",
  "trial_notifications",
  "license_hardware_controls",
  "license_terminal_revocations",
  "terminal_pair_codes",
  "terminal_relay_messages",
  "terminal_relay_presence",
  "terminal_relay_snapshots",
  "terminal_relay_queue",
  "license_remote_audit",
];

/**
 * FK te clients — të gjitha produktet (kafene, furra, hotel, market).
 * Rend: fëmijët para prindit; tabela që mungon në DB injorohet.
 */
const CLIENT_DELETE_TARGETS = [
  ["order_refusal_events", "client_id"],
  ["stock_alert_notifications", "client_id"],
  ["ingredient_alert_notifications", "restaurant_id"],
  ["daily_report_notifications", "restaurant_id"],
  ["market_manager_inbox_dismissals", "client_id"],
  ["market_manager_inbox", "client_id"],
  ["market_staff_notifications", "client_id"],
  ["market_staff_checks", "client_id"],
  ["market_staff_tasks", "client_id"],
  ["market_shop_staff", "client_id"],
  ["market_owner_notifications", "client_id"],
  ["market_manager_notification_settings", "client_id"],
  ["market_manager_permissions", "client_id"],
  ["hotel_room_charges", "client_id"],
  ["hotel_housekeeping", "client_id"],
  ["hotel_reservations", "client_id"],
  ["hotel_guests", "client_id"],
  ["hotel_public_booking_requests", "client_id"],
  ["hotel_service_requests", "client_id"],
  ["hotel_services", "client_id"],
  ["hotel_service_categories", "client_id"],
  ["hotel_room_types", "client_id"],
  ["hotel_qr_venues", "client_id"],
  ["hotel_bank_accounts", "client_id"],
  ["hotel_rooms", "client_id"],
  ["pos_owner_daily_summaries", "client_id"],
  ["sales_orders", "client_id"],
  ["fiscal_receipts", "client_id"],
  ["daily_z_reports", "client_id"],
  ["pos_menu_items", "client_id"],
  ["pos_categories", "client_id"],
  ["pos_staff", "client_id"],
  ["pos_areas", "client_id"],
  ["pos_waiter_tables", "client_id"],
  ["pos_pending_purchases", "client_id"],
  ["owner_expenses", "client_id"],
  ["owner_activity_log", "client_id"],
  ["terminal_pair_codes", "client_id"],
  ["offline_notifications", "client_id"],
  ["ai_waiter_ratings", "restaurant_id"],
  ["ai_weekly_reports", "restaurant_id"],
  ["ai_chat_history", "restaurant_id"],
  ["ai_daily_reports", "restaurant_id"],
  ["supply_suggestions", "restaurant_id"],
  ["ai_usage_logs", "restaurant_id"],
  ["ingredients", "restaurant_id"],
  ["reservations", "restaurant_id"],
  ["notification_settings", "restaurant_id"],
  ["pos_settings", "client_id"],
];

function isMissingRelation(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || error?.details || "");
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist|schema cache|Could not find the table/i.test(msg)
  );
}

function isMissingPgRelation(err) {
  const msg = String(err?.message || err || "");
  return /does not exist|relation .* does not exist|undefined_table/i.test(msg);
}

function isMissingRpc(error) {
  const msg = String(error?.message || error?.code || error?.details || "");
  return /function.*does not exist|PGRST202|42883|admin_purge_client_licenses|admin_purge_single_license/i.test(
    msg,
  );
}

async function deleteSingleLicenseViaRpc(db, licenseId) {
  const lid = String(licenseId || "").trim();
  if (!lid) return false;
  const { error } = await db.rpc("admin_purge_single_license", { p_license_id: lid });
  if (!error) return true;
  if (isMissingRpc(error)) return false;
  throw error;
}

async function purgeLicenseDependencies(db, licenseId) {
  const id = String(licenseId || "").trim();
  if (!id) return;
  for (const table of LICENSE_CHILD_TABLES) {
    const { error } = await db.from(table).delete().eq("license_id", id);
    if (!error) continue;
    if (!isMissingRelation(error)) throw error;
  }
}

async function deleteLicenseTerminalsRest(db, licenseIds) {
  const ids = (licenseIds || []).filter(Boolean);
  if (!ids.length) return;
  const { error: bulkErr } = await db.from("license_terminals").delete().in("license_id", ids);
  if (bulkErr) throw bulkErr;
  for (const licId of ids) {
    const { error: oneErr } = await db.from("license_terminals").delete().eq("license_id", licId);
    if (oneErr) throw oneErr;
  }
  const { data: rows, error: selErr } = await db
    .from("license_terminals")
    .select("id")
    .in("license_id", ids);
  if (selErr && !isMissingRelation(selErr)) throw selErr;
  for (const row of rows || []) {
    const { error } = await db.from("license_terminals").delete().eq("id", row.id);
    if (error) throw error;
  }
  const { count, error: cntErr } = await db
    .from("license_terminals")
    .select("id", { count: "exact", head: true })
    .in("license_id", ids);
  if (cntErr && !isMissingRelation(cntErr)) throw cntErr;
  if ((count || 0) > 0) {
    throw new Error(
      `Nuk u fshinë ${count} arka (license_terminals) — kontaktoni support ose provoni përsëri pas disa minutash.`,
    );
  }
}

async function deleteLicensesForClientViaRpc(db, clientId) {
  const cid = String(clientId || "").trim();
  if (!cid) return false;
  const { error } = await db.rpc("admin_purge_client_licenses", { p_client_id: cid });
  if (!error) return true;
  if (isMissingRpc(error)) return false;
  throw error;
}

async function deleteLicensesForClientViaPg(clientId) {
  const pool = getPgPool();
  if (!pool) return false;
  const cid = String(clientId || "").trim();
  if (!cid) return false;

  await withPgTransaction(async (client) => {
    for (const table of LICENSE_CHILD_TABLES) {
      try {
        await client.query(
          `DELETE FROM ${table} WHERE license_id IN (SELECT id FROM licenses WHERE client_id = $1::uuid)`,
          [cid],
        );
      } catch (e) {
        if (!isMissingPgRelation(e)) throw e;
      }
    }
    await client.query(`DELETE FROM licenses WHERE client_id = $1::uuid`, [cid]);
  });
  return true;
}

async function deleteLicensesForClient(db, clientId) {
  const { data: licenses, error: listErr } = await db
    .from("licenses")
    .select("id")
    .eq("client_id", clientId);
  if (listErr && !isMissingRelation(listErr)) throw listErr;
  const licenseIds = (licenses || []).map((lic) => lic?.id).filter(Boolean);
  if (licenseIds.length) {
    await deleteLicenseTerminalsRest(db, licenseIds);
  }

  try {
    if (await deleteLicensesForClientViaRpc(db, clientId)) return;
  } catch (err) {
    console.warn("[deleteLicensesForClient] rpc:", err.message || err);
    if (!isMissingRpc(err)) throw err;
  }

  try {
    if (await deleteLicensesForClientViaPg(clientId)) return;
  } catch (err) {
    console.warn("[deleteLicensesForClient] pg fallback to REST:", err.message || err);
  }
  for (const licId of licenseIds) {
    await purgeLicenseDependencies(db, licId);
  }
  const { error: licErr } = await db.from("licenses").delete().eq("client_id", clientId);
  if (licErr && !isMissingRelation(licErr)) throw licErr;
}

async function deleteClientDependentRows(db, clientId) {
  for (const [table, column] of CLIENT_DELETE_TARGETS) {
    const { error } = await db.from(table).delete().eq(column, clientId);
    if (!error) continue;
    if (!isMissingRelation(error)) throw error;
  }
}

async function deleteClientDependentRowsViaPg(clientId) {
  const pool = getPgPool();
  if (!pool) return false;
  const cid = String(clientId || "").trim();
  if (!cid) return false;
  await withPgTransaction(async (client) => {
    for (const [table, column] of CLIENT_DELETE_TARGETS) {
      try {
        await client.query(`DELETE FROM ${table} WHERE ${column} = $1::uuid`, [cid]);
      } catch (e) {
        if (!isMissingPgRelation(e)) throw e;
      }
    }
  });
  return true;
}

async function deleteSingleLicenseViaPg(licenseId) {
  const pool = getPgPool();
  if (!pool) return false;
  const lid = String(licenseId || "").trim();
  if (!lid) return false;
  const deleted = await withPgTransaction(async (client) => {
    for (const table of LICENSE_CHILD_TABLES) {
      try {
        await client.query(`DELETE FROM ${table} WHERE license_id = $1::uuid`, [lid]);
      } catch (e) {
        if (!isMissingPgRelation(e)) throw e;
      }
    }
    const res = await client.query(`DELETE FROM licenses WHERE id = $1::uuid RETURNING id`, [lid]);
    return (res.rowCount || 0) > 0;
  });
  return !!deleted;
}

/** Fshi një licencë (+ arkat) — Super Admin «Fshi licencën». */
async function deleteSingleLicense(db, licenseId) {
  const lid = String(licenseId || "").trim();
  if (!lid) throw new Error("ID e licencës mungon.");

  await deleteLicenseTerminalsRest(db, [lid]);

  try {
    if (await deleteSingleLicenseViaRpc(db, lid)) return { ok: true };
  } catch (err) {
    console.warn("[deleteSingleLicense] rpc:", err.message || err);
    if (!isMissingRpc(err)) throw err;
  }

  try {
    if (await deleteSingleLicenseViaPg(lid)) return { ok: true };
  } catch (err) {
    console.warn("[deleteSingleLicense] pg:", err.message || err);
  }

  await deleteLicenseTerminalsRest(db, [lid]);
  await purgeLicenseDependencies(db, lid);
  const { error } = await db.from("licenses").delete().eq("id", lid);
  if (error) throw error;
  return { ok: true };
}

/** Pastron varësitë + licencat — para DELETE te clients. */
async function purgeClientBeforeDelete(db, clientId) {
  try {
    await deleteClientDependentRowsViaPg(clientId);
  } catch (err) {
    console.warn("[purgeClientBeforeDelete] pg:", err.message || err);
  }
  await deleteClientDependentRows(db, clientId);
  await deleteLicensesForClient(db, clientId);
}

/** Prod shpesh pa ON DELETE CASCADE te owner_group_members.user_id → fshi para users. */
async function deleteOwnerGroupMembersForClientUsers(db, clientId) {
  const cid = String(clientId || "").trim();
  if (!cid) return;

  const { data: users, error: listErr } = await db.from("users").select("id").eq("client_id", cid);
  if (listErr && !isMissingRelation(listErr)) throw listErr;
  const userIds = (users || []).map((u) => u?.id).filter(Boolean);
  if (!userIds.length) return;

  const { error: bulkErr } = await db.from("owner_group_members").delete().in("user_id", userIds);
  if (bulkErr && !isMissingRelation(bulkErr)) throw bulkErr;

  for (const uid of userIds) {
    const { error: oneErr } = await db.from("owner_group_members").delete().eq("user_id", uid);
    if (oneErr && !isMissingRelation(oneErr)) throw oneErr;
  }

  const { count, error: cntErr } = await db
    .from("owner_group_members")
    .select("id", { count: "exact", head: true })
    .in("user_id", userIds);
  if (cntErr && !isMissingRelation(cntErr)) throw cntErr;
  if ((count || 0) > 0) {
    throw new Error(
      `Nuk u fshinë ${count} anëtar(ë) grupi (owner_group_members) — provoni përsëri ose kontaktoni support.`,
    );
  }
}

async function deleteOwnerGroupMembersForClientUsersViaPg(clientId) {
  const pool = getPgPool();
  if (!pool) return false;
  const cid = String(clientId || "").trim();
  if (!cid) return false;
  await withPgTransaction(async (client) => {
    try {
      await client.query(
        `DELETE FROM owner_group_members
         WHERE user_id IN (SELECT id FROM users WHERE client_id = $1::uuid)`,
        [cid],
      );
    } catch (e) {
      if (!isMissingPgRelation(e)) throw e;
    }
  });
  return true;
}

/** Fshin përdoruesit e klientit — pas owner_group_members. */
async function deleteClientUsers(db, clientId) {
  const cid = String(clientId || "").trim();
  if (!cid) return;
  try {
    await deleteOwnerGroupMembersForClientUsersViaPg(cid);
  } catch (err) {
    console.warn("[deleteClientUsers] pg owner_group_members:", err.message || err);
  }
  await deleteOwnerGroupMembersForClientUsers(db, cid);
  const { error: usersErr } = await db.from("users").delete().eq("client_id", cid);
  if (usersErr && !isMissingRelation(usersErr)) throw usersErr;
}

module.exports = {
  CLIENT_DELETE_TARGETS,
  LICENSE_CHILD_TABLES,
  isMissingRelation,
  isMissingPgRelation,
  purgeLicenseDependencies,
  deleteLicenseTerminalsRest,
  deleteSingleLicense,
  purgeClientBeforeDelete,
  deleteLicensesForClient,
  deleteClientDependentRows,
  deleteOwnerGroupMembersForClientUsers,
  deleteClientUsers,
};
