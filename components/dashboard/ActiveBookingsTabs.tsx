"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CarFront, TriangleAlert } from "lucide-react";
import type {
  DashboardV3ActiveBookingsDTO,
  DashboardV3BookingTab,
  DashboardV3BookingTabItem,
  DashboardV3BookingTabKey,
} from "@/lib/dashboard/types";
import { getReservationTone } from "@/lib/reservations/presentation";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n/i18n-context";
import { withLocalePath } from "@/lib/i18n/config";

interface ActiveBookingsTabsProps {
  activeBookings: DashboardV3ActiveBookingsDTO;
}

const MAX_ITEMS_PER_TAB = 3;

const TAB_HREFS: Record<DashboardV3BookingTabKey, string> = {
  active: "/bookings",
  start_today: "/bookings",
  end_today: "/bookings",
  overdue: "/bookings?filter=late",
};

const EMPTY_PATH: Record<DashboardV3BookingTabKey, string> = {
  active: "dashboard.bookingTabs.emptyActive",
  start_today: "dashboard.bookingTabs.emptyStartToday",
  end_today: "dashboard.bookingTabs.emptyEndToday",
  overdue: "dashboard.bookingTabs.emptyOverdue",
};

const TAB_LABEL_PATH: Record<DashboardV3BookingTabKey, string> = {
  active: "dashboard.bookingTabs.active",
  start_today: "dashboard.bookingTabs.startToday",
  end_today: "dashboard.bookingTabs.endToday",
  overdue: "dashboard.bookingTabs.overdue",
};

function renderDateContext(
  t: (path: string, vars?: Record<string, string | number>) => string,
  tabKey: DashboardV3BookingTabKey,
  item: DashboardV3BookingTabItem
) {
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  if (tabKey === "start_today" && startDate) {
    return t("dashboard.bookingTabs.departAt", { time: formatTime(startDate) });
  }

  if (tabKey === "end_today" && endDate) {
    return t("dashboard.bookingTabs.returnAt", { time: formatTime(endDate) });
  }

  if (tabKey === "overdue" && endDate) {
    return t("dashboard.bookingTabs.returnExpectedOn", { date: formatDate(endDate) });
  }

  if (item.isOverdue && endDate) {
    return t("dashboard.bookingTabs.lateSince", { date: formatDate(endDate) });
  }

  if (endDate) {
    return t("dashboard.bookingTabs.returnOn", { date: formatDate(endDate) });
  }

  return t("dashboard.bookingTabs.inProgress");
}

function BookingRow({
  item,
  tabKey,
}: {
  item: DashboardV3BookingTabItem;
  tabKey: DashboardV3BookingTabKey;
}) {
  const { locale, t } = useI18n();
  const statusTone = getReservationTone(item.status);

  return (
    <Link
      href={withLocalePath(locale, item.detailsHref)}
      className="group flex flex-col gap-3 rounded-xl border border-subtle bg-[hsl(var(--surface-muted))] p-3 transition-all duration-150 hover:border-default hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{item.customerName}</p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <CarFront className="h-3.5 w-3.5" />
            <span className="truncate">
              {item.vehicleLabel} • {item.plate}
            </span>
          </p>
        </div>
        <Badge variant={statusTone.variant} className="shrink-0">
          {statusTone.label}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {renderDateContext(t, tabKey, item)}
        </span>
        {item.isOverdue && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 font-medium text-red-700">
            <TriangleAlert className="h-3 w-3" />
            {t("dashboard.bookingTabs.late")}
          </span>
        )}
        {item.remainingAmount > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
            {t("dashboard.bookingTabs.remainingAmount", {
              amount: formatCurrency(item.remainingAmount),
            })}
          </span>
        )}
      </div>
    </Link>
  );
}

function TabPanel({ tab }: { tab: DashboardV3BookingTab }) {
  const { locale, t } = useI18n();

  if (tab.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
        {t(EMPTY_PATH[tab.key])}
      </div>
    );
  }

  const visibleItems = tab.items.slice(0, MAX_ITEMS_PER_TAB);
  const isTruncated = tab.count > visibleItems.length;

  return (
    <div className="space-y-2">
      {visibleItems.map((item) => (
        <BookingRow key={`${tab.key}-${item.id}`} item={item} tabKey={tab.key} />
      ))}
      {isTruncated && (
        <div className="flex items-center justify-between rounded-xl border border-subtle bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            {t("dashboard.bookingTabs.showingCount", {
              shown: visibleItems.length,
              total: tab.count,
            })}
          </p>
          <Link
            href={withLocalePath(locale, TAB_HREFS[tab.key])}
            className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-[#0f172a] transition hover:bg-white"
          >
            {t("dashboard.bookingTabs.seeMore")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function ActiveBookingsTabs({ activeBookings }: ActiveBookingsTabsProps) {
  const { t } = useI18n();
  const defaultTab = activeBookings.defaultTab ?? "active";

  return (
    <section className="dashboard-panel">
      <div className="border-b border-subtle px-4 py-4">
        <h3 className="section-title">{t("dashboard.bookingTabs.sectionTitle")}</h3>
        <p className="meta-text mt-1">{t("dashboard.bookingTabs.sectionSubtitle")}</p>
      </div>

      <div className="px-4 py-4">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-subtle bg-slate-50/80 p-1">
            {activeBookings.tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-none"
              >
                {t(TAB_LABEL_PATH[tab.key])}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] tabular-nums text-slate-500">
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
