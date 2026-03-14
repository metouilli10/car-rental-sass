"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionsSheet } from "@/components/dashboard/CollectionsSheet";
import { EncaisserDialog } from "@/components/dashboard/EncaisserDialog";
import { LateReturnsSheet } from "@/components/dashboard/LateReturnsSheet";
import { DepositsDueSheet } from "@/components/dashboard/DepositsDueSheet";
import { LibererCautionDialog } from "@/components/dashboard/LibererCautionDialog";
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

type PriorityBucket = "critical" | "important" | "upcoming";

interface QueueItem extends DashboardV3ActionItem {
  bucket: PriorityBucket;
  groupId: DashboardV3ActionGroup["id"];
  groupTitle: string;
  groupCtaHref: string;
}

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

interface BucketSubgroup {
  id: DashboardV3ActionGroup["id"];
  title: string;
  ctaHref: string;
  items: QueueItem[];
}

interface ResolvedGroupAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

const BUCKET_META: Record<
  PriorityBucket,
  { label: string; toneClassName: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "Critique",
    toneClassName: "text-red-600",
    icon: AlertTriangle,
  },
  important: {
    label: "Important",
    toneClassName: "text-amber-600",
    icon: Clock3,
  },
  upcoming: {
    label: "À venir",
    toneClassName: "text-slate-500",
    icon: ShieldCheck,
  },
};

function resolveBucket(group: DashboardV3ActionGroup, item: DashboardV3ActionItem): PriorityBucket {
  if (item.isOverdue || group.id === "late_returns") return "critical";
  if (group.id === "collections" || group.id === "deposits") return "important";
  return "upcoming";
}

function buildPriorityBuckets(groups: DashboardV3ActionGroup[]) {
  const items: QueueItem[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      bucket: resolveBucket(group, item),
      groupId: group.id,
      groupTitle: group.title,
      groupCtaHref: group.ctaHref,
    }))
  );

  return {
    critical: items.filter((item) => item.bucket === "critical"),
    important: items.filter((item) => item.bucket === "important"),
    upcoming: items.filter((item) => item.bucket === "upcoming"),
  };
}

function groupBucketItems(items: QueueItem[]): BucketSubgroup[] {
  const grouped = new Map<DashboardV3ActionGroup["id"], BucketSubgroup>();

  for (const item of items) {
    const current = grouped.get(item.groupId);
    if (current) {
      current.items.push(item);
      continue;
    }

    grouped.set(item.groupId, {
      id: item.groupId,
      title: item.groupTitle,
      ctaHref: item.groupCtaHref,
      items: [item],
    });
  }

  return Array.from(grouped.values());
}

