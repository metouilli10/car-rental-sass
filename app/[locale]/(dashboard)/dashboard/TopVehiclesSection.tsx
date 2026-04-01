import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopVehiclesCard } from "@/components/dashboard/TopVehiclesCard";
import { getDashboardTopVehicles } from "@/lib/dashboard/queries";

interface TopVehiclesSectionProps {
  agencyId: string;
}

export async function TopVehiclesSection({ agencyId }: TopVehiclesSectionProps) {
  try {
    const data = await getDashboardTopVehicles(agencyId);
    return <TopVehiclesCard data={data} />;
  } catch (error) {
    console.warn("TopVehiclesSection failed", { agencyId, error });
    return <TopVehiclesSectionFallback />;
  }
}

export function TopVehiclesSectionFallback() {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Top vehicules ce mois
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-14 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-14 w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-14 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-14 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}
