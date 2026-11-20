CREATE TABLE IF NOT EXISTS public.owner_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('login', 'activate')),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_login_codes_user
  ON public.owner_login_codes (user_id, purpose, created_at DESC);

ALTER TABLE public.owner_login_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_login_codes FROM anon, authenticated;

DROP POLICY IF EXISTS owner_login_codes_deny ON public.owner_login_codes;
CREATE POLICY owner_login_codes_deny ON public.owner_login_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
