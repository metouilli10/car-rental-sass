import { Car, Receipt, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatMAD } from "@/lib/format";

type KeyMetricsCardProps = {
  revenuePerVehicle: number;
  panierMoyen: number;
  activeVehicleCount: number;
  periodLabel: string;
};

export function KeyMetricsCard({
  revenuePerVehicle,
  panierMoyen,
  activeVehicleCount,
  periodLabel,
}: KeyMetricsCardProps) {
  const metrics = [
    {
      key: "rev-vehicle",
      label: "Revenu / véhicule",
      value: formatMAD(revenuePerVehicle),
      icon: Car,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      key: "panier",
      label: "Panier moyen",
      value: formatMAD(panierMoyen),
      icon: Receipt,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "active",
      label: "Véhicules actifs",
      value: `${activeVehicleCount}`,
      icon: Target,
      iconClass: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Métriques clés</CardTitle>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
      </CardHeader>
      <CardContent className="space-y-0">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-lg font-semibold tracking-tight">
                    {metric.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
