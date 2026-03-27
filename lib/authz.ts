import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Prisma, UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AuthzError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthzError";
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  agencyId: string;
  agencyName: string;
  role: UserRole;
  email: string;
};

export type CurrentUserAccess = CurrentUser & {
  permissions: Prisma.JsonValue | null;
};

export async function getCurrentUserOrThrow(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthzError("Non autorisé", 401);
  }

  const agencyId = session.user.agencyId;
  if (!agencyId || typeof agencyId !== "string") {
    throw new AuthzError("Session invalide : agencyId manquant. Veuillez vous reconnecter.", 401);
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    agencyId,
    agencyName: session.user.agencyName ?? "",
    role: session.user.role,
    email: session.user.email ?? "",
  };
}

export async function getCurrentUserAccessOrThrow(): Promise<CurrentUserAccess> {
  const currentUser = await getCurrentUserOrThrow();

  const membership = await prisma.user.findFirst({
    where: {
      id: currentUser.id,
      agencyId: currentUser.agencyId,
    },
    select: {
      permissionOverrides: true,
    },
  });

  if (!membership) {
    throw new AuthzError("Accès interdit", 403);
  }

  return {
    ...currentUser,
    permissions: membership.permissionOverrides ?? null,
  };
}

export async function getCurrentUserForPage() {
  try {
    return await getCurrentUserOrThrow();
  } catch (error) {
    if (error instanceof AuthzError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

export async function getCurrentUserAccessForPage() {
  try {
    return await getCurrentUserAccessOrThrow();
  } catch (error) {
    if (error instanceof AuthzError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

export function requireRole(currentRole: UserRole, allowed: readonly UserRole[]): void {
  if (!allowed.includes(currentRole)) {
    throw new AuthzError("Accès interdit", 403);
  }
}

export function requireAgency(resourceAgencyId: string, currentAgencyId: string): void {
  if (resourceAgencyId !== currentAgencyId) {
    // 404 avoids leaking resource existence across agencies
    throw new AuthzError("Ressource introuvable", 404);
  }
}

export function canManageUsers(role: UserRole): boolean {
  return role === "OWNER";
}

export function canDelete(role: UserRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}
