-- =============================================================================
-- MIGRATE_OLD_TO_MATCH_NEW.sql
-- =============================================================================
-- ÇFARË BËN:
--   E bën skemën e Supabase të VJETËR (OLD) njësoj si të RE (NEW):
--   a) krijon 3 tabelat që janë vetëm te NEW
--   b) shton kolonat që janë te NEW por mungojnë te OLD (49 tabela të përbashkëta)
--   c) riemëron kolonat ku OLD ka emër tjetër për të njëjtën gjë
--   d) ALTER COLUMN: default / NULL / NOT NULL ku NEW ndryshon nga OLD
--   në fund: funksionet, trigger-at dhe RLS nga migrimet ekzistuese
--
-- KU TË XHIROHET:
--   Vetëm në SQL Editor të Supabase të VJETËR (OLD).
--   MOS e xhiro te NEW. MOS e xhiro automatikisht nga kodi.
--
-- I SIGURT PËR RIXHIRIM:
--   CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
--   RENAME vetëm nëse kolona e vjetër ekziston dhe e reja ende jo,
--   ALTER COLUMN SET/DROP DEFAULT dhe SET/DROP NOT NULL (idempotent),
--   CREATE OR REPLACE për funksionet.
--
-- NUK FSHIN asnjë kolonë të OLD që NEW nuk e ka.
-- UPDATE vetëm për NULL/bosh që SET NOT NULL të kalojë; rreshtat me vlerë nuk ndryshohen.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- a) 3 TABELA VETËM TE NEW
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_sequence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  next_number INTEGER NOT NULL DEFAULT 1,
  prefix      TEXT NOT NULL DEFAULT 'INV-'
);

ALTER TABLE public.invoice_sequence ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pos_owner_daily_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  summary_date  DATE NOT NULL,
  summary_json  JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_owner_daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.terminal_relay_queue (
  id          BIGSERIAL PRIMARY KEY,
  license_id  UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL DEFAULT 'order',
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.terminal_relay_queue ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- b) ADD COLUMN — 49 tabela të përbashkëta (NEW ka, OLD nuk ka)
--    Kolonat që vijnë nga RENAME (seksioni c) NUK shtohen këtu.
-- =============================================================================

-- admin_activity_log: asnjë kolonë e re
-- ai_chat_history: asnjë kolonë e re
-- ai_daily_reports: asnjë kolonë e re
-- ai_usage_logs: asnjë kolonë e re

ALTER TABLE public.ai_waiter_ratings
  ADD COLUMN IF NOT EXISTS waiter_id UUID,
  ADD COLUMN IF NOT EXISTS waiter_name TEXT NOT NULL DEFAULT '';

-- ai_weekly_reports: asnjë kolonë e re
-- clients: asnjë kolonë e re

ALTER TABLE public.daily_report_notifications
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.daily_z_reports
  ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS z_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS total_gross NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_net NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_vat NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_total NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_total NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'Z',
  ADD COLUMN IF NOT EXISTS turnover_gross NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_cash NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_card NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_room NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shift_id TEXT,
  ADD COLUMN IF NOT EXISTS waiter_name TEXT;

-- fiscal_receipts: asnjë kolonë e re

ALTER TABLE public.ingredient_alert_notifications
  ADD COLUMN IF NOT EXISTS ingredient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_quantity NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_quantity NUMERIC NOT NULL DEFAULT 0;
-- sent_at: VETËM rename notified_at (seksioni c), jo ADD COLUMN

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS last_restock_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- license_email_notifications: asnjë kolonë e re
-- license_hardware_controls: asnjë kolonë e re
-- license_remote_audit: asnjë kolonë e re
-- license_security_events: asnjë kolonë e re
-- license_stripe_payments: asnjë kolonë e re
-- license_terminal_revocations: asnjë kolonë e re
-- license_terminals: asnjë kolonë e re
-- licenses: asnjë kolonë e re
-- menu_ingredients: quantity_per_sale vjen nga RENAME (c)

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_report_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_report_time TEXT NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS daily_report_last_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_alert_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_alert_interval_hours INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS stock_alert_last_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- offline_notifications: asnjë kolonë e re
-- order_refusal_events: asnjë kolonë e re
-- owner_activity_log: asnjë kolonë e re
-- owner_expenses: asnjë kolonë e re
-- owner_group_members: asnjë kolonë e re
-- owner_groups: asnjë kolonë e re
-- owner_login_failures: asnjë kolonë e re
-- owner_password_resets: asnjë kolonë e re

