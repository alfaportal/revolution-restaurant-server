-- Super Admin: fshi një licencë (+ arkat) — «Fshi licencën» pa FK license_terminals.
CREATE OR REPLACE FUNCTION public.admin_purge_single_license(p_license_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  DELETE FROM license_terminals WHERE license_id = p_license_id;
  DELETE FROM license_email_notifications WHERE license_id = p_license_id;
  DELETE FROM trial_notifications WHERE license_id = p_license_id;
  DELETE FROM license_hardware_controls WHERE license_id = p_license_id;
  DELETE FROM license_terminal_revocations WHERE license_id = p_license_id;
  DELETE FROM terminal_pair_codes WHERE license_id = p_license_id;
  DELETE FROM terminal_relay_messages WHERE license_id = p_license_id;
  DELETE FROM terminal_relay_presence WHERE license_id = p_license_id;
  DELETE FROM terminal_relay_snapshots WHERE license_id = p_license_id;
  DELETE FROM terminal_relay_queue WHERE license_id = p_license_id;
  DELETE FROM license_remote_audit WHERE license_id = p_license_id;
  DELETE FROM licenses WHERE id = p_license_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.admin_purge_single_license(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_purge_single_license(uuid) TO authenticated;
