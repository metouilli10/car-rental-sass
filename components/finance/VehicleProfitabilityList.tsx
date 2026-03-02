"use client";

import { Car, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMAD } from "@/lib/format";

type VehicleProfitabilityItem = {
  vehicleId: string;
  label: string;
  revenue: number;
  costs: number;
  profit: number;
  marginPercent: number;
};

type VehicleProfitabilityListProps = {
  items: VehicleProfitabilityItem[];
};

export function VehicleProfitabilityList({ items }: VehicleProfitabilityListProps) {
  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rentabilité par véhicule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Classement par profit (revenus − charges directes)
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 p-6">
            <Car className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucune donnée véhicule sur cette période
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 8).map((item, index) => {
              const isProfit = item.profit >= 0;
              return (
                <div key={`${item.vehicleId}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {isProfit ? (
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      )}
                      <span className="truncate font-medium">{item.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pl-2">
                      <span className="text-xs text-muted-foreground">
                        {item.marginPercent >= 0
                          ? `${item.marginPercent.toFixed(0)}%`
                          : `${item.marginPercent.toFixed(0)}%`}
                      </span>
                      <span
                        className={
                          isProfit
                            ? "font-semibold text-emerald-700"
                            : "font-semibold text-rose-700"
                        }
                      >
                        {formatMAD(item.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4 pl-5 text-xs text-muted-foreground">
                    <span>Rev: {formatMAD(item.revenue)}</span>
                    <span>Charges: {formatMAD(item.costs)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
