import type { Prisma, UserRole } from "@prisma/client";
import type { ManagedUser, UserActivityItem } from "@/components/users/types";
import {
  getEffectivePermissions,
  normalizeUserPermissions,
} from "@/lib/permissions";

type UserLike = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  invitedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  permissionOverrides?: Prisma.JsonValue | null;
};

type AuditLike = {
  id: bigint;
  occurredAt: Date;
  action: string;
  outcome: string;
  actorUserId: string | null;
  actorRole: string;
  actorEmail: string | null;
  entityType: string;
  entityId: string;
  details: Prisma.JsonValue | null;
};

export function toManagedUser(user: UserLike): ManagedUser {
  const storedPermissions = normalizeUserPermissions(user.permissionOverrides ?? null);
  const effectivePermissions = getEffectivePermissions(user.role, storedPermissions);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    invitedAt: user.invitedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    permissions: storedPermissions ?? effectivePermissions,
    effectivePermissions,
  };
}

export function toUserActivityItem(item: AuditLike): UserActivityItem {
  return {
    id: item.id.toString(),
    occurredAt: item.occurredAt.toISOString(),
    action: item.action,
    outcome: item.outcome as UserActivityItem["outcome"],
    actor: {
      userId: item.actorUserId,
      email: item.actorEmail,
      role: item.actorRole,
    },
    target: {
      entityType: item.entityType,
      entityId: item.entityId,
    },
    details:
      item.details && typeof item.details === "object" && !Array.isArray(item.details)
        ? (item.details as Record<string, unknown>)
        : null,
  };
}
