import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { Settings, Info } from "lucide-react";
import { AgencyProfileForm } from "@/components/settings/agency-profile-form";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ContextPanel } from "@/components/onboarding/ContextPanel";

export default async function SetupPage() {
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
    redirect("/login");
  }

  return (
    <OnboardingShell
      leftPanel={
        <ContextPanel
          badgeIcon={<Settings className="h-3.5 w-3.5" />}
          badgeText="Première configuration"
          title="Configurez votre agence"
          subtitle="Renseignez l'essentiel pour personnaliser votre espace. Vous pourrez ajuster le reste plus tard."
          steps={[
            "Créer votre profil",
            "Accéder au tableau de bord",
            "Commencer les opérations",
          ]}
          tip={{
            icon: <Info className="h-4 w-4" />,
            title: "Démarrez proprement",
            description:
              "Nom et ville requis, le reste est facultatif. Vous pouvez tout modifier depuis vos paramètres.",
          }}
        />
      }
    >
      <AgencyProfileForm
        mode="setup"
        initialValues={{
          name: agency.name,
          city: agency.city,
          address: agency.address ?? "",
          rcNumber: agency.rcNumber ?? "",
          logoUrl: agency.logoUrl ?? "",
        }}
      />
    </OnboardingShell>
  );
}
