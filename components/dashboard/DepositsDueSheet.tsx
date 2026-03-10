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
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
import { getDueDepositsForSheet } from "@/lib/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import type {
  DashboardV3DueDepositItem,
  DashboardV3DueDepositsSheetDTO,
  DashboardV3ResolvedPeriod,
} from "@/lib/dashboard/types";

interface DepositsDueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: DashboardV3ResolvedPeriod;
  initialCount: number;
  initialTotalAmount: number;
}

export function DepositsDueSheet({
  open,
  onOpenChange,
  period,
  initialCount,
  initialTotalAmount,
}: DepositsDueSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV3DueDepositsSheetDTO | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<DashboardV3DueDepositItem | null>(null);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getDueDepositsForSheet({
      period: period.key,
      start: period.start,
      end: period.end,
    })
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Impossible de charger les cautions a rendre.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, period.end, period.key, period.start]);

  const summary = useMemo(() => {
    if (data) return { count: data.count, totalAmount: data.totalAmount };
    return { count: initialCount, totalAmount: initialTotalAmount };
  }, [data, initialCount, initialTotalAmount]);

  const handleReleaseSuccess = () => {
    if (!selectedDeposit) return;
    setData((current) => {
      if (!current) return current;
      const items = current.items.filter((item) => item.depositId !== selectedDeposit.depositId);
      return {
        count: items.length,
        totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
        items,
      };
    });
    setSelectedDeposit(null);
  };

  return (
    <>
      <ActionCenterSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Cautions a rendre"
        description={`${summary.count} cautions en attente pour ${formatCurrency(summary.totalAmount)}`}
        summaryRows={[
          { label: "Nombre", value: summary.count },
          { label: "Montant total", value: formatCurrency(summary.totalAmount) },
        ]}
      >
        {isLoading ? (
          <ActionCenterSheetLoading />
        ) : error ? (
          <ActionCenterSheetError message={error} />
        ) : data && data.items.length === 0 ? (
          <ActionCenterSheetEmpty
            title="Aucune caution a rendre"
            description="Tout est a jour pour le moment."
          />
        ) : (
          data?.items.map((item) => (
            <div
              key={item.depositId}
              className="rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{item.customerName}</p>
                    {item.isOverdue ? <Badge variant="destructive">En retard</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.vehicleLabel} - {item.plate}
                  </p>
                  <p className={item.isOverdue ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                    {item.dueLabel}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <Badge variant={item.isOverdue ? "destructive" : "outline"} className="rounded-full">
                    {formatCurrency(item.amount)}
                  </Badge>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedDeposit(item)}
                      className="w-full sm:w-auto"
                    >
                      Liberer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="w-full text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 sm:w-auto"
                    >
                      <Link href={item.primaryHref}>Voir reservation</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </ActionCenterSheet>

      {selectedDeposit ? (
        <LibererCautionDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedDeposit(null);
          }}
          depositId={selectedDeposit.depositId}
          customerName={selectedDeposit.customerName}
          vehicleLabel={selectedDeposit.vehicleLabel}
          plate={selectedDeposit.plate}
          amount={selectedDeposit.amount}
          onSuccess={handleReleaseSuccess}
        />
      ) : null}
    </>
  );
}
