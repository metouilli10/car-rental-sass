import type { UserRole } from "@prisma/client";
import type { EffectivePermissions, UserPermissions } from "@/lib/permissions";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  invitedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: UserPermissions | null;
  effectivePermissions: EffectivePermissions;
};

export type UserActivityItem = {
  id: string;
  occurredAt: string;
  action: string;
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  actor: {
    userId: string | null;
    email: string | null;
    role: string | null;
  };
  target: {
    entityType: string;
    entityId: string;
  };
  details: Record<string, unknown> | null;
};

export type UserActivityResponse = {
  items: UserActivityItem[];
  nextCursor: string | null;
};
