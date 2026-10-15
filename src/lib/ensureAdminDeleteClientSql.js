"use strict";

const { getPgPool } = require("./pgPool");

const FN_SQL = `
CREATE OR REPLACE FUNCTION public.admin_purge_client_licenses(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  DELETE FROM license_terminals
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM license_email_notifications
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM trial_notifications
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM license_hardware_controls
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM license_terminal_revocations
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM terminal_pair_codes
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM terminal_relay_messages
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM terminal_relay_presence
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM terminal_relay_snapshots
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM license_remote_audit
  WHERE license_id IN (SELECT id FROM licenses WHERE client_id = p_client_id);
  DELETE FROM licenses WHERE client_id = p_client_id;
END;
$fn$;
`;

const GRANT_SQL = `
GRANT EXECUTE ON FUNCTION public.admin_purge_client_licenses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_purge_client_licenses(uuid) TO authenticated;
`;

async function ensureLicenseTerminalsCascade() {
  const pool = getPgPool();
  if (!pool) return false;
  await pool.query(`
    ALTER TABLE license_terminals DROP CONSTRAINT IF EXISTS license_terminals_license_id_fkey;
  `);
  await pool.query(`
    ALTER TABLE license_terminals
      ADD CONSTRAINT license_terminals_license_id_fkey
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE;
  `);
  return true;
}

async function ensureAdminDeleteClientSql() {
  const pool = getPgPool();
  if (!pool) return false;
  await ensureLicenseTerminalsCascade();
  await pool.query(FN_SQL);
  try {
    await pool.query(GRANT_SQL);
  } catch {
    /* grant opsional */
  }
  return true;
}

module.exports = { ensureAdminDeleteClientSql, ensureLicenseTerminalsCascade };
