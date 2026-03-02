import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security/audit-log";
import {
  normalizePermissionOverrides,
  sanitizePermissionOverridePatch,
  type PermissionKey,
} from "@/lib/permissions";
import { toManagedUser } from "@/lib/users/serializers";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type UpdateUserPermissionsPayload = {
  overrides?: Record<string, boolean | null>;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUserOrThrow();
    requireRole(currentUser.role, ["OWNER"]);

    if (!canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as UpdateUserPermissionsPayload;
    const rawOverrides = body.overrides;

    if (!rawOverrides || typeof rawOverrides !== "object" || Array.isArray(rawOverrides)) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const { normalized, changedKeys, invalidKeys } = sanitizePermissionOverridePatch(rawOverrides);

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Permissions invalides: ${invalidKeys.join(", ")}` },
        { status: 400 },
      );
    }

    const target = await prisma.user.findFirst({
      where: {
        id,
        agencyId: currentUser.agencyId,
      },
      select: {
        id: true,
        role: true,
        permissionOverrides: true,
      },
    });

    if (!target) {
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "USER_PERMISSIONS_UPDATE",
          entityType: "USER",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "target_not_found" },
        },
      });

      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (target.role === "OWNER") {
      await logSecurityAudit({
        actor: {
          userId: currentUser.id,
          role: currentUser.role,
          email: currentUser.email,
        },
        context: {
          agencyId: currentUser.agencyId,
          requestId: request.headers.get("x-request-id"),
          ip: request.headers.get("x-forwarded-for"),
          userAgent: request.headers.get("user-agent"),
        },
        event: {
          action: "USER_PERMISSIONS_UPDATE",
          entityType: "USER",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "owner_target_blocked" },
        },
      });

      return NextResponse.json(
        { error: "Les permissions du proprietaire ne sont pas modifiables" },
        { status: 400 },
      );
    }

    const previousOverrides = normalizePermissionOverrides(target.permissionOverrides ?? null);
    const appliedChangedKeys = changedKeys.filter((key) => {
      const permissionKey = key as PermissionKey;
      const previousValue =
        previousOverrides && Object.prototype.hasOwnProperty.call(previousOverrides, key)
          ? previousOverrides[permissionKey]
          : null;
      const nextValue =
        normalized && Object.prototype.hasOwnProperty.call(normalized, key)
          ? normalized[permissionKey]
          : null;
      return previousValue !== nextValue;
    });

    await prisma.user.update({
      where: { id },
      data: {
        permissionOverrides: normalized ?? Prisma.DbNull,
      },
    });

    const updatedUser = await prisma.user.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        invitedAt: true,
        lastLoginAt: true,
        createdAt: true,
        permissionOverrides: true,
      },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    await logSecurityAudit({
      actor: {
        userId: currentUser.id,
        role: currentUser.role,
        email: currentUser.email,
      },
      context: {
        agencyId: currentUser.agencyId,
        requestId: request.headers.get("x-request-id"),
        ip: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      },
      event: {
        action: "USER_PERMISSIONS_UPDATE",
        entityType: "USER",
        entityId: id,
        outcome: "SUCCESS",
        details: {
          changedKeys: appliedChangedKeys,
          overrideCount: normalized ? Object.keys(normalized).length : 0,
        },
      },
    });

    return NextResponse.json({ user: toManagedUser(updatedUser) });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("PATCH /api/users/[id]/permissions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