ALTER TABLE public.pos_areas
  ADD COLUMN IF NOT EXISTS table_start INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS table_end INTEGER NOT NULL DEFAULT 10;

-- pos_categories: asnjë kolonë e re
-- pos_menu_items: asnjë kolonë e re
-- pos_pending_purchases: asnjë kolonë e re
-- pos_settings: asnjë kolonë e re
-- pos_staff: asnjë kolonë e re
-- pos_waiter_tables: asnjë kolonë e re

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guest_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1;

-- sales_orders: asnjë kolonë e re

ALTER TABLE public.stock_alert_notifications
  ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_stock INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alert_threshold INTEGER NOT NULL DEFAULT 5;
-- sent_at: VETËM rename notified_at (seksioni c), jo ADD COLUMN

-- super_admin_invoices: asnjë kolonë e re
-- super_admin_settings: asnjë kolonë e re
-- supply_suggestions: asnjë kolonë e re
-- terminal_pair_codes: asnjë kolonë e re
-- terminal_relay_messages: asnjë kolonë e re
-- terminal_relay_presence: asnjë kolonë e re
-- terminal_relay_snapshots: asnjë kolonë e re

ALTER TABLE public.trial_notifications
  ADD COLUMN IF NOT EXISTS milestone TEXT NOT NULL DEFAULT '';

-- users: asnjë kolonë e re

-- =============================================================================
-- c) RENAME — OLD emër → NEW emër (vetëm nëse e vjetra ekziston dhe e reja jo)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'menu_ingredients' AND column_name = 'quantity_used'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'menu_ingredients' AND column_name = 'quantity_per_sale'
  ) THEN
    ALTER TABLE public.menu_ingredients RENAME COLUMN quantity_used TO quantity_per_sale;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'last_supplier'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE public.ingredients RENAME COLUMN last_supplier TO supplier;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'last_supplier_email'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'supplier_email'
  ) THEN
    ALTER TABLE public.ingredients RENAME COLUMN last_supplier_email TO supplier_email;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'supplier'
  ) THEN
    ALTER TABLE public.ingredients ALTER COLUMN supplier SET DEFAULT '';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'supplier_email'
  ) THEN
    ALTER TABLE public.ingredients ALTER COLUMN supplier_email SET DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_waiter_ratings' AND column_name = 'ratings_json'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_waiter_ratings' AND column_name = 'metrics_json'
  ) THEN
    ALTER TABLE public.ai_waiter_ratings RENAME COLUMN ratings_json TO metrics_json;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_waiter_ratings' AND column_name = 'analysis_text'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_waiter_ratings' AND column_name = 'summary'
  ) THEN
    ALTER TABLE public.ai_waiter_ratings RENAME COLUMN analysis_text TO summary;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_alert_notifications' AND column_name = 'notified_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_alert_notifications' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.stock_alert_notifications RENAME COLUMN notified_at TO sent_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredient_alert_notifications' AND column_name = 'notified_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredient_alert_notifications' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.ingredient_alert_notifications RENAME COLUMN notified_at TO sent_at;
  END IF;
END $$;

-- =============================================================================
-- d) ALTER COLUMN — default / NULL / NOT NULL (si te NEW)
-- =============================================================================

UPDATE public.ai_usage_logs SET feature = COALESCE(feature, '') WHERE feature IS NULL;
ALTER TABLE public.ai_usage_logs ALTER COLUMN feature SET DEFAULT '';
ALTER TABLE public.ai_usage_logs ALTER COLUMN feature SET NOT NULL;
UPDATE public.ai_usage_logs SET cost_eur = COALESCE(cost_eur, 0) WHERE cost_eur IS NULL;
ALTER TABLE public.ai_usage_logs ALTER COLUMN cost_eur SET DEFAULT 0;
ALTER TABLE public.ai_usage_logs ALTER COLUMN cost_eur SET NOT NULL;

ALTER TABLE public.clients ALTER COLUMN tipi SET DEFAULT 'kafene';
UPDATE public.clients SET aktiv = true WHERE aktiv IS NULL;
ALTER TABLE public.clients ALTER COLUMN aktiv SET DEFAULT true;
ALTER TABLE public.clients ALTER COLUMN aktiv SET NOT NULL;

