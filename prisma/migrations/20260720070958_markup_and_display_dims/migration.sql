-- Per-quote markup (independent from the global CompanySettings default),
-- and purely cosmetic per-module display dimension overrides.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "markupPercent" DECIMAL(6,2) NOT NULL DEFAULT 0;
ALTER TABLE "QuoteModule" ADD COLUMN IF NOT EXISTS "displayWidthCm" DECIMAL(6,1);
ALTER TABLE "QuoteModule" ADD COLUMN IF NOT EXISTS "displayHeightCm" DECIMAL(6,1);

-- Existing quotes were priced using the global default markup - seed their
-- new per-quote value from it so stored totals stay consistent, instead of
-- silently dropping to 0%.
UPDATE "Quote" q SET "markupPercent" = COALESCE(
  (SELECT "defaultMarkupPercent" FROM "CompanySettings" WHERE id = 'singleton'),
  0
)
WHERE q."markupPercent" = 0;
