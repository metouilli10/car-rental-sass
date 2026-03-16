import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { getDashboardDataV3 } from "@/lib/dashboard/v3-queries";
import { GettingStartedExperience } from "@/components/dashboard/GettingStartedExperience";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GettingStartedPage() {
  const session = await getSession();

  if (!session?.user) redirect("/login");
  if (!session.user.agencyId) redirect("/setup");

  const agencyId = session.user.agencyId;
  let dashboard = null;
  let dashboardErrorDetails: string | null = null;

  try {
    dashboard = await getDashboardDataV3({
      agencyId,
      periodInput: {},
    });
  } catch (error) {
    console.error("GettingStartedPage getDashboardDataV3 failed", { agencyId, error });
    const e = error as { code?: string; message?: string; name?: string };
    const code = e.code ? `code=${e.code}` : null;
    const name = e.name ? `name=${e.name}` : null;
    const message = e.message ? `message=${e.message}` : null;
    dashboardErrorDetails = [code, name, message].filter(Boolean).join(" | ");
  }

  if (!dashboard) {
    return (
      <Card className="rounded-3xl border border-amber-200 bg-amber-50/80 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-lg text-amber-900">
            Le démarrage guidé est temporairement indisponible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-5 pt-0">
          <p className="text-sm text-amber-900">
            Rechargez la page dans quelques secondes. Les données d&apos;onboarding n&apos;ont pas pu
            être chargées.
          </p>
          {dashboardErrorDetails ? (
            <p className="break-all font-mono text-xs text-amber-900">{dashboardErrorDetails}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!dashboard.onboarding.eligible) {
    redirect("/dashboard");
  }

  return (
    <GettingStartedExperience
      agencyName={session.user.agencyName || "Agence"}
      onboarding={dashboard.onboarding}
    />
  );
}