function getRowActions(args: {
  item: QueueItem;
  onCollection: (item: DashboardV3ActionItem) => void;
  onDeposit: (item: DashboardV3ActionItem) => void;
}): ResolvedRowAction {
  const { item, onCollection, onDeposit } = args;

  if (item.actionType === "collection" && item.bookingId) {
    return {
      primary: {
        label: "Encaisser",
        className: primaryActionClassName,
        onClick: () => onCollection(item),
      },
      secondary: {
        label: "Voir dossier",
        href: item.primaryHref,
      },
    };
  }

  if (item.actionType === "deposit_release" && item.depositId) {
    return {
      primary: {
        label: "Liberer",
        className: primaryActionClassName,
        onClick: () => onDeposit(item),
      },
      secondary: {
        label: "Voir dossier",
        href: item.primaryHref,
      },
    };
  }

  if (item.groupId === "late_returns") {
    return {
      primary: {
        label: "Voir dossier",
        href: item.primaryHref,
        variant: "outline",
        className: secondaryActionClassName,
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
  group: BucketSubgroup;
  onCollections: () => void;
  onDeposits: () => void;
  onLateReturns: () => void;
}): ResolvedGroupAction {
  const { group, onCollections, onDeposits, onLateReturns } = args;

  if (group.id === "collections") {
    return { label: "Voir tout", onClick: onCollections };
  }

  if (group.id === "deposits") {
    return { label: "Voir tout", onClick: onDeposits };
  }

  if (group.id === "late_returns") {
    return { label: "Voir tout", onClick: onLateReturns };
  }

  return { label: "Voir tout", href: group.ctaHref };
}

export function ActionCenterCard({ actionCenter, period }: ActionCenterCardProps) {
  const [selectedCollectionItem, setSelectedCollectionItem] = useState<DashboardV3ActionItem | null>(null);
  const [selectedDepositItem, setSelectedDepositItem] = useState<DashboardV3ActionItem | null>(null);
  const [collectionsSheetOpen, setCollectionsSheetOpen] = useState(false);
  const [depositsSheetOpen, setDepositsSheetOpen] = useState(false);
  const [lateReturnsSheetOpen, setLateReturnsSheetOpen] = useState(false);
  const priorityBuckets = buildPriorityBuckets(actionCenter.groups);

  return (
    <>
      <Card className="dashboard-panel">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="section-title">Priorités opérationnelles</CardTitle>
              <p className="meta-text mt-1">Les priorités à traiter maintenant</p>
            </div>
            {actionCenter.isAllClear ? (
              <Badge variant="success" className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                Tout est sous contrôle
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {(Object.entries(priorityBuckets) as Array<[PriorityBucket, QueueItem[]]>).map(
            ([bucketKey, items]) => {
              const meta = BUCKET_META[bucketKey];
              const Icon = meta.icon;
              const groupedItems = groupBucketItems(items);

              return (
                <section key={bucketKey} className="rounded-xl border border-subtle bg-[hsl(var(--surface))] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-3.5 w-3.5", meta.toneClassName)} />
                      <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                        {meta.label}
                      </h3>
                    </div>
                    <span className="text-[11px] tabular-nums text-slate-400">{items.length}</span>
                  </div>

                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-subtle bg-slate-50 px-3 py-4 text-[12px] text-slate-500">
                      Rien à signaler
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedItems.map((group) => {
                        const groupAction = getGroupAction({
                          group,
                          onCollections: () => setCollectionsSheetOpen(true),
                          onDeposits: () => setDepositsSheetOpen(true),
                          onLateReturns: () => setLateReturnsSheetOpen(true),
                        });

                        return (
                          <div key={`${bucketKey}-${group.id}`} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 px-2">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {group.title}
                                </p>
                                <p className="text-[11px] text-slate-400">{group.items.length} element{group.items.length > 1 ? "s" : ""}</p>
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
                                  <Link href={groupAction.href!}>
                                    {groupAction.label}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {group.items.slice(0, 3).map((item) => {
                                const actions = getRowActions({
                                  item,
                                  onCollection: setSelectedCollectionItem,
                                  onDeposit: setSelectedDepositItem,
                                });

                                return (
                                  <div
                                    key={`${bucketKey}-${group.id}-${item.id}`}
                                    className="rounded-lg border border-transparent px-2 py-2 transition-colors duration-150 hover:bg-slate-50"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="truncate text-sm font-medium text-slate-950">{item.label}</p>
                                          {item.isOverdue ? (
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-red-600">
                                              En retard
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="truncate text-[12px] leading-none text-slate-500">
                                          {item.sublabel}
                                        </p>
                                        {item.dueLabel ? (
                                          <p
                                            className={cn(
                                              "text-[11px] leading-none",
                                              item.isOverdue ? "text-red-600" : "text-slate-400"
                                            )}
                                          >
                                            {item.dueLabel}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                                        {item.amount != null ? (
                                          <span
                                            className={cn(
                                              "shrink-0 text-right text-[11px] font-medium tabular-nums",
                                              item.isOverdue ? "text-red-600" : "text-slate-500"
                                            )}
                                          >
                                            {formatCurrency(item.amount)}
                                          </span>
                                        ) : null}
                                        <div className="flex flex-col gap-2 sm:items-end">
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
                                              <Link href={actions.primary.href!}>
                                                {actions.primary.label}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                              </Link>
                                            </Button>
                                          )}
                                          {actions.secondary ? (
                                            <Button asChild size="sm" variant="ghost" className={tertiaryActionClassName}>
                                              <Link href={actions.secondary.href}>{actions.secondary.label}</Link>
                                            </Button>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            }
          )}
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
