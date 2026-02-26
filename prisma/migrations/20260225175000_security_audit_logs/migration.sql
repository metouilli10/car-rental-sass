-- CreateTable
CREATE TABLE "security_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agency_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_role" TEXT NOT NULL,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "details" JSONB,
    "request_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_audit_logs_agency_id_occurred_at_idx" ON "security_audit_logs"("agency_id", "occurred_at");

-- CreateIndex
CREATE INDEX "security_audit_logs_action_occurred_at_idx" ON "security_audit_logs"("action", "occurred_at");

-- CreateIndex
CREATE INDEX "security_audit_logs_entity_type_entity_id_occurred_at_idx" ON "security_audit_logs"("entity_type", "entity_id", "occurred_at");
