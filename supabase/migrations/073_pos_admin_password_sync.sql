-- POS desktop (KAFENE/Hotel) admin_password SHA-256 — sinkron me llogarinë e pronarit në cloud.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS pos_admin_password_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS pos_admin_password_set_at TIMESTAMPTZ;

COMMENT ON COLUMN public.clients.pos_admin_password_sha256 IS
  'SHA-256 hex i fjalëkalimit admin POS — i njëjti algoritëm si SQLite settings.admin_password lokale.';
COMMENT ON COLUMN public.clients.pos_admin_password_set_at IS
  'Kur u vendos/ndryshua fjalëkalimi i sinkronizuar POS (cloud ose push nga desktop).';
