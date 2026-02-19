DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpenseCategory') THEN
    CREATE TYPE "ExpenseCategory" AS ENUM (
      'MAINTENANCE',
      'CARBURANT',
      'NETTOYAGE',
      'ASSURANCE',
      'TAXES',
      'SALAIRES',
      'LOYER',
      'MARKETING',
      'AUTRE'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentType" NOT NULL,
  "vehicleId" TEXT,
  "note" TEXT,
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_agencyId_fkey'
  ) THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_vehicleId_fkey'
  ) THEN
    ALTER TABLE "expenses"
      ADD CONSTRAINT "expenses_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "expenses_agencyId_date_idx" ON "expenses"("agencyId", "date");
CREATE INDEX IF NOT EXISTS "expenses_agencyId_category_idx" ON "expenses"("agencyId", "category");
CREATE INDEX IF NOT EXISTS "expenses_agencyId_vehicleId_idx" ON "expenses"("agencyId", "vehicleId");
