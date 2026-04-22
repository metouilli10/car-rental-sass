import { AuthzError, getCurrentUserAccessOrThrow } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";

export async function getPushAuthorizedUserOrThrow() {
  const currentUser = await getCurrentUserAccessOrThrow();
  const permissions = getEffectivePermissions(currentUser.role, currentUser.permissions);

  if (!permissions["notifications.view"]) {
    throw new AuthzError("Accès interdit", 403);
  }

  return currentUser;
}
