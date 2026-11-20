ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_pin TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_pin_enc TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_saved_token TEXT;
