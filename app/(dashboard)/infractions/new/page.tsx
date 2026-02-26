import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InfractionForm } from "@/components/infractions/infraction-form";

export default async function NewInfractionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: session.user.agencyId },
    select: { id: true, plate: true, make: true, model: true },
    orderBy: { plate: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle infraction"
        description="Enregistrez une infraction et identifiez le client responsable."
      />
      <InfractionForm vehicles={vehicles} />
    </div>
  );
}
