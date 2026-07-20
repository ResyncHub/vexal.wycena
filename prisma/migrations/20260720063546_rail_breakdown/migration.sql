-- AlterTable: nullable column, safe to add regardless of existing rows.
ALTER TABLE "QuoteOpening" ADD COLUMN IF NOT EXISTS "railBreakdownJson" JSONB;
