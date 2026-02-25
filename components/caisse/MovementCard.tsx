"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SerializedMovement } from "./types";
import type { CaisseMovementType } from "@/lib/dashboard/caisse";

const BADGE_CLASSES: Record<CaisseMovementType, string> = {
  payment: "bg-blue-100 text-blue-700",
  deposit_received: "bg-violet-100 text-violet-700",
  deposit_returned: "bg-sky-100 text-sky-700",
  refund: "bg-amber-100 text-amber-700",
  expense: "bg-zinc-100 text-zinc-700",
};

type MovementCardProps = {
  movement: SerializedMovement;
  showDate?: boolean;
};

export function MovementCard({ movement, showDate = false }: MovementCardProps) {
  const badgeClass = BADGE_CLASSES[movement.type];
  const amountFormatted = `${movement.direction === "in" ? "+" : "-"}${formatCurrency(movement.amount)}`;
  const metaTime = showDate
    ? format(new Date(movement.happenedAt), "dd/MM HH:mm")
    : format(new Date(movement.happenedAt), "HH:mm");
  const metaLine = movement.reference
    ? `${metaTime} · ${movement.reference}`
    : metaTime;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{movement.label}</span>
          <span
            className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}
          >
            {movement.type === "deposit_received"
              ? "Caution reçue"
              : movement.type === "deposit_returned"
                ? "Caution remb."
                : movement.type === "payment"
                  ? "Paiement"
                  : movement.type === "refund"
                    ? "Remboursement"
                    : "Charge"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`text-right text-sm font-bold tabular-nums ${
              movement.direction === "in" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {amountFormatted}
          </span>
          {movement.bookingId && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 truncate">
        {movement.customerName?.trim() || "—"}
      </p>
      <p className="text-xs text-muted-foreground">{metaLine}</p>
    </>
  );

  const className =
    "block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:bg-blue-50/40 space-y-1";

  if (movement.bookingId) {
    return <Link href={`/bookings/${movement.bookingId}`} className={className}>{body}</Link>;
  }

  return <div className={className}>{body}</div>;
}
