DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StorefrontDomainStatus') THEN
    CREATE TYPE "StorefrontDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'ERROR');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "storefront_domains" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "status" "StorefrontDomainStatus" NOT NULL DEFAULT 'PENDING',
  "verificationRecords" JSONB,
  "verifiedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "verificationError" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "storefront_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "storefront_domains_agencyId_key" ON "storefront_domains"("agencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "storefront_domains_hostname_key" ON "storefront_domains"("hostname");
CREATE INDEX IF NOT EXISTS "storefront_domains_status_idx" ON "storefront_domains"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storefront_domains_agencyId_fkey'
  ) THEN
    ALTER TABLE "storefront_domains"
    ADD CONSTRAINT "storefront_domains_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
