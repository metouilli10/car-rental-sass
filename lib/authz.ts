import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";

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
  agencyId: string;
  role: UserRole;
  email: string;
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
    agencyId,
    role: session.user.role,
    email: session.user.email ?? "",
  };
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
