import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { UsersPage } from "@/components/users/users-page";

export default async function UsersManagementPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    where: {
      agencyId: session.user.agencyId,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <UsersPage
      initialUsers={users.map((user) => ({
        ...user,
        invitedAt: user.invitedAt?.toISOString() ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }))}
      currentUserId={session.user.id}
    />
  );
}
