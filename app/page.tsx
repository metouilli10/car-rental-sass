import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CometlyClonePage from "@/app/cometly-clone-2/page";
import { AgencyStorefrontPage } from "@/components/storefront/agency-storefront-page";
import { getSession } from "@/lib/auth-cache";
import { normalizeStorefrontHostname } from "@/lib/storefront/domains";
import { getPublishedVehiclesBySlug } from "@/lib/storefront/queries";
import { resolveStorefrontRequest } from "@/lib/storefront/resolve";

export default async function HomePage() {
  const headerList = await headers();
  const requestHost = normalizeStorefrontHostname(
    headerList.get("x-forwarded-host") || headerList.get("host") || "",
  );
  const storefrontResolution = requestHost
    ? await resolveStorefrontRequest({ host: requestHost })
    : null;

  if (storefrontResolution?.source === "custom-domain") {
    const storefront = await getPublishedVehiclesBySlug(storefrontResolution.agencySlug);

    if (storefront) {
      return <AgencyStorefrontPage settings={storefront.settings} vehicles={storefront.vehicles} />;
    }
  }

  const session = await getSession();

  if (session?.user) {
    redirect("/post-login");
  }

  return <CometlyClonePage />;
}
