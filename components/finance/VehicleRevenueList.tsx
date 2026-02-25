import { Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMAD } from "@/lib/format";

type VehicleRevenueItem = {
  name: string;
  amount: number;
  percentage: number;
};

type VehicleRevenueListProps = {
  items: VehicleRevenueItem[];
};

export function VehicleRevenueList({ items }: VehicleRevenueListProps) {
  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Revenus par véhicule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Classement par chiffre d&apos;affaires généré
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 p-6">
            <Car className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucun revenu véhicule sur cette période
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 8).map((item, index) => (
              <div key={`${item.name}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{item.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="font-medium">{formatMAD(item.amount)}</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
