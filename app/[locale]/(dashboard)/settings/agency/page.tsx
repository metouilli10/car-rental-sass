import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AgencyProfileForm } from "@/components/settings/agency-profile-form";
import { isValidLocale, type AppLocale, withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function AgencySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) {
    notFound();
  }
  const locale: AppLocale = localeParam;
  const ui = getMessages(locale);
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
    redirect(withLocalePath(locale, "/dashboard"));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ui.settings.agency.pageTitle}
        description={ui.settings.agency.pageDescription}
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
