import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  cardBg?: string;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  cardBg = "bg-white",
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  trend,
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${cardBg}`}
    >
      {/* Top row — icon + trend */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div
            className={`h-11 w-11 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        )}

        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              trend.isUp
                ? "bg-emerald-100/80 text-emerald-700"
                : "bg-red-100/80 text-red-600"
            }`}
          >
            {trend.isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.isUp ? "+" : "-"}
            {trend.value}%
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-foreground tracking-tight leading-none">
        {value}
      </p>

      {/* Label */}
      <p className="text-[13px] font-medium text-muted-foreground/75 mt-3">
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground/60 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
