"use client";

import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PriorityActionRow } from "./PriorityActionRow";

export interface PriorityActionItem {
  id: string;
  type: "retard" | "paiement" | "caution" | "rappel";
  paymentId?: string;
  depositId?: string;
  clientName: string;
  vehicleName: string;
  plate: string;
  amountText?: string;
  detailsHref: string;
  actionLabel: string;
  actionHref: string;
  phoneHref?: string;
  waLink?: string;
  dueLabel: string;
  stripeColor: string;
}

interface PriorityActionsListProps {
  actions: PriorityActionItem[];
}

export function PriorityActionsList({ actions }: PriorityActionsListProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-md bg-red-100 p-1.5 text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Actions prioritaires</h2>
            <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
          </div>
        </div>

        <Badge variant="secondary" className="h-6 min-w-6 justify-center rounded-full px-2 text-xs">
          {actions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {actions.map((action) => (
          <PriorityActionRow key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}
