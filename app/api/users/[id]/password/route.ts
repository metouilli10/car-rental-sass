import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

type ResetPasswordPayload = {
  tempPassword?: string;
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
    const body = (await request.json()) as ResetPasswordPayload;
    const tempPassword = body.tempPassword?.trim();

    if (!tempPassword || tempPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe temporaire doit contenir au moins 8 caractères" },
        { status: 400 },
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "Utilisez la page profil pour modifier votre propre mot de passe" },
        { status: 400 },
      );
    }

    const target = await prisma.user.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const password = await hash(tempPassword, 10);

    await prisma.user.updateMany({
      where: { id, agencyId: currentUser.agencyId },
      data: {
        password,
        invitedAt: new Date(),
        invitedById: currentUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH /api/users/[id]/password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
