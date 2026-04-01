"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionsSheet } from "@/components/dashboard/CollectionsSheet";
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import { LateReturnsSheet } from "@/components/dashboard/LateReturnsSheet";
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  DashboardV3ActionGroup,
  DashboardV3ActionItem,
  DashboardV3DTO,
  DashboardV3ResolvedPeriod,
} from "@/lib/dashboard/types";

interface ActionCenterCardProps {
  actionCenter: DashboardV3DTO["actionCenter"];
  period: DashboardV3ResolvedPeriod;
}

const primaryActionClassName =
  "h-8 justify-center rounded-md bg-slate-950 px-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800";
const secondaryActionClassName =
  "h-8 justify-center rounded-md border border-subtle bg-white px-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-700 active:text-slate-700";
const tertiaryActionClassName =
  "h-8 justify-center rounded-md px-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900";

interface ResolvedRowAction {
  primary: {
    label: string;
    className: string;
    variant?: "ghost" | "outline";
    href?: string;
    onClick?: () => void;
  };
  secondary?: {
    label: string;
    href: string;
  };
}

interface ResolvedGroupAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

const GROUP_TONES: Record<
  DashboardV3ActionGroup["id"],
  {
    cardBorder: string;
    headerBg: string;
    countText: string;
    titleAccent: string;
    emptyBorder: string;
    emptyBg: string;
    emptyText: string;
  }
> = {
  collections: {
    cardBorder: "border-orange-200/80",
    headerBg: "bg-orange-50/70",
    countText: "text-orange-700",
    titleAccent: "text-orange-700",
    emptyBorder: "border-orange-200/70",
    emptyBg: "bg-orange-50/40",
    emptyText: "text-orange-700/80",
  },
  deposits: {
    cardBorder: "border-sky-200/80",
    headerBg: "bg-sky-50/70",
    countText: "text-sky-700",
    titleAccent: "text-sky-700",
    emptyBorder: "border-sky-200/70",
    emptyBg: "bg-sky-50/40",
    emptyText: "text-sky-700/80",
  },
  late_returns: {
    cardBorder: "border-red-200/80",
    headerBg: "bg-red-50/70",
    countText: "text-red-700",
    titleAccent: "text-red-700",
    emptyBorder: "border-red-200/70",
    emptyBg: "bg-red-50/40",
    emptyText: "text-red-700/80",
  },
  notifications: {
    cardBorder: "border-blue-200/80",
    headerBg: "bg-blue-50/70",
    countText: "text-blue-700",
    titleAccent: "text-blue-700",
    emptyBorder: "border-blue-200/70",
    emptyBg: "bg-blue-50/40",
    emptyText: "text-blue-700/80",
  },
};

function getRowActions(args: {
  item: DashboardV3ActionItem;
  groupId: DashboardV3ActionGroup["id"];
  onCollection: (item: DashboardV3ActionItem) => void;
  onDeposit: (item: DashboardV3ActionItem) => void;
  viewBookingLabel: string;
}): ResolvedRowAction {
  const { item, groupId, onCollection, onDeposit, viewBookingLabel } = args;

  if (item.actionType === "collection" && item.bookingId) {
    return {
      primary: {
        label: item.primaryAction,
        className: primaryActionClassName,
        onClick: () => onCollection(item),
      },
      secondary: {
        label: viewBookingLabel,
        href: item.primaryHref,
      },
    };
  }

  if (item.actionType === "deposit_release" && item.depositId) {
    return {
      primary: {
        label: item.primaryAction,
        className: primaryActionClassName,
        onClick: () => onDeposit(item),
      },
      secondary: {
        label: viewBookingLabel,
        href: item.primaryHref,
      },
    };
  }

  if (groupId === "late_returns") {
    return {
      primary: {
        label: item.primaryAction,
        href: item.primaryHref,
        className: primaryActionClassName,
      },
    };
  }

  if (groupId === "notifications") {
    return {
      primary: {
        label: item.primaryAction,
        href: item.primaryHref,
        className: primaryActionClassName,
      },
    };
  }

  return {
    primary: {
      label: item.primaryAction,
      href: item.primaryHref,
      variant: "ghost",
      className: tertiaryActionClassName,
    },
  };
}

function getGroupAction(args: {
  group: DashboardV3ActionGroup;
  onCollections: () => void;
  onDeposits: () => void;
  onLateReturns: () => void;
}): ResolvedGroupAction {
  const { group, onCollections, onDeposits, onLateReturns } = args;

  if (group.id === "collections") {
    return { label: group.ctaLabel, onClick: onCollections };
  }

  if (group.id === "deposits") {
    return { label: group.ctaLabel, onClick: onDeposits };
  }

  if (group.id === "late_returns") {
    return { label: group.ctaLabel, onClick: onLateReturns };
  }

  return { label: group.ctaLabel, href: group.ctaHref };
}

