-- Pairing terminali të ri (arka 1, 2, 3…) — kodi vlen deri sa skadon licenca (KAFENE / POS)

CREATE TABLE IF NOT EXISTS terminal_pair_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  terminal_role TEXT NOT NULL DEFAULT 'arka1',
  used_by_device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  used_at TIMESTAMPTZ,
  CONSTRAINT terminal_pair_codes_role_check
    CHECK (terminal_role ~ '^arka[1-9][0-9]*$')
);

CREATE INDEX IF NOT EXISTS idx_terminal_pair_codes_license
  ON terminal_pair_codes (license_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_terminal_pair_codes_unused
  ON terminal_pair_codes (code)
  WHERE used_at IS NULL;

COMMENT ON TABLE terminal_pair_codes IS
  'Kod pairing KAF-XXXX — vlen deri expires_at (= skadimi i licencës); përdoret 1×.';

ALTER TABLE license_terminals
  ADD COLUMN IF NOT EXISTS terminal_role TEXT NOT NULL DEFAULT 'arka1';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_terminals_role_check'
  ) THEN
    ALTER TABLE license_terminals
      ADD CONSTRAINT license_terminals_role_check
      CHECK (terminal_role ~ '^arka[1-9][0-9]*$');
  END IF;
END $$;

COMMENT ON COLUMN license_terminals.terminal_role IS
  'Arka e terminalit pas pairing (arka1, arka2, …).';
