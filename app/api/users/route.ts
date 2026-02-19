import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type CreateUserPayload = {
  name?: string;
  email?: string;
  role?: UserRole;
  tempPassword?: string;
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

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserOrThrow();
    requireRole(currentUser.role, ["OWNER"]);

    if (!canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const body = (await request.json()) as CreateUserPayload;
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const role = body.role;
    const tempPassword = body.tempPassword?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    if (!role || !["MANAGER", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    if (!tempPassword || tempPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe temporaire doit contenir au moins 8 caractères" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, agencyId: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const hashedPassword = await hash(tempPassword, 10);

    const createdUser = await prisma.user.create({
      data: {
        name: name && name.length > 0 ? name : email,
        email,
        role,
        password: hashedPassword,
        agencyId: currentUser.agencyId,
        isActive: true,
        invitedAt: new Date(),
        invitedById: currentUser.id,
      },
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

    return NextResponse.json({ user: toUserResponse(createdUser) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
