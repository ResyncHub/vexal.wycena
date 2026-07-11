-- AlterTable
-- Backfill existing modules with widthCm/heightCm as a best-effort
-- placeholder for the real (lamela-stack-driven) dimension, since that is
-- what the app previously assumed was the true size.
ALTER TABLE "QuoteModule" ADD COLUMN "actualWidthCm" DECIMAL(6,1);
ALTER TABLE "QuoteModule" ADD COLUMN "actualHeightCm" DECIMAL(6,1);

UPDATE "QuoteModule" SET "actualWidthCm" = "widthCm", "actualHeightCm" = "heightCm";

ALTER TABLE "QuoteModule" ALTER COLUMN "actualWidthCm" SET NOT NULL;
ALTER TABLE "QuoteModule" ALTER COLUMN "actualHeightCm" SET NOT NULL;
