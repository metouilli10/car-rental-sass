import type { UserRole } from "@prisma/client";
import { canDelete } from "@/lib/authz";

export const DELETE_CUSTOMER_ROLES: readonly UserRole[] = ["OWNER", "MANAGER"];

export function hasRole(role: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export function canDeleteCustomer(role: UserRole): boolean {
  return canDelete(role);
}
