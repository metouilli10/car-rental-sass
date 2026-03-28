import { Suspense } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";
import { getCaisseByDate, getCaisseByDateRange } from "@/lib/dashboard/caisse";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaisseDateNav } from "./CaisseDateNav";
import { CaisseMovementsTable } from "./CaisseMovementsTable";
import { AddCaisseSortieDialog } from "./AddCaisseSortieDialog";

type CaissePageProps = {
  searchParams: Promise<{ date?: string; month?: string }>;
};

function parseDateParam(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/** Parse month param YYYY-MM; returns start of month or null if invalid. */
function parseMonthParam(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const d = new Date(value + "-01");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function CaissePage({ searchParams }: CaissePageProps) {
  const currentUser = await getCurrentUserAccessForPage();

  const params = await searchParams;
  const today = new Date();
  const monthParam = parseMonthParam(params.month);
  const isMonthView = !!monthParam;

  const agencyId = currentUser.agencyId;
  const permissions = getEffectivePermissions(
    currentUser.role,
    currentUser.permissions,
  );

  if (!permissions["caisse.view"]) {
    redirect("/dashboard");
  }

  let data: Awaited<ReturnType<typeof getCaisseByDate>>;
  let selectedDate: Date;
  let selectedMonth: Date | null = null;

  if (isMonthView) {
    const rangeStart = startOfMonth(monthParam!);
    const rangeEnd = endOfMonth(monthParam!);
    data = await getCaisseByDateRange(agencyId, rangeStart, rangeEnd);
    selectedDate = rangeStart; // for AddCaisseSortieDialog default
    selectedMonth = rangeStart;
  } else {
    const requested = parseDateParam(params.date);
    selectedDate = requested && requested <= today ? requested : today;
    data = await getCaisseByDate(agencyId, selectedDate);
  }

  const headerTitle = isMonthView
    ? `Caisse — ${format(selectedMonth!, "MMMM yyyy", { locale: fr })}`
    : `Caisse — ${format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}`;
  const subtitle = isMonthView
    ? "Mouvements du mois"
    : selectedDate.getTime() === today.getTime()
      ? "Mouvements du jour"
      : `Mouvements du ${format(selectedDate, "d MMMM yyyy", { locale: fr })}`;

  const serializedMovements = data.movements.map((m) => ({
    ...m,
    happenedAt: m.happenedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{headerTitle}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Suspense fallback={<div className="h-9 w-40 animate-pulse rounded bg-muted" />}>
          <CaisseDateNav
            viewMode={isMonthView ? "month" : "day"}
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
            today={today}
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-semibold">Entrées</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-emerald-600">
              +{formatCurrency(data.cashEntrees)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-base font-semibold">Sorties</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-red-600">
              -{formatCurrency(data.cashSorties)}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <Wallet className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-base font-semibold">Résultat net</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold tabular-nums ${
                data.resultatNet >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {data.resultatNet >= 0 ? "+" : ""}
              {formatCurrency(data.resultatNet)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Paiements location + cautions retenues − remboursements − charges cash
            </p>
            {data.toCollectToday !== undefined && (
              <p className="mt-2 text-xs text-muted-foreground">
                À encaisser aujourd&apos;hui : {formatCurrency(data.toCollectToday)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Mouvements
          </h2>
          <AddCaisseSortieDialog
            defaultDate={format(isMonthView ? selectedMonth! : selectedDate, "yyyy-MM-dd")}
            trigger={
              <Button size="sm" className="gap-2 shrink-0">
                <MinusCircle className="h-4 w-4" />
                Ajouter une sortie
              </Button>
            }
          />
        </div>
        <CaisseMovementsTable movements={serializedMovements} showDateColumn={isMonthView} />
      </section>
    </div>
  );
}
