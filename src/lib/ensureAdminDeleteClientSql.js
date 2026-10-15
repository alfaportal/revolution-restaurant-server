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

async function ensureAdminDeleteClientSql() {
  const pool = getPgPool();
  if (!pool) return false;
  await pool.query(FN_SQL);
  return true;
}

module.exports = { ensureAdminDeleteClientSql };
