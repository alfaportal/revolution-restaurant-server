-- Rruga banak/kuzhinë nga POS (KAFENE categories.route) — KDS e njëjta si printimi lokal
ALTER TABLE pos_categories
  ADD COLUMN IF NOT EXISTS route TEXT NOT NULL DEFAULT 'bar';

COMMENT ON COLUMN pos_categories.route IS 'bar | kitchen — Pije (banak) / Ushqim (kuzhinë) nga POS';
