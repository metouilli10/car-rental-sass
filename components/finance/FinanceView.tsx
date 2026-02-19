"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceKpis } from "@/components/finance/kpis";
import { IncomeTable, type IncomeRow } from "@/components/finance/IncomeTable";
import { ExpensesTable, type ExpenseRow } from "@/components/finance/ExpensesTable";
import { DepositsTable, type DepositRow } from "@/components/finance/DepositsTable";
import { AddExpenseDialog } from "@/components/finance/AddExpenseDialog";

type FinanceViewProps = {
  kpis: {
    revenueMonth: number;
    expensesMonth: number;
    netProfit: number;
    cashInHand: number;
    depositsHeld: number;
  };
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  deposits: DepositRow[];
  vehicles: Array<{ id: string; make: string; model: string; plate: string }>;
};

export function FinanceView({ kpis, incomes, expenses, deposits, vehicles }: FinanceViewProps) {
  return (
    <div className="space-y-6">
      <FinanceKpis
        revenueMonth={kpis.revenueMonth}
        expensesMonth={kpis.expensesMonth}
        netProfit={kpis.netProfit}
        cashInHand={kpis.cashInHand}
        depositsHeld={kpis.depositsHeld}
      />

      <Tabs defaultValue="apercu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apercu">Apercu</TabsTrigger>
          <TabsTrigger value="revenus">Revenus</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="cautions">Cautions</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Derniers revenus</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <IncomeTable rows={incomes} compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Dernieres charges</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ExpensesTable rows={expenses} compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenus">
          <IncomeTable rows={incomes} />
        </TabsContent>

        <TabsContent value="charges" className="space-y-4">
          <div className="flex items-center justify-end">
            <AddExpenseDialog vehicles={vehicles} />
          </div>
          <ExpensesTable rows={expenses} />
        </TabsContent>

        <TabsContent value="cautions">
          <DepositsTable rows={deposits} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
