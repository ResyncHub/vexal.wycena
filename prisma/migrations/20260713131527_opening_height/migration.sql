-- AlterTable: add opening height (real physical opening, both dimensions).
-- Idempotent / safely re-runnable, same reasoning as the previous migration:
-- add nullable, backfill existing rows, then enforce NOT NULL.
ALTER TABLE "QuoteOpening" ADD COLUMN IF NOT EXISTS "heightCm" DECIMAL(6,1);

-- Existing rows predate this field - backfill with the tallest module already
-- in that opening (a reasonable guess), or a generic placeholder if none.
UPDATE "QuoteOpening" o SET "heightCm" = COALESCE(
  (SELECT MAX(m."heightCm") FROM "QuoteModule" m WHERE m."openingId" = o.id),
  200
)
WHERE o."heightCm" IS NULL;

ALTER TABLE "QuoteOpening" ALTER COLUMN "heightCm" SET NOT NULL;