UPDATE public.licenses SET product_line = COALESCE(NULLIF(product_line, ''), 'kafene') WHERE product_line IS NULL OR product_line = '';
ALTER TABLE public.licenses ALTER COLUMN product_line SET DEFAULT 'kafene';
ALTER TABLE public.licenses ALTER COLUMN product_line SET NOT NULL;
ALTER TABLE public.licenses ALTER COLUMN activation_email DROP NOT NULL;
ALTER TABLE public.licenses ALTER COLUMN activation_email DROP DEFAULT;

DO $$
DECLARE
  bad_count int;
  col_type text;
BEGIN
  SELECT c.data_type INTO col_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'order_refusal_events'
    AND c.column_name = 'waiter_id';

  IF col_type IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.order_refusal_events ALTER COLUMN waiter_id DROP NOT NULL;
  ALTER TABLE public.order_refusal_events ALTER COLUMN waiter_id DROP DEFAULT;

  IF col_type IN ('text', 'character varying') THEN
    UPDATE public.order_refusal_events
      SET waiter_id = NULL
      WHERE waiter_id IS NOT NULL AND btrim(waiter_id) = '';
    SELECT COUNT(*) INTO bad_count
    FROM public.order_refusal_events
    WHERE waiter_id IS NOT NULL
      AND waiter_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    IF bad_count = 0 THEN
      ALTER TABLE public.order_refusal_events
        ALTER COLUMN waiter_id TYPE uuid USING waiter_id::uuid;
    ELSE
      RAISE NOTICE 'order_refusal_events.waiter_id: skip TEXT→UUID (% vlera jo-uuid)', bad_count;
    END IF;
  END IF;
END $$;

UPDATE public.order_refusal_events SET total = COALESCE(total, 0) WHERE total IS NULL;
ALTER TABLE public.order_refusal_events ALTER COLUMN total SET DEFAULT 0;
ALTER TABLE public.order_refusal_events ALTER COLUMN total SET NOT NULL;
UPDATE public.order_refusal_events SET device_id = COALESCE(device_id, '') WHERE device_id IS NULL;
ALTER TABLE public.order_refusal_events ALTER COLUMN device_id SET DEFAULT '';
ALTER TABLE public.order_refusal_events ALTER COLUMN device_id SET NOT NULL;

ALTER TABLE public.pos_settings ALTER COLUMN public_enabled SET DEFAULT true;
ALTER TABLE public.pos_settings ALTER COLUMN public_theme_color DROP NOT NULL;
ALTER TABLE public.pos_settings ALTER COLUMN public_theme_color SET DEFAULT '';

ALTER TABLE public.terminal_relay_presence ALTER COLUMN register_number SET DEFAULT 1;
ALTER TABLE public.terminal_relay_presence ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

ALTER TABLE public.terminal_relay_snapshots ALTER COLUMN kind SET DEFAULT 'tables';
ALTER TABLE public.terminal_relay_snapshots ALTER COLUMN hash SET DEFAULT '';
ALTER TABLE public.terminal_relay_snapshots ALTER COLUMN payload SET DEFAULT '{}'::jsonb;

-- =============================================================================
-- FUNKSIONET, TRIGGER-AT, RLS (nga schema.sql, 077, 080, 064)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_licenses_updated ON public.licenses;
CREATE TRIGGER trg_licenses_updated
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.set_licenses_updated_at();

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

GRANT EXECUTE ON FUNCTION public.admin_purge_client_licenses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_purge_client_licenses(uuid) TO authenticated;

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

-- 064: ENABLE RLS në të gjitha tabelat public + revoke anon/authenticated.
-- Nuk shtohet policy publike (deny by default për anon; service_role bypass).

DO $$
DECLARE
  r RECORD;
  enabled_count int := 0;
  skipped_count int := 0;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename, c.relrowsecurity AS already
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
    ORDER BY c.relname
  LOOP
    IF r.already THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'RLS already on: %', r.tablename;
    ELSE
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
      enabled_count := enabled_count + 1;
      RAISE NOTICE 'RLS ENABLED: %', r.tablename;
    END IF;
  END LOOP;
  RAISE NOTICE '── Done: enabled=% skipped(already)=%', enabled_count, skipped_count;
END $$;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
  EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
  RAISE NOTICE 'Revoked ALL privileges on public.* from anon + authenticated';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Role anon/authenticated mungon në këtë DB — skip revoke';
  WHEN OTHERS THEN
    RAISE WARNING 'Revoke partial failure: %', SQLERRM;
END $$;
