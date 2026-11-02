-- ENABLE_RLS.sql
-- Project: KAFENE / POS (revolution-restaurant-server)
-- Supabase: https://jdlypmieskgrqsfyjrul.supabase.co (ref jdlypmieskgrqsfyjrul)
-- Safe to run twice. Do not run from CI automatically.
-- Node server uses service_role (bypasses RLS). This closes PostgREST for anon + authenticated.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

ALTER TABLE IF EXISTS public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_waiter_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_report_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_z_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fiscal_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingredient_alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_hardware_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_remote_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_terminal_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.license_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offline_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_refusal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_login_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_owner_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_pending_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pos_waiter_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_admin_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supply_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terminal_pair_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terminal_relay_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terminal_relay_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terminal_relay_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.terminal_relay_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trial_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
