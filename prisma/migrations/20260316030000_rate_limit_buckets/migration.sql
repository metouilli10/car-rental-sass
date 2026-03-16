CREATE TABLE "rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rate_limit_buckets_scope_key_key" ON "rate_limit_buckets"("scope", "key");
CREATE INDEX "rate_limit_buckets_scope_windowStartAt_idx" ON "rate_limit_buckets"("scope", "windowStartAt");
CREATE INDEX "rate_limit_buckets_lockedUntil_idx" ON "rate_limit_buckets"("lockedUntil");
