-- Super Admin: fshi licencën → fshihen automatikisht arkat (prod pa CASCADE).
ALTER TABLE license_terminals DROP CONSTRAINT IF EXISTS license_terminals_license_id_fkey;

ALTER TABLE license_terminals
  ADD CONSTRAINT license_terminals_license_id_fkey
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE;
