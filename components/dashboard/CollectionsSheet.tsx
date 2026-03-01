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
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import { getCollectionsForSheet } from "@/lib/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import type {
  DashboardV3CollectionSheetItem,
  DashboardV3CollectionsSheetDTO,
  DashboardV3ResolvedPeriod,
} from "@/lib/dashboard/types";

interface CollectionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: DashboardV3ResolvedPeriod;
  initialCount: number;
  initialOverdueCount: number;
  initialTotalAmount: number;
}

export function CollectionsSheet({
  open,
  onOpenChange,
  period,
  initialCount,
  initialOverdueCount,
  initialTotalAmount,
}: CollectionsSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV3CollectionsSheetDTO | null>(null);
  const [selectedItem, setSelectedItem] = useState<DashboardV3CollectionSheetItem | null>(null);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getCollectionsForSheet({
      period: period.key,
      start: period.start,
      end: period.end,
    })
      .then((result) => {
        if (!isCancelled) setData(result);
      })
      .catch(() => {
        if (!isCancelled) setError("Impossible de charger les encaissements.");
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
        overdueCount: data.overdueCount,
        totalAmount: data.totalAmount,
      };
    }
    return {
      count: initialCount,
      overdueCount: initialOverdueCount,
      totalAmount: initialTotalAmount,
    };
  }, [data, initialCount, initialOverdueCount, initialTotalAmount]);

  const handleCollectSuccess = () => {
    if (!selectedItem) return;
    setData((current) => {
      if (!current) return current;
      const items = current.items.filter((item) => item.bookingId !== selectedItem.bookingId);
      return {
        count: items.length,
        overdueCount: items.filter((item) => item.isOverdue).length,
        totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
        items,
      };
    });
    setSelectedItem(null);
  };

  return (
    <>
      <ActionCenterSheet
        open={open}
        onOpenChange={onOpenChange}
        title="A encaisser"
        description={`${summary.count} dossiers pour ${formatCurrency(summary.totalAmount)}`}
        summaryRows={[
          { label: "Dossiers", value: summary.count },
          { label: "En retard", value: summary.overdueCount },
          { label: "Montant total", value: formatCurrency(summary.totalAmount) },
        ]}
      >
        {isLoading ? (
          <ActionCenterSheetLoading />
        ) : error ? (
          <ActionCenterSheetError message={error} />
        ) : data && data.items.length === 0 ? (
          <ActionCenterSheetEmpty
            title="Aucun encaissement en attente"
            description="Tout est a jour pour le moment."
          />
        ) : (
          data?.items.map((item) => (
            <div
              key={item.bookingId}
              className="rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/30"
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
                      onClick={() => setSelectedItem(item)}
                      className="w-full sm:w-auto"
                    >
                      Encaisser
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full border-border bg-background text-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground active:text-foreground sm:w-auto"
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

      {selectedItem ? (
        <EncaisserDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedItem(null);
          }}
          bookingId={selectedItem.bookingId}
          defaultAmount={selectedItem.amount}
          customerName={selectedItem.customerName}
          vehicleLabel={selectedItem.vehicleLabel}
          onSuccess={handleCollectSuccess}
        />
      ) : null}
    </>
  );
}
