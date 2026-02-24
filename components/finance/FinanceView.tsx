"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentStatus, PaymentType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinanceHeader } from "@/components/finance/FinanceHeader";
import { KpiGrid } from "@/components/finance/KpiGrid";
import { IncomeTable, type IncomeRow } from "@/components/finance/IncomeTable";
import { ExpensesTable, type ExpenseRow } from "@/components/finance/ExpensesTable";
import { DepositsTable, type DepositRow } from "@/components/finance/DepositsTable";
import { AddExpenseDialog } from "@/components/finance/AddExpenseDialog";
import { EmptyStateCard } from "@/components/finance/EmptyStateCard";
import { paymentMethodLabel } from "@/components/finance/constants";
import { formatMAD } from "@/lib/format";

type FinanceTabValue = "apercu" | "revenus" | "charges" | "cautions";

type FinanceViewProps = {
  defaultTab?: FinanceTabValue;
  period: {
    range: "today" | "7d" | "month" | "quarter" | "custom";
    label: string;
    from?: string;
    to?: string;
  };
  kpis: {
    revenuePeriod: number;
    expensesPeriod: number;
    netProfit: number;
    cashInHand: number;
    depositsHeld: number;
  };
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  deposits: DepositRow[];
  expenseBreakdown: Array<{ key: string; label: string; amount: number; percentage: number }>;
  paymentBreakdown: Array<{ key: "CASH" | "CARD" | "TRANSFER"; label: string; amount: number; percentage: number }>;
  vehicles: Array<{ id: string; make: string; model: string; plate: string }>;
};

function BreakdownCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ key: string; label: string; amount: number; percentage: number }>;
}) {
  return (
    <Card className="border-border/70 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ajoutez des charges pour analyser vos postes de depenses.
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">{formatMAD(row.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${Math.min(100, Math.max(2, row.percentage))}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{row.percentage.toFixed(1)}%</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceView({
  defaultTab,
  period,
  kpis,
  incomes,
  expenses,
  deposits,
  expenseBreakdown,
  paymentBreakdown,
  vehicles,
}: FinanceViewProps) {
  const [activeTab, setActiveTab] = useState<FinanceTabValue>(defaultTab ?? "apercu");
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expensesRows, setExpensesRows] = useState(expenses);

  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeMethod, setIncomeMethod] = useState<"ALL" | PaymentType>("ALL");
  const [incomeStatus, setIncomeStatus] = useState<"ALL" | PaymentStatus>("ALL");

  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseMethod, setExpenseMethod] = useState<"ALL" | "CASH" | "CARD" | "TRANSFER">("ALL");

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setExpensesRows(expenses);
  }, [expenses]);

  const filteredIncomes = useMemo(() => {
    const q = incomeSearch.trim().toLowerCase();
    return incomes.filter((row) => {
      const matchesSearch =
        q.length === 0 ||
        row.customerName.toLowerCase().includes(q) ||
        row.vehicleName.toLowerCase().includes(q);
      const matchesMethod = incomeMethod === "ALL" || row.type === incomeMethod;
      const matchesStatus = incomeStatus === "ALL" || row.status === incomeStatus;
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [incomeSearch, incomeMethod, incomeStatus, incomes]);

  const filteredExpenses = useMemo(() => {
    const q = expenseSearch.trim().toLowerCase();
    return expensesRows.filter((row) => {
      const vehicleText = row.vehicle ? `${row.vehicle.make} ${row.vehicle.model} ${row.vehicle.plate}` : "";
      const matchesSearch =
        q.length === 0 ||
        row.note?.toLowerCase().includes(q) ||
        vehicleText.toLowerCase().includes(q);
      const matchesMethod = expenseMethod === "ALL" || row.method === expenseMethod;
      return matchesSearch && matchesMethod;
    });
  }, [expenseSearch, expenseMethod, expensesRows]);

  const recentIncomes = useMemo(() => incomes.slice(0, 6), [incomes]);
  const recentExpenses = useMemo(() => expensesRows.slice(0, 6), [expensesRows]);

  const onOptimisticExpenseCreate = (row: ExpenseRow) => {
    setExpensesRows((prev) => [row, ...prev]);
  };

  const onOptimisticExpenseRevert = (id: string) => {
    setExpensesRows((prev) => prev.filter((row) => row.id !== id));
  };

  const onDeleteExpenseOptimistic = (id: string) => {
    setExpensesRows((prev) => prev.filter((row) => row.id !== id));
  };

  const onDeleteExpenseRevert = (row: ExpenseRow) => {
    setExpensesRows((prev) => [row, ...prev]);
  };

  return (
    <div className="space-y-6">
      <FinanceHeader
        range={period.range}
        from={period.from}
        to={period.to}
        onAddExpense={() => setAddExpenseOpen(true)}
      />

      <AddExpenseDialog
        vehicles={vehicles}
        open={isAddExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        hideTrigger
        onOptimisticCreate={onOptimisticExpenseCreate}
        onOptimisticRevert={onOptimisticExpenseRevert}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FinanceTabValue)} className="space-y-4">
        <TabsList className="inline-flex h-auto rounded-xl border border-border/70 bg-muted/40 p-1">
          <TabsTrigger
            value="apercu"
            className="rounded-lg px-4 py-2 transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Apercu
          </TabsTrigger>
          <TabsTrigger
            value="revenus"
            className="rounded-lg px-4 py-2 transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Revenus
          </TabsTrigger>
          <TabsTrigger
            value="charges"
            className="rounded-lg px-4 py-2 transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Charges
          </TabsTrigger>
          <TabsTrigger
            value="cautions"
            className="rounded-lg px-4 py-2 transition-all duration-200 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Cautions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-5">
          <KpiGrid
            periodLabel={period.label}
            revenuePeriod={kpis.revenuePeriod}
            expensesPeriod={kpis.expensesPeriod}
            netProfit={kpis.netProfit}
            cashInHand={kpis.cashInHand}
            depositsHeld={kpis.depositsHeld}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="Repartition des charges"
              subtitle="Analyse par categorie pour cibler les postes a optimiser."
              rows={expenseBreakdown}
            />
            <BreakdownCard
              title="Repartition des paiements"
              subtitle="Suivi des encaissements Cash / Carte / Virement."
              rows={paymentBreakdown}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle>Derniers revenus</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <IncomeTable rows={recentIncomes} compact />
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle>Dernieres charges</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentExpenses.length > 0 ? (
                  <ExpensesTable
                    rows={recentExpenses}
                    compact
                    onDeleteOptimistic={onDeleteExpenseOptimistic}
                    onDeleteRevert={onDeleteExpenseRevert}
                  />
                ) : (
                  <div className="p-4">
                    <EmptyStateCard onAddExpense={() => setAddExpenseOpen(true)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenus" className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-3 md:grid-cols-3">
            <Input
              value={incomeSearch}
              onChange={(event) => setIncomeSearch(event.target.value)}
              placeholder="Rechercher client ou vehicule..."
            />
            <Select value={incomeMethod} onValueChange={(value) => setIncomeMethod(value as "ALL" | PaymentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Methode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les methodes</SelectItem>
                <SelectItem value="CASH">{paymentMethodLabel.CASH}</SelectItem>
                <SelectItem value="CARD">{paymentMethodLabel.CARD}</SelectItem>
                <SelectItem value="TRANSFER">{paymentMethodLabel.TRANSFER}</SelectItem>
                <SelectItem value="CMI">{paymentMethodLabel.CMI}</SelectItem>
                <SelectItem value="OTHER">{paymentMethodLabel.OTHER}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={incomeStatus} onValueChange={(value) => setIncomeStatus(value as "ALL" | PaymentStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="PAID">Paye</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="REFUNDED">Rembourse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <IncomeTable rows={filteredIncomes} />
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-3 md:grid-cols-2">
            <Input
              value={expenseSearch}
              onChange={(event) => setExpenseSearch(event.target.value)}
              placeholder="Rechercher note ou vehicule..."
            />
            <Select value={expenseMethod} onValueChange={(value) => setExpenseMethod(value as typeof expenseMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Methode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les methodes</SelectItem>
                <SelectItem value="CASH">{paymentMethodLabel.CASH}</SelectItem>
                <SelectItem value="CARD">{paymentMethodLabel.CARD}</SelectItem>
                <SelectItem value="TRANSFER">{paymentMethodLabel.TRANSFER}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredExpenses.length > 0 ? (
            <ExpensesTable
              rows={filteredExpenses}
              onDeleteOptimistic={onDeleteExpenseOptimistic}
              onDeleteRevert={onDeleteExpenseRevert}
            />
          ) : (
            <EmptyStateCard onAddExpense={() => setAddExpenseOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="cautions">
          <DepositsTable rows={deposits} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
