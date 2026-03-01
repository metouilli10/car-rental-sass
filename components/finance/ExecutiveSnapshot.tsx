import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Minus,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMAD } from "@/lib/format";

type DeltaInfo = {
  value: number | null; // percentage change
  tone: "positive" | "negative" | "neutral";
  label: string;
};

type ExecutiveSnapshotProps = {
  cashInHand: number;
  cashDelta: number | null;
  unpaidAmount: number;
  unpaidCount: number;
  depositsHeld: number;
  depositsHeldCount: number;
  netProfit: number;
  netDelta: number | null;
  periodLabel: string;
};

function buildDelta(value: number | null): DeltaInfo {
  if (value === null) return { value: null, tone: "neutral", label: "—" };
  const rounded = Math.round(value);
  if (rounded > 0) return { value: rounded, tone: "positive", label: `+${rounded}%` };
  if (rounded < 0) return { value: rounded, tone: "negative", label: `${rounded}%` };
  return { value: 0, tone: "neutral", label: "0%" };
}

function DeltaPill({ delta }: { delta: DeltaInfo }) {
  if (delta.value === null) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        delta.tone === "positive" && "bg-emerald-100 text-emerald-700",
        delta.tone === "negative" && "bg-red-100 text-red-700",
        delta.tone === "neutral" && "bg-slate-100 text-slate-600"
      )}
    >
      {delta.tone === "positive" && <ArrowUpRight className="h-3 w-3" />}
      {delta.tone === "negative" && <ArrowDownRight className="h-3 w-3" />}
      {delta.tone === "neutral" && <Minus className="h-3 w-3" />}
      {delta.label}
    </span>
  );
}

export function ExecutiveSnapshot({
  cashInHand,
  cashDelta,
  unpaidAmount,
  unpaidCount,
  depositsHeld,
  depositsHeldCount,
  netProfit,
  netDelta,
  periodLabel,
}: ExecutiveSnapshotProps) {
  const isNetPositive = netProfit >= 0;

  const cards = [
    {
      key: "cash",
      label: "Flux net cash",
      icon: Wallet,
      value: cashInHand,
      delta: buildDelta(cashDelta),
      subtitle: `${periodLabel} · encaissements cash - décaissements cash`,
      cardClass: "border-blue-200/70 bg-blue-50/30",
      iconWrapClass: "bg-blue-100 text-blue-700",
    },
    {
      key: "unpaid",
      label: "À Encaisser",
      icon: Clock,
      value: unpaidAmount,
      delta: null,
      subtitle: `${unpaidCount} réservation${unpaidCount !== 1 ? "s" : ""}`,
      cardClass: "border-amber-200/70 bg-amber-50/30",
      iconWrapClass: "bg-amber-100 text-amber-700",
    },
    {
      key: "deposits",
      label: "Cautions à Rembourser",
      icon: ShieldAlert,
      value: depositsHeld,
      delta: null,
      subtitle: `${depositsHeldCount} client${depositsHeldCount !== 1 ? "s" : ""}`,
      cardClass: "border-yellow-200/70 bg-yellow-50/30",
      iconWrapClass: "bg-yellow-100 text-yellow-700",
    },
    {
      key: "net",
      label: "Résultat (Net)",
      icon: TrendingUp,
      value: netProfit,
      delta: buildDelta(netDelta),
      subtitle: isNetPositive ? "Bénéfice sur la période" : "Déficit sur la période",
      cardClass: isNetPositive
        ? "border-emerald-200/70 bg-emerald-50/30"
        : "border-rose-200/70 bg-rose-50/30",
      iconWrapClass: isNetPositive
        ? "bg-emerald-100 text-emerald-700"
        : "bg-rose-100 text-rose-700",
    },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className={cn(
              "border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              card.cardClass
            )}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                    card.iconWrapClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  {formatMAD(card.value)}
                </span>
                {card.delta && <DeltaPill delta={card.delta} />}
              </div>

              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
