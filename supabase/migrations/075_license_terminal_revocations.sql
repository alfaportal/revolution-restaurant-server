-- Pajisje të hequra nga admini — mos ri-regjistrohen me heartbeat; vetëm pairing i ri.

CREATE TABLE IF NOT EXISTS license_terminal_revocations (
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id  TEXT NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (license_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_license_terminal_revocations_license
  ON license_terminal_revocations (license_id);

COMMENT ON TABLE license_terminal_revocations IS
  'Admin Hiq — device_id i bllokuar derisa pairing me kod të ri.';
