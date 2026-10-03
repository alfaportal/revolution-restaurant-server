-- Lidhja Kryesore ↔ Arka 2+ përmes cloud-it kur rrjeti lokal nuk i lidh PC-të (izolim Wi-Fi, VLAN, kabllo e prerë).
-- Përmbajtja (shitje, ndërrime, staf me PIN, menu, stok) vjen e koduar AES-256-GCM nga POS — cloud ruan vetëm tekst të koduar.

CREATE TABLE IF NOT EXISTS terminal_relay_messages (
  id              BIGSERIAL PRIMARY KEY,
  license_id      UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  from_device_id  TEXT NOT NULL,
  register_number INT  NOT NULL CHECK (register_number >= 2),
  payload         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  acked_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_terminal_relay_messages_pending
  ON terminal_relay_messages (license_id, id)
  WHERE acked_at IS NULL;

COMMENT ON TABLE terminal_relay_messages IS
  'Arka 2+ → Kryesore: shitje/ndërrime kur LAN mungon. Kryesorja i importon (dedup sipas PC + ref) dhe vendos acked_at.';

CREATE TABLE IF NOT EXISTS terminal_relay_presence (
  license_id      UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id       TEXT NOT NULL,
  register_number INT  NOT NULL,
  payload         TEXT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (license_id, device_id)
);

COMMENT ON TABLE terminal_relay_presence IS
  'Gjendja e fundit e çdo Arke 2+ (radha, versioni, sinkronizimi) — një rresht për PC.';

CREATE TABLE IF NOT EXISTS terminal_relay_snapshots (
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('staff', 'menu', 'stock', 'master')),
  hash       TEXT NOT NULL,
  payload    TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (license_id, kind)
);

COMMENT ON TABLE terminal_relay_snapshots IS
  'Kryesore → Arka 2+: stafi, menuja, stoku dhe adresat LAN të Kryesores (vetëm Kryesorja shkruan).';

ALTER TABLE terminal_relay_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_relay_presence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_relay_snapshots ENABLE ROW LEVEL SECURITY;
