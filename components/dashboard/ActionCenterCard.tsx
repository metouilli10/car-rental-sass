"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionsSheet } from "@/components/dashboard/CollectionsSheet";
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import { LateReturnsSheet } from "@/components/dashboard/LateReturnsSheet";
import { DepositsDueSheet } from "@/components/dashboard/DepositsDueSheet";
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardV3ActionItem, DashboardV3DTO, DashboardV3ResolvedPeriod } from "@/lib/dashboard/types";

interface ActionCenterCardProps {
  actionCenter: DashboardV3DTO["actionCenter"];
  period: DashboardV3ResolvedPeriod;
}

const primaryActionClassName =
  "h-9 justify-center rounded-md bg-blue-50 px-3 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-100";
const secondaryActionClassName =
  "h-9 justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-700 active:text-slate-700";
const tertiaryActionClassName =
  "h-9 justify-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900";

export function ActionCenterCard({ actionCenter, period }: ActionCenterCardProps) {
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<DashboardV3ActionItem | null>(null);
  const [selectedDepositItem, setSelectedDepositItem] = useState<DashboardV3ActionItem | null>(null);
  const [collectionsSheetOpen, setCollectionsSheetOpen] = useState(false);
  const [depositsSheetOpen, setDepositsSheetOpen] = useState(false);
  const [lateReturnsSheetOpen, setLateReturnsSheetOpen] = useState(false);

  return (
    <>
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Action Center</CardTitle>
              <p className="text-xs text-slate-500">Les priorites a traiter maintenant</p>
            </div>
            {actionCenter.isAllClear ? (
              <Badge variant="success" className="rounded-full">
                Tout est sous controle
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6 pt-0">
          {actionCenter.groups.map((group) => (
            <section key={group.id} className="space-y-4 rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                    <span className="text-xs font-medium text-slate-500">
                      {group.count} element{group.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  {group.totalAmount != null ? (
                    <p className="text-xs text-slate-500">
                      Exposition: {formatCurrency(group.totalAmount)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Surveillance operationnelle</p>
                  )}
                </div>
                {group.id === "collections" ? (
                  <button
                    type="button"
                    onClick={() => setCollectionsSheetOpen(true)}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {group.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : group.id === "deposits" ? (
                  <button
                    type="button"
                    onClick={() => setDepositsSheetOpen(true)}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {group.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : group.id === "late_returns" ? (
                  <button
                    type="button"
                    onClick={() => setLateReturnsSheetOpen(true)}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {group.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <Link
                    href={group.ctaHref}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {group.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>

              {group.items.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Rien a signaler
                </div>
              ) : (
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isInlineCollection = item.actionType === "collection" && item.bookingId;
                    const isInlineDeposit = item.actionType === "deposit_release" && item.depositId;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-md px-3 py-3 transition-colors duration-150 hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.isOverdue ? (
                              <>
                                <span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden />
                                <span className="text-[11px] font-medium text-red-600">En retard</span>
                              </>
                            ) : null}
                            <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                          </div>
                          <p className="truncate text-xs text-slate-500">{item.sublabel}</p>
                          {item.dueLabel ? (
                            <p
                              className={
                                "truncate text-xs text-slate-500"
                              }
                            >
                              {item.dueLabel}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-row sm:items-center">
                          {item.amount != null ? (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                item.isOverdue
                                  ? "bg-red-50 text-red-600"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {formatCurrency(item.amount)}
                            </span>
                          ) : null}
                          {isInlineCollection ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setSelectedCollectionItem(item)}
                              className={primaryActionClassName}
                            >
                              {item.primaryAction}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : isInlineDeposit ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setSelectedDepositItem(item)}
                              className={primaryActionClassName}
                            >
                              {item.primaryAction}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              asChild
                              size="sm"
                              variant={
                                item.primaryAction === "Voir"
                                  ? "ghost"
                                  : item.primaryAction === "Relancer"
                                    ? "outline"
                                    : "default"
                              }
                              className={
                                item.primaryAction === "Voir"
                                  ? tertiaryActionClassName
                                  : item.primaryAction === "Relancer"
                                    ? secondaryActionClassName
                                    : primaryActionClassName
                              }
                            >
                              <Link href={item.primaryHref}>
                                {item.primaryAction}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </CardContent>
      </Card>

      {selectedCollectionItem?.bookingId ? (
        <EncaisserDialog
          open
          onOpenChange={(open) => {
            if (!open) setSelectedCollectionItem(null);
          }}
          bookingId={selectedCollectionItem.bookingId}
          defaultAmount={selectedCollectionItem.amount ?? 0}
          customerName={selectedCollectionItem.customerName ?? selectedCollectionItem.label}
          vehicleLabel={selectedCollectionItem.vehicleLabel ?? selectedCollectionItem.sublabel}
          onSuccess={() => setSelectedCollectionItem(null)}
        />
      ) : null}

      {selectedDepositItem?.depositId ? (
        <LibererCautionDialog
          open
          onOpenChange={(open) => {
            if (!open) setSelectedDepositItem(null);
          }}
          depositId={selectedDepositItem.depositId}
          customerName={selectedDepositItem.customerName ?? selectedDepositItem.label}
          vehicleLabel={selectedDepositItem.vehicleLabel ?? selectedDepositItem.sublabel}
          plate={selectedDepositItem.plate ?? ""}
          amount={selectedDepositItem.amount ?? 0}
          onSuccess={() => setSelectedDepositItem(null)}
        />
      ) : null}

      {(() => {
        const collectionsGroup = actionCenter.groups.find((group) => group.id === "collections");
        if (!collectionsGroup) return null;

        return (
          <CollectionsSheet
            open={collectionsSheetOpen}
            onOpenChange={setCollectionsSheetOpen}
            period={period}
            initialCount={collectionsGroup.count}
            initialOverdueCount={collectionsGroup.items.filter((item) => item.isOverdue).length}
            initialTotalAmount={collectionsGroup.totalAmount ?? 0}
          />
        );
      })()}

      {(() => {
        const lateReturnsGroup = actionCenter.groups.find((group) => group.id === "late_returns");
        if (!lateReturnsGroup) return null;

        return (
          <LateReturnsSheet
            open={lateReturnsSheetOpen}
            onOpenChange={setLateReturnsSheetOpen}
            period={period}
            initialCount={lateReturnsGroup.count}
            initialExposedCount={lateReturnsGroup.items.filter((item) => (item.amount ?? 0) > 0).length}
            initialTotalAmount={
              lateReturnsGroup.items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
            }
          />
        );
      })()}

      {(() => {
        const depositsGroup = actionCenter.groups.find((group) => group.id === "deposits");
        if (!depositsGroup) return null;

        return (
          <DepositsDueSheet
            open={depositsSheetOpen}
            onOpenChange={setDepositsSheetOpen}
            period={period}
            initialCount={depositsGroup.count}
            initialTotalAmount={depositsGroup.totalAmount ?? 0}
          />
        );
      })()}
    </>
  );
}
