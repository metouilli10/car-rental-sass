"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CarFront, TriangleAlert } from "lucide-react";
import type {
  DashboardV3ActiveBookingsDTO,
  DashboardV3BookingTab,
  DashboardV3BookingTabItem,
  DashboardV3BookingTabKey,
} from "@/lib/dashboard/types";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActiveBookingsTabsProps {
  activeBookings: DashboardV3ActiveBookingsDTO;
}

const MAX_ITEMS_PER_TAB = 5;

const EMPTY_MESSAGES: Record<DashboardV3BookingTabKey, string> = {
  active: "Aucune réservation en cours.",
  start_today: "Aucun départ prévu aujourd'hui.",
  end_today: "Aucun retour prévu aujourd'hui.",
  overdue: "Aucun retour en retard.",
};

const TAB_HREFS: Record<DashboardV3BookingTabKey, string> = {
  active: "/bookings",
  start_today: "/bookings",
  end_today: "/bookings",
  overdue: "/bookings?filter=late",
};

function renderDateContext(tabKey: DashboardV3BookingTabKey, item: DashboardV3BookingTabItem) {
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  if (tabKey === "start_today" && startDate) {
    return `Départ à ${formatTime(startDate)}`;
  }

  if (tabKey === "end_today" && endDate) {
    return `Retour à ${formatTime(endDate)}`;
  }

  if (tabKey === "overdue" && endDate) {
    return `Retour prévu le ${formatDate(endDate)}`;
  }

  if (item.isOverdue && endDate) {
    return `En retard depuis le ${formatDate(endDate)}`;
  }

  if (endDate) {
    return `Retour le ${formatDate(endDate)}`;
  }

  return "En cours";
}

function BookingRow({
  item,
  tabKey,
}: {
  item: DashboardV3BookingTabItem;
  tabKey: DashboardV3BookingTabKey;
}) {
  return (
    <Link
      href={item.detailsHref}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{item.customerName}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <CarFront className="h-3.5 w-3.5" />
            <span className="truncate">
              {item.vehicleLabel} • {item.plate}
            </span>
          </p>
        </div>
        {item.isOverdue && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
            <TriangleAlert className="h-3 w-3" />
            En retard
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {renderDateContext(tabKey, item)}
        </span>
        {item.remainingAmount > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
            Reste {formatCurrency(item.remainingAmount)}
          </span>
        )}
      </div>
    </Link>
  );
}

function TabPanel({ tab }: { tab: DashboardV3BookingTab }) {
  if (tab.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {EMPTY_MESSAGES[tab.key]}
      </div>
    );
  }

  const visibleItems = tab.items.slice(0, MAX_ITEMS_PER_TAB);
  const isTruncated = tab.count > visibleItems.length;

  return (
    <div className="space-y-3">
      {visibleItems.map((item) => (
        <BookingRow key={`${tab.key}-${item.id}`} item={item} tabKey={tab.key} />
      ))}
      {isTruncated && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            {visibleItems.length} sur {tab.count} affichés
          </p>
          <Link
            href={TAB_HREFS[tab.key]}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition hover:text-slate-900"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function ActiveBookingsTabs({ activeBookings }: ActiveBookingsTabsProps) {
  const defaultTab = activeBookings.defaultTab ?? "active";

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Réservations actives</h3>
        <p className="text-xs text-slate-500">Vue rapide des dossiers à suivre aujourd&apos;hui</p>
      </div>

      <div className="px-5 py-4">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl border border-slate-200 bg-slate-50 p-1">
            {activeBookings.tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-white"
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {activeBookings.tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="space-y-3">
              <TabPanel tab={tab} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
