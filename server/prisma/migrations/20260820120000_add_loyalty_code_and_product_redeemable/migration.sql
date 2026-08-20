-- AlterTable
ALTER TABLE "products" ADD COLUMN     "redeemable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "loyaltyCode" TEXT;

-- Backfill existing users with a unique random 6-digit code before the
-- column is made required, since the table already has rows.
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM "users" WHERE "loyaltyCode" IS NULL LOOP
    LOOP
      new_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "users" WHERE "loyaltyCode" = new_code);
    END LOOP;
    UPDATE "users" SET "loyaltyCode" = new_code WHERE id = r.id;
  END LOOP;
END $$;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "loyaltyCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_loyaltyCode_key" ON "users"("loyaltyCode");
