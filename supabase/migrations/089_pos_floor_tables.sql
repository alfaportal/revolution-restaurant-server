CREATE TABLE IF NOT EXISTS pos_floor_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_sort INTEGER NOT NULL DEFAULT 0,
  layout_rows INTEGER NOT NULL DEFAULT 0,
  table_number INTEGER NOT NULL,
  layout_x DOUBLE PRECISION NOT NULL DEFAULT -1,
  layout_y DOUBLE PRECISION NOT NULL DEFAULT -1,
  layout_col INTEGER NOT NULL DEFAULT -1,
  layout_row INTEGER NOT NULL DEFAULT -1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (client_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_pos_floor_tables_client
  ON pos_floor_tables (client_id, zone_sort, sort_order);

ALTER TABLE pos_floor_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_floor_tables_no_public ON pos_floor_tables;
CREATE POLICY pos_floor_tables_no_public ON pos_floor_tables
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
