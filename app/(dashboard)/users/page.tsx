import { redirect } from "next/navigation";
import { getCurrentUserForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { UsersPage } from "@/components/users/users-page";
import { toManagedUser } from "@/lib/users/serializers";

export default async function UsersManagementPage() {
  const currentUser = await getCurrentUserForPage();

  if (currentUser.role !== "OWNER") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    where: {
      agencyId: currentUser.agencyId,
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
      permissionOverrides: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <UsersPage
      initialUsers={users.map((user) => toManagedUser(user))}
      currentUserId={currentUser.id}
    />
  );
}
