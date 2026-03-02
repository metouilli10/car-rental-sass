import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security/audit-log";
import { toManagedUser } from "@/lib/users/serializers";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type UpdateRolePayload = {
  role?: UserRole;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUserOrThrow();
    requireRole(currentUser.role, ["OWNER"]);

    if (!canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateRolePayload;
    const role = body.role;

    if (!role || !["MANAGER", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    const target = await prisma.user.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true },
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
          action: "USER_ROLE_UPDATE",
          entityType: "USER",
          entityId: id,
          outcome: "DENIED",
          details: { reason: "target_not_found" },
        },
      });
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    await prisma.user.updateMany({
      where: { id, agencyId: currentUser.agencyId },
      data: { role },
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
        action: "USER_ROLE_UPDATE",
        entityType: "USER",
        entityId: id,
        outcome: "SUCCESS",
        details: { newRole: role },
      },
    });

    return NextResponse.json({ user: toManagedUser(updatedUser) });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH /api/users/[id]/role error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
