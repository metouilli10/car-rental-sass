"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActionCenterSheet,
  ActionCenterSheetEmpty,
  ActionCenterSheetError,
  ActionCenterSheetLoading,
} from "@/components/dashboard/ActionCenterSheet";
import { getLateReturnsForSheet } from "@/lib/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import type {
  DashboardV3LateReturnsSheetDTO,
  DashboardV3ResolvedPeriod,
} from "@/lib/dashboard/types";

interface LateReturnsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: DashboardV3ResolvedPeriod;
  initialCount: number;
  initialExposedCount: number;
  initialTotalAmount: number;
}

export function LateReturnsSheet({
  open,
  onOpenChange,
  period,
  initialCount,
  initialExposedCount,
  initialTotalAmount,
}: LateReturnsSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV3LateReturnsSheetDTO | null>(null);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getLateReturnsForSheet({
      period: period.key,
      start: period.start,
      end: period.end,
    })
      .then((result) => {
        if (!isCancelled) setData(result);
      })
      .catch(() => {
        if (!isCancelled) setError("Impossible de charger les retours en retard.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, period.end, period.key, period.start]);

  const summary = useMemo(() => {
    if (data) {
      return {
        count: data.count,
        exposedCount: data.exposedCount,
        totalAmount: data.totalAmount,
      };
    }
    return {
      count: initialCount,
      exposedCount: initialExposedCount,
      totalAmount: initialTotalAmount,
    };
  }, [data, initialCount, initialExposedCount, initialTotalAmount]);

  return (
    <ActionCenterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Retours en retard"
      description={`${summary.count} retours a traiter, ${summary.exposedCount} avec exposition`}
      summaryRows={[
        { label: "Retours", value: summary.count },
        { label: "Avec exposition", value: summary.exposedCount },
        { label: "Montant expose", value: formatCurrency(summary.totalAmount) },
      ]}
    >
      {isLoading ? (
        <ActionCenterSheetLoading />
      ) : error ? (
        <ActionCenterSheetError message={error} />
      ) : data && data.items.length === 0 ? (
        <ActionCenterSheetEmpty
          title="Aucun retour en retard"
          description="Tout est a jour pour le moment."
        />
      ) : (
        data?.items.map((item) => (
          <div
            key={item.bookingId}
            className="rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{item.customerName}</p>
                  <Badge variant="destructive">En retard</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.vehicleLabel} - {item.plate}
                </p>
                <p className="text-xs text-destructive">{item.dueLabel}</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {item.amount != null ? (
                  <Badge variant="destructive" className="rounded-full">
                    {formatCurrency(item.amount)}
                  </Badge>
                ) : null}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full border-border bg-background text-foreground transition-colors duration-150 hover:bg-slate-50 hover:text-foreground active:text-foreground sm:w-auto"
                >
                  <Link href={item.primaryHref}>
                    Relancer
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </ActionCenterSheet>
  );
}
