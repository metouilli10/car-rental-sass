"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { EncaisserDialog } from "./EncaisserDialog";
import { LibererCautionDialog } from "./LibererCautionDialog";
import type { PriorityActionItem } from "@/lib/dashboard/types";

interface ActionCenterRowProps {
  item: PriorityActionItem;
}

export function ActionCenterRow({ item }: ActionCenterRowProps) {
  const [encaisserOpen, setEncaisserOpen] = useState(false);
  const [libererCautionOpen, setLibererCautionOpen] = useState(false);
  const isEncaisser = item.type === "collection" && item.primaryAction === "Encaisser";
  const isLibererCaution =
    item.type === "deposit_release" && item.primaryAction === "Liberer" && item.depositId;

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto_auto]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {item.customerName} - {item.vehicleLabel}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.plate} - {item.dueLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {item.amount != null && item.amount > 0 ? (
          <Badge variant="outline" className="rounded-full">
            {formatCurrency(item.amount)}
          </Badge>
        ) : null}
        {isEncaisser ? (
          <>
            <Button size="sm" className="rounded-lg" onClick={() => setEncaisserOpen(true)}>
              {item.primaryAction}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <EncaisserDialog
              open={encaisserOpen}
              onOpenChange={setEncaisserOpen}
              bookingId={item.bookingId}
              defaultAmount={item.amount ?? 0}
              customerName={item.customerName}
              vehicleLabel={item.vehicleLabel}
            />
          </>
        ) : isLibererCaution ? (
          <>
            <Button size="sm" className="rounded-lg" onClick={() => setLibererCautionOpen(true)}>
              {item.primaryAction}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <LibererCautionDialog
              open={libererCautionOpen}
              onOpenChange={setLibererCautionOpen}
              depositId={item.depositId!}
              customerName={item.customerName}
              vehicleLabel={item.vehicleLabel}
              plate={item.plate}
              amount={item.amount ?? 0}
            />
          </>
        ) : (
          <Button asChild size="sm" className="rounded-lg">
            <Link href={item.primaryHref}>
              {item.primaryAction}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <Button asChild size="sm" variant="ghost" className="justify-self-start md:justify-self-end">
        <Link href={item.detailsHref}>Details</Link>
      </Button>
    </div>
  );
}
