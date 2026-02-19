import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type UpdateRolePayload = {
  role?: UserRole;
};

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  invitedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    invitedAt: user.invitedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

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
      },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user: toUserResponse(updatedUser) });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH /api/users/[id]/role error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
