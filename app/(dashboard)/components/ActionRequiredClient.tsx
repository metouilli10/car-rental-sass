"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { completeBooking } from "@/lib/actions/bookings";
import { cn } from "@/lib/utils";
import { ActionQuickActions } from "./ActionQuickActions";
import type { ActionItem, ActionType } from "./ActionRequiredPanel";

interface ActionRequiredClientProps {
  items: ActionItem[];
}

type TabValue = "tous" | ActionType;

const typeLabel: Record<ActionType, string> = {
  retard: "Retard",
  paiement: "Paiement",
  caution: "Caution",
};

// Background chip classes per type (no border variant)
const typeBadgeClass: Record<ActionType, string> = {
  retard:   "bg-red-50 text-red-700",
  paiement: "bg-amber-50 text-amber-700",
  caution:  "bg-blue-50 text-blue-700",
};

const tabCountBadgeClass: Record<ActionType, string> = {
  retard:   "bg-red-100 text-red-700",
  paiement: "bg-amber-100 text-amber-700",
  caution:  "bg-blue-100 text-blue-700",
};

// Solid stripe — bg-* classes instead of border-l-* (stripe is a w-1 element)
const stripeClass = (item: ActionItem): string => {
  if (item.type === "retard") {
    if (item.severity === "critical") return "bg-red-600";
    if (item.severity === "high")     return "bg-red-400";
    return "bg-red-300";
  }
  if (item.type === "paiement") return "bg-amber-400";
  return "bg-blue-400";
};

export function ActionRequiredClient({ items }: ActionRequiredClientProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("tous");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const retardCount  = items.filter((i) => i.type === "retard").length;
  const paiementCount = items.filter((i) => i.type === "paiement").length;
  const cautionCount = items.filter((i) => i.type === "caution").length;

  const tabs = [
    { value: "tous" as TabValue,     label: "Tous",      count: items.length, badgeClass: "bg-slate-100 text-slate-600" },
    ...(retardCount  > 0 ? [{ value: "retard"   as TabValue, label: "Retards",   count: retardCount,   badgeClass: tabCountBadgeClass.retard   }] : []),
    ...(paiementCount > 0 ? [{ value: "paiement" as TabValue, label: "Paiements", count: paiementCount, badgeClass: tabCountBadgeClass.paiement }] : []),
    ...(cautionCount > 0 ? [{ value: "caution"  as TabValue, label: "Cautions",  count: cautionCount,  badgeClass: tabCountBadgeClass.caution  }] : []),
  ];

  const filteredItems =
    activeTab === "tous" ? items : items.filter((i) => i.type === activeTab);

  const handleCompleteBooking = async (item: ActionItem) => {
    setPendingId(item.id);
    try {
      await completeBooking(item.bookingId);
      toast.success(`${item.clientName} — retour enregistré`);
    } catch {
      toast.error("Erreur lors de l'enregistrement du retour");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* ── Panel Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="truncate font-semibold text-gray-900">Actions prioritaires</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {items.length}
              </span>
            )}
          </div>
          <p className="ml-9 mt-1 truncate text-xs text-gray-500">
            {items.length === 0
              ? "Tout est sous contrôle"
              : `${items.length} élément${items.length > 1 ? "s" : ""} nécessitent une attention immédiate`}
          </p>
        </div>

        {/* Right: compact tab strip + "Voir tout" */}
        <div className="flex min-w-0 flex-col gap-2 sm:ml-4 sm:items-end">
          {items.length > 0 && tabs.length > 1 && (
            <div className="w-full max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-1 rounded-xl bg-gray-100 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-[0.98]",
                      activeTab === tab.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {tab.label}
                    <span className={cn("ml-1 tabular-nums", tab.badgeClass)}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/bookings"
            className="self-end shrink-0 text-xs font-medium text-gray-400 transition-colors duration-200 hover:text-gray-600"
          >
            Voir tout →
          </Link>
        </div>
      </div>

      {/* ── Action Rows ─────────────────────────────────────────────── */}
      <div className="divide-y divide-gray-50">
        {filteredItems.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {activeTab === "tous"
                  ? "Aucune action urgente"
                  : `Aucun élément dans "${tabs.find((t) => t.value === activeTab)?.label ?? activeTab}"`}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {activeTab === "tous"
                  ? "Tout est sous contrôle."
                  : "Sélectionnez un autre filtre."}
              </p>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="group flex gap-4 px-5 py-4 transition-all duration-200 hover:bg-slate-50"
            >
              {/* Severity stripe */}
              <div className={cn("w-1 shrink-0 self-stretch rounded-full", stripeClass(item))} />

              <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  {/* Type chip */}
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                      typeBadgeClass[item.type]
                    )}
                  >
                    {typeLabel[item.type]}
                  </span>

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{item.clientName}</p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-gray-500">
                      <span className="truncate">{item.vehicleName}</span>
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-600">
                        {item.plate}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{item.dueLabel}</p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:justify-center">
                  <p className="truncate font-semibold text-gray-900">{item.amountText}</p>
                  {item.type === "retard" && item.delayDays !== null && item.delayDays > 0 && (
                    <p className="shrink-0 text-xs text-red-500">{item.delayDays}j de retard</p>
                  )}
                </div>

                {/* CTA cluster */}
                <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
                  <ActionQuickActions
                    type={item.type}
                    phoneHref={item.phoneHref}
                    waLink={item.waLink}
                    detailsHref={item.detailsHref}
                    bookingId={item.bookingId}
                    isPending={pendingId === item.id}
                    clientName={item.clientName}
                    vehicleName={item.vehicleName}
                    plate={item.plate}
                    onMarkReturned={() => handleCompleteBooking(item)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
