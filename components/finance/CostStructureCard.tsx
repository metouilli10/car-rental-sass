import { Building2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatMAD } from "@/lib/format";

type CostStructureCardProps = {
  fixedAmount: number;
  variableAmount: number;
  fixedPercentOfRevenue: number;
  revenuePeriod: number;
};

export function CostStructureCard({
  fixedAmount,
  variableAmount,
  fixedPercentOfRevenue,
  revenuePeriod,
}: CostStructureCardProps) {
  const total = fixedAmount + variableAmount;
  const fixedPercent = total > 0 ? (fixedAmount / total) * 100 : 0;
  const variablePercent = total > 0 ? (variableAmount / total) * 100 : 0;

  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Charges : Fixes vs Variables</CardTitle>
        <p className="text-sm text-muted-foreground">
          Répartition structurelle des dépenses
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Charges fixes</span>
                <span className="text-sm font-semibold">{formatMAD(fixedAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {fixedPercent.toFixed(1)}% du total des charges
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <Wrench className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Charges variables</span>
                <span className="text-sm font-semibold">{formatMAD(variableAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {variablePercent.toFixed(1)}% du total des charges
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            {revenuePeriod > 0 ? (
              <>
                Les charges fixes représentent{" "}
                <span className="font-medium text-foreground">
                  {fixedPercentOfRevenue.toFixed(1)}%
                </span>{" "}
                des revenus
              </>
            ) : (
              "Aucun revenu enregistré sur cette période"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
