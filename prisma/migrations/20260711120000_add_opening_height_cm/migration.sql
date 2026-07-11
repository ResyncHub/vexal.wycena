-- AlterTable
-- Backfill existing openings with a placeholder height (200 cm) so the
-- column can be NOT NULL; users edit it per opening afterwards.
ALTER TABLE "QuoteOpening" ADD COLUMN "heightCm" DECIMAL(6,1) NOT NULL DEFAULT 200;
ALTER TABLE "QuoteOpening" ALTER COLUMN "heightCm" DROP DEFAULT;
