import { prisma } from "@/lib/prisma";

type AuditActor = {
  userId: string;
  role: string;
  email?: string;
};

type AuditContext = {
  agencyId: string;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

type AuditEvent = {
  action: string;
  entityType: string;
  entityId: string;
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  details?: Record<string, unknown>;
};

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

function normalizeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function logSecurityAudit(params: {
  actor: AuditActor;
  context: AuditContext;
  event: AuditEvent;
}): Promise<void> {
  const { actor, context, event } = params;

  const payload = {
    ts: nowIso(),
    agencyId: context.agencyId,
    action: event.action,
    outcome: event.outcome,
    actor: {
      userId: actor.userId,
      role: actor.role,
      email: actor.email ?? null,
    },
    target: {
      entityType: event.entityType,
      entityId: event.entityId,
    },
    request: {
      requestId: context.requestId ?? null,
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    },
    details: event.details ?? {},
  };

  // Always keep structured logs for incident investigations.
  console.info("[security_audit]", normalizeJson(payload));

  // Optional DB sink (feature-flagged). Safe no-op if table is absent.
  if (!envFlag("FEATURE_AUDIT_DB_LOG")) {
    return;
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO security_audit_logs
        (occurred_at, agency_id, actor_user_id, actor_role, actor_email, action, entity_type, entity_id, outcome, details, request_id, ip, user_agent)
      VALUES
        (NOW(), ${context.agencyId}, ${actor.userId}, ${actor.role}, ${actor.email ?? null}, ${event.action}, ${event.entityType}, ${event.entityId}, ${event.outcome}, ${normalizeJson(event.details ?? {})}::jsonb, ${context.requestId ?? null}, ${context.ip ?? null}, ${context.userAgent ?? null})
    `;
  } catch (error) {
    console.warn("security_audit db sink failed:", error);
  }
}
