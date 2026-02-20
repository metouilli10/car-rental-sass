import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { TrendMetric } from "@/lib/dashboard/types";

interface KpiCardProps {
  title: string;
  value: number;
  valueSuffix?: string;
  subtitle: string;
  trend?: TrendMetric;
  risk?: "none" | "warning" | "destructive";
}

function TrendIcon({ tone }: { tone: TrendMetric["tone"] }) {
  if (tone === "positive") return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (tone === "negative") return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

export function KpiCard({
  title,
  value,
  valueSuffix,
  subtitle,
  trend,
  risk = "none",
}: KpiCardProps) {
  const riskVariant =
    risk === "destructive" ? "destructive" : risk === "warning" ? "warning" : "secondary";

  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
          {risk !== "none" ? <Badge variant={riskVariant}>Risque</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">
          {valueSuffix === "%" ? `${Math.round(value)}%` : formatCurrency(value)}
        </p>
        {valueSuffix && valueSuffix !== "%" ? (
          <p className="text-xs text-muted-foreground">{valueSuffix}</p>
        ) : null}
        <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
        {trend ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend.tone === "positive" && "bg-emerald-100 text-emerald-700",
              trend.tone === "negative" && "bg-red-100 text-red-700",
              trend.tone === "neutral" && "bg-slate-100 text-slate-600"
            )}
          >
            <TrendIcon tone={trend.tone} />
            <span>{trend.label}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
