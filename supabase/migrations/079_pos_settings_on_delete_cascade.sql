-- Super Admin: fshi klientin → fshihet pos_settings (prod pa CASCADE).
ALTER TABLE pos_settings DROP CONSTRAINT IF EXISTS pos_settings_client_id_fkey;

ALTER TABLE pos_settings
  ADD CONSTRAINT pos_settings_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
