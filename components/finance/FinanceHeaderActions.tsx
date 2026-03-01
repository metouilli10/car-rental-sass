"use client";

import { useState } from "react";
import { FinanceHeader } from "@/components/finance/FinanceHeader";
import { AddExpenseDialog } from "@/components/finance/AddExpenseDialog";

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  plate: string;
};

type FinanceHeaderActionsProps = {
  range: "today" | "7d" | "month" | "quarter" | "custom";
  from?: string;
  to?: string;
  vehicles: VehicleOption[];
};

export function FinanceHeaderActions({
  range,
  from,
  to,
  vehicles,
}: FinanceHeaderActionsProps) {
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);

  return (
    <>
      <FinanceHeader
        range={range}
        from={from}
        to={to}
        onAddExpense={() => setAddExpenseOpen(true)}
      />

      <AddExpenseDialog
        vehicles={vehicles}
        open={isAddExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        hideTrigger
      />
    </>
  );
}
