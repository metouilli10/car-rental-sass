import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AgencyProfileForm } from "@/components/settings/agency-profile-form";

export default async function AgencySettingsPage() {
  const session = await getSession();

  if (!session?.user?.agencyId) {
    redirect("/login");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: session.user.agencyId },
    select: {
      name: true,
      city: true,
      address: true,
      rcNumber: true,
      logoUrl: true,
    },
  });

  if (!agency) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agence"
        description="Mettez à jour les informations de base de votre agence."
      />
      <AgencyProfileForm
        mode="settings"
        initialValues={{
          name: agency.name,
          city: agency.city,
          address: agency.address ?? "",
          rcNumber: agency.rcNumber ?? "",
          logoUrl: agency.logoUrl ?? "",
        }}
      />
    </div>
  );
}
