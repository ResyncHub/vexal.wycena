-- AlterTable: add as nullable first, backfill existing rows, then enforce NOT NULL.
-- (Existing QuoteModule rows predate the "actual built dimension" concept -
-- backfilling with the requested widthCm/heightCm is a safe approximation
-- for old data; new rows always get the real computed value from the app.)
ALTER TABLE "QuoteModule" ADD COLUMN     "actualHeightCm" DECIMAL(6,1),
ADD COLUMN     "actualWidthCm" DECIMAL(6,1);

UPDATE "QuoteModule" SET "actualWidthCm" = "widthCm", "actualHeightCm" = "heightCm"
WHERE "actualWidthCm" IS NULL;

ALTER TABLE "QuoteModule" ALTER COLUMN "actualHeightCm" SET NOT NULL,
ALTER COLUMN "actualWidthCm" SET NOT NULL;
