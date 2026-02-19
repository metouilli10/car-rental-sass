import type { LucideIcon } from "lucide-react";
import { PiggyBank, Receipt, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

export type KpiKind = "revenue" | "expenses" | "net" | "cash" | "deposits";

export type KpiTone = {
  cardClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  valueClassName?: string;
};

export type KpiDefinition = {
  key: KpiKind;
  label: string;
  icon: LucideIcon;
  tone: KpiTone;
};

export const kpiDefinitions: Record<KpiKind, KpiDefinition> = {
  revenue: {
    key: "revenue",
    label: "Revenus",
    icon: Wallet,
    tone: {
      cardClassName: "border-blue-200/70 bg-blue-50/40",
      iconWrapClassName: "bg-blue-100 text-blue-700",
      iconClassName: "text-blue-700",
    },
  },
  expenses: {
    key: "expenses",
    label: "Charges",
    icon: Receipt,
    tone: {
      cardClassName: "border-rose-200/70 bg-rose-50/30",
      iconWrapClassName: "bg-rose-100 text-rose-700",
      iconClassName: "text-rose-700",
    },
  },
  net: {
    key: "net",
    label: "Net",
    icon: TrendingUp,
    tone: {
      cardClassName: "border-emerald-200/70 bg-emerald-50/30",
      iconWrapClassName: "bg-emerald-100 text-emerald-700",
      iconClassName: "text-emerald-700",
      valueClassName: "text-3xl font-bold",
    },
  },
  cash: {
    key: "cash",
    label: "Caisse",
    icon: PiggyBank,
    tone: {
      cardClassName: "border-amber-200/70 bg-amber-50/40",
      iconWrapClassName: "bg-amber-100 text-amber-700",
      iconClassName: "text-amber-700",
    },
  },
  deposits: {
    key: "deposits",
    label: "Cautions retenues",
    icon: ShieldCheck,
    tone: {
      cardClassName: "border-indigo-200/70 bg-slate-50/80",
      iconWrapClassName: "bg-indigo-100 text-indigo-700",
      iconClassName: "text-indigo-700",
    },
  },
};
