ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS staff_local_links JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN pos_settings.staff_local_links IS
  'Linke LAN kamarier — sync nga KAFENE desktop (Sinkronizo gjithçka)';
