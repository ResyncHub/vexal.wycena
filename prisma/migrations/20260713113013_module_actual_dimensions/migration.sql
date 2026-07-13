-- AlterTable: add as nullable first, backfill existing rows, then enforce NOT NULL.
-- (Existing QuoteModule rows predate the "actual built dimension" concept -
-- backfilling with the requested widthCm/heightCm is a safe approximation
-- for old data; new rows always get the real computed value from the app.)
--
-- Written to be safely re-runnable: an earlier attempt can be interrupted
-- partway through (e.g. a dropped connection), so every statement here is
-- idempotent and converges to the same end state no matter where a prior
-- attempt stopped.
ALTER TABLE "QuoteModule" ADD COLUMN IF NOT EXISTS "actualHeightCm" DECIMAL(6,1);
ALTER TABLE "QuoteModule" ADD COLUMN IF NOT EXISTS "actualWidthCm" DECIMAL(6,1);

UPDATE "QuoteModule" SET "actualWidthCm" = "widthCm" WHERE "actualWidthCm" IS NULL;
UPDATE "QuoteModule" SET "actualHeightCm" = "heightCm" WHERE "actualHeightCm" IS NULL;

ALTER TABLE "QuoteModule" ALTER COLUMN "actualHeightCm" SET NOT NULL;
ALTER TABLE "QuoteModule" ALTER COLUMN "actualWidthCm" SET NOT NULL;
