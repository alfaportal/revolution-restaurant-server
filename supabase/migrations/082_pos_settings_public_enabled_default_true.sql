ALTER TABLE public.pos_settings
  ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.pos_settings
  ALTER COLUMN public_enabled SET DEFAULT true;
