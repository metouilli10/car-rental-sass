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
import { useI18n } from "@/components/i18n/i18n-context";
import { getLateReturnsForSheet } from "@/lib/actions/dashboard";
import { withLocalePath } from "@/lib/i18n/config";
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
  const { t, locale } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardV3LateReturnsSheetDTO | null>(null);

  useEffect(() => {
    if (!open) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getLateReturnsForSheet(
      {
        period: period.key,
        start: period.start,
        end: period.end,
      },
      locale
    )
      .then((result) => {
        if (!isCancelled) setData(result);
      })
      .catch(() => {
        if (!isCancelled) setError(t("dashboard.sheets.lateReturns.loadError"));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [open, period.end, period.key, period.start, locale, t]);

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
      title={t("dashboard.sheets.lateReturns.title")}
      description={t("dashboard.sheets.lateReturns.description", {
        count: summary.count,
        exposed: summary.exposedCount,
      })}
      tone="red"
      summaryRows={[
        { label: t("dashboard.sheets.lateReturns.summaryReturns"), value: summary.count },
        { label: t("dashboard.sheets.lateReturns.summaryExposed"), value: summary.exposedCount },
        { label: t("dashboard.sheets.lateReturns.summaryAmount"), value: formatCurrency(summary.totalAmount) },
      ]}
    >
      {isLoading ? (
        <ActionCenterSheetLoading />
      ) : error ? (
        <ActionCenterSheetError message={error} />
      ) : data && data.items.length === 0 ? (
        <ActionCenterSheetEmpty
          title={t("dashboard.sheets.lateReturns.emptyTitle")}
          description={t("dashboard.sheets.common.allGoodDescription")}
        />
      ) : (
        data?.items.map((item) => (
          <div
            key={item.bookingId}
            className="rounded-xl border border-red-200/80 bg-white px-4 py-3 transition-colors hover:bg-red-50/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{item.customerName}</p>
                  <Badge variant="destructive">{t("dashboard.sheets.collections.overdueBadge")}</Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.vehicleLabel} - {item.plate}
                </p>
                <p className="text-xs text-destructive">{item.dueLabel}</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {item.amount != null ? (
                  <Badge variant="destructive" className="rounded-full border-red-200 bg-red-50 text-red-700">
                    {formatCurrency(item.amount)}
                  </Badge>
                ) : null}
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full border-border bg-background text-foreground transition-colors duration-150 hover:bg-slate-50 hover:text-foreground active:text-foreground sm:w-auto"
                >
                  <Link href={withLocalePath(locale, item.primaryHref)}>
                    {t("dashboard.sheets.collections.viewBooking")}
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
