-- Quotes now take client details as free text directly on the quote
-- instead of requiring a Client picked from a separate list.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientNip" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientAddress" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "clientPhone" TEXT;

-- Backfill existing quotes from their previously linked Client, if any.
-- Guarded so this stays safely re-runnable even after "clientId" is gone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Quote' AND column_name = 'clientId'
  ) THEN
    UPDATE "Quote" q SET
      "clientName" = c."name",
      "clientNip" = c."nip",
      "clientAddress" = c."address",
      "clientEmail" = c."email",
      "clientPhone" = c."phone"
    FROM "Client" c
    WHERE q."clientId" = c."id" AND q."clientName" IS NULL;
  END IF;
END $$;

ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_clientId_fkey";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "clientId";
