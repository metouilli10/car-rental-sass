import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { WebsiteSettingsForm } from "@/components/settings/website-settings-form";
import { getWebsiteSettingsFormValues } from "@/lib/actions/website";
import { getStorefrontPath } from "@/lib/storefront/routes";

export default async function WebsiteSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    redirect(withLocalePath(locale, "/dashboard"));
  }

  const initialValues = await getWebsiteSettingsFormValues(currentUser.agencyId);
  const previewUrl = initialValues.agencySlug ? getStorefrontPath(initialValues.agencySlug) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site web"
        description="Configurez la vitrine publique de votre agence et choisissez les informations visibles par vos clients."
      />
      <WebsiteSettingsForm initialValues={initialValues} previewUrl={previewUrl} />
    </div>
  );
}
