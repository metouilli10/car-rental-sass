import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RevenueChartProps = {
  /** Pre-shaped data for when a chart library is integrated */
  data?: Array<{ month: string; revenue: number; expenses: number }>;
};

export function RevenueChart({ data: _data }: RevenueChartProps) {
  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Évolution Revenus vs Charges (6 mois)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tendance mensuelle de rentabilité
        </p>
      </CardHeader>
      <CardContent>
        {/* TODO: Integrate chart library (recharts, chart.js, etc.) and use `data` prop */}
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20 p-6">
          <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Graphique en cours de développement
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Les données sont collectées — visualisation bientôt disponible
          </p>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-muted-foreground">Charges</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
