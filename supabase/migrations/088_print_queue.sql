CREATE TABLE IF NOT EXISTS public.print_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  receipt_data  TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'printed', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT '2000-01-01T00:00:00Z'
);

CREATE INDEX IF NOT EXISTS idx_print_queue_poll
  ON public.print_queue (business_id, device_id, status, created_at);

ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.print_queue FROM anon, authenticated;
