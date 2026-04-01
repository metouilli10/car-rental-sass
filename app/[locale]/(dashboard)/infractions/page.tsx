import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";
import { getInfractions, getInfractionCounts } from "@/lib/actions/infractions";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ShieldAlert, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INFRACTION_TYPE_LABELS,
  INFRACTION_STATUS_LABELS,
} from "@/components/infractions/infraction-constants";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { getMessages, interpolate } from "@/lib/i18n/messages";

type SearchParams = Promise<{
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

export default async function InfractionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const locale = await requireLocaleParam(params);
  const ui = getMessages(locale);
  const currentUser = await getCurrentUserAccessForPage();
  const permissions = getEffectivePermissions(
    currentUser.role,
    currentUser.permissions,
  );

  if (!permissions["infractions.view"]) {
    redirect(withLocalePath(locale, "/dashboard"));
  }

  const sp = await searchParams;
  const page = parseInt(sp.page || "1", 10);
  const status = sp.status;
  const search = sp.search;
  const from = sp.from;
  const to = sp.to;

  const [{ infractions, total, totalPages }, counts] = await Promise.all([
    getInfractions({ status, search, from, to, page, pageSize: 25 }),
    getInfractionCounts(),
  ]);

  const il = ui.pageChrome.infractionsList;
  const statusTabs = [
    { key: "", label: il.tabAll, count: counts.ALL },
    { key: "PENDING", label: il.tabPending, count: counts.PENDING },
    { key: "ASSIGNED", label: il.tabAssigned, count: counts.ASSIGNED },
    { key: "PAID", label: il.tabPaid, count: counts.PAID },
    { key: "CONTESTED", label: il.tabContested, count: counts.CONTESTED },
  ];

  const buildHref = (s?: string, q?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("search", q);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    return withLocalePath(locale, `/infractions${qs ? `?${qs}` : ""}`);
  };

  const listDescription = interpolate(
    total === 1 ? il.metaOne : il.metaOther,
    { count: total }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={il.title}
        description={listDescription}
        action={{
          label: il.newCta,
          href: withLocalePath(locale, "/infractions/new"),
        }}
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/50 p-1.5">
        {statusTabs.map((tab) => {
          const isActive = (status || "") === tab.key;
          return (
            <Link
              key={tab.key}
              href={buildHref(tab.key, search)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search bar */}
      <form action={withLocalePath(locale, "/infractions")} method="GET" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {from && <input type="hidden" name="from" value={from} />}
        {to && <input type="hidden" name="to" value={to} />}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={il.searchPlaceholder}
            className="h-10 w-full rounded-lg border border-border bg-white ps-10 pe-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-10">
          {il.searchButton}
        </Button>
      </form>

      {infractions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShieldAlert className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-2 font-medium text-muted-foreground">{il.emptyTitle}</p>
            <p className="mb-6 text-sm text-muted-foreground/80">{il.emptyHint}</p>
            <Button asChild>
              <Link href={withLocalePath(locale, "/infractions/new")}>{il.newCta}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="space-y-3 md:hidden">
            {infractions.map((inf) => (
              <Link
                key={inf.id}
                href={withLocalePath(locale, `/infractions/${inf.id}`)}
                className="block"
              >
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatDate(inf.date)}
                            {inf.time && ` ${il.timeAt} ${inf.time}`}
                          </span>
                          <StatusBadge status={inf.status} />
                        </div>
                        <p className="text-sm font-medium">
                          <span className="font-mono">{inf.vehicle.plate}</span>
                          {" — "}
                          {inf.vehicle.make} {inf.vehicle.model}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {INFRACTION_TYPE_LABELS[inf.type] || inf.type}
                          </span>
                          {inf.clientName && (
                            <span className="truncate">{inf.clientName}</span>
                          )}
                          {inf.amount != null && inf.amount > 0 && (
                            <span className="font-medium text-red-600">
                              {formatCurrency(inf.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="mt-2 h-5 w-5 flex-shrink-0 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thDate}
                      </th>
                      <th className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thVehicle}
                      </th>
                      <th className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thType}
                      </th>
                      <th className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thClient}
                      </th>
                      <th className="p-3 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thAmount}
                      </th>
                      <th className="p-3 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {il.thStatus}
                      </th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {infractions.map((inf) => (
                      <tr
                        key={inf.id}
                        className="transition-colors duration-200 hover:bg-muted/40"
                      >
                        <td className="p-3 text-sm">
                          {formatDate(inf.date)}
                          {inf.time && (
                            <span className="ml-1 text-muted-foreground">
                              {inf.time}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {inf.vehicle.make} {inf.vehicle.model}{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            {inf.vehicle.plate}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {INFRACTION_TYPE_LABELS[inf.type] || inf.type}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {inf.clientName || (
                            <span className="text-muted-foreground/60">{il.unassigned}</span>
                          )}
                        </td>
                        <td className="p-3 text-end text-sm">
                          {inf.amount != null && inf.amount > 0 ? (
                            <span className="font-medium text-red-600">
                              {formatCurrency(inf.amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={inf.status} />
                        </td>
                        <td className="p-3">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={withLocalePath(locale, `/infractions/${inf.id}`)}>
                              {il.view}
                              <ChevronRight className="ms-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/infractions"
              searchParams={{ status, search, from, to }}
            />
          )}
        </>
      )}
    </div>
  );
}