export function ActionCenterCard({ actionCenter, period }: ActionCenterCardProps) {
  const { t, locale } = useI18n();
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<DashboardV3ActionItem | null>(null);
  const [selectedDepositItem, setSelectedDepositItem] = useState<DashboardV3ActionItem | null>(null);
  const [collectionsSheetOpen, setCollectionsSheetOpen] = useState(false);
  const [lateReturnsSheetOpen, setLateReturnsSheetOpen] = useState(false);
  const visibleGroups = actionCenter.groups.filter((group) => group.id !== "deposits");
  const isVisibleAllClear = visibleGroups.every((group) => group.count === 0);
  const viewBookingLabel = t("dashboard.rowActions.viewBooking");

  function renderSection(group: DashboardV3ActionGroup) {
    const tone = GROUP_TONES[group.id];
    const groupAction = getGroupAction({
      group,
      onCollections: () => setCollectionsSheetOpen(true),
      onDeposits: () => undefined,
      onLateReturns: () => setLateReturnsSheetOpen(true),
    });

    return (
      <section
        key={group.id}
        className={cn(
          "rounded-xl border bg-[hsl(var(--surface))] p-4 shadow-sm",
          tone.cardBorder
        )}
      >
        <div className={cn("flex items-start justify-between gap-3 rounded-lg px-3 py-3", tone.headerBg)}>
          <div className="min-w-0">
            <h3 className={cn("text-sm font-semibold", tone.titleAccent)}>{group.title}</h3>
            <p className={cn("mt-1 text-[12px]", tone.countText)}>
              {t(
                group.count === 1
                  ? "dashboard.actionCenter.elementOne"
                  : "dashboard.actionCenter.elementOther",
                { n: group.count }
              )}
            </p>
          </div>
          {groupAction.onClick ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={groupAction.onClick}
              className={tertiaryActionClassName}
            >
              {groupAction.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className={tertiaryActionClassName}>
              <Link href={withLocalePath(locale, groupAction.href!)}>
                {groupAction.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {group.items.length === 0 ? (
          <div
            className={cn(
              "mt-4 rounded-lg border border-dashed px-3 py-4 text-[12px]",
              tone.emptyBorder,
              tone.emptyBg,
              tone.emptyText
            )}
          >
            {t("dashboard.actionCenter.emptySection")}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {group.items.slice(0, 1).map((item) => {
              const actions = getRowActions({
                item,
                groupId: group.id,
                onCollection: setSelectedCollectionItem,
                onDeposit: setSelectedDepositItem,
                viewBookingLabel,
              });
              const title = item.customerName ?? item.label;
              const vehicleLine =
                item.vehicleLabel && item.plate
                  ? `${item.vehicleLabel} • ${item.plate}`
                  : item.vehicleLabel ?? item.plate ?? item.sublabel;
              const secondaryLine =
                item.customerName && item.sublabel !== item.vehicleLabel ? item.sublabel : undefined;

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-subtle bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
                        {item.isOverdue ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-red-600">
                            {t("dashboard.actionCenter.overdueBadge")}
                          </span>
                        ) : null}
                      </div>
                      {vehicleLine ? (
                        <p className="mt-1 truncate text-[12px] text-slate-500">{vehicleLine}</p>
                      ) : null}
                      {secondaryLine ? (
                        <p className="mt-1 truncate text-[12px] text-slate-500">{secondaryLine}</p>
                      ) : null}
                    </div>
                    {item.amount != null ? (
                      <span
                        className={cn(
                          "shrink-0 text-right text-sm font-semibold tabular-nums",
                          item.isOverdue ? "text-red-600" : "text-slate-700"
                        )}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    ) : null}
                  </div>

                  {item.dueLabel ? (
                    <p
                      className={cn(
                        "mt-3 text-[12px]",
                        item.isOverdue ? "text-red-600" : "text-slate-500"
                      )}
                    >
                      {item.dueLabel}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {actions.primary.onClick ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={actions.primary.onClick}
                        className={actions.primary.className}
                      >
                        {actions.primary.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant={actions.primary.variant}
                        className={actions.primary.className}
                      >
                        <Link href={withLocalePath(locale, actions.primary.href!)}>
                          {actions.primary.label}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    {actions.secondary ? (
                      <Button asChild size="sm" variant="ghost" className={tertiaryActionClassName}>
                        <Link href={withLocalePath(locale, actions.secondary.href)}>
                          {actions.secondary.label}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <Card className="dashboard-panel">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="section-title">{t("dashboard.actionCenter.title")}</CardTitle>
              <p className="meta-text mt-1">{t("dashboard.actionCenter.subtitle")}</p>
            </div>
            {isVisibleAllClear ? (
              <Badge variant="success" className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                {t("dashboard.actionCenter.allClear")}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            {visibleGroups.map(renderSection)}
          </div>
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
    </>
  );
}
