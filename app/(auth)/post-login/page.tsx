import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export default async function PostLoginPage() {
  const session = await getSession();

  if (!session?.user?.agencyId) {
    redirect("/login");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: session.user.agencyId },
    select: { setupCompletedAt: true },
  });

  if (!agency?.setupCompletedAt) {
    redirect("/setup");
  }

  redirect("/dashboard");
}
