CREATE TABLE IF NOT EXISTS public.fiscal_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  device_id             TEXT NOT NULL,
  last_invoice_number   INTEGER NOT NULL DEFAULT 0,
  last_invoice_hash     TEXT NOT NULL DEFAULT '',
  certificate_pem       TEXT NOT NULL DEFAULT '',
  private_key_enc       TEXT NOT NULL DEFAULT '',
  atk_tin               TEXT NOT NULL DEFAULT '',
  atk_bus_unit          TEXT NOT NULL DEFAULT '',
  atk_pos_id            TEXT NOT NULL DEFAULT '',
  atk_application_id    TEXT NOT NULL DEFAULT '',
  atk_api_url           TEXT NOT NULL DEFAULT '',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.fiscal_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  sale_id       UUID,
  nuikf         TEXT NOT NULL DEFAULT '',
  coupon_number INTEGER NOT NULL DEFAULT 0,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed')),
  last_error    TEXT NOT NULL DEFAULT '',
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_queue_sale
  ON public.fiscal_queue (business_id, sale_id, status);

ALTER TABLE public.fiscal_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.fiscal_state FROM anon, authenticated;
REVOKE ALL ON public.fiscal_queue FROM anon, authenticated;
