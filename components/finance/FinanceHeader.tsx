"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarRange, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FinanceRange = "today" | "7d" | "month" | "quarter" | "custom";

type FinanceHeaderProps = {
  range: FinanceRange;
  from?: string;
  to?: string;
  onAddExpense: () => void;
};

const rangeItems: Array<{ value: FinanceRange; label: string }> = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "custom", label: "Personnalise" },
];

export function FinanceHeader({ range, from, to, onAddExpense }: FinanceHeaderProps) {
  const router = useRouter();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const defaultDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [fromDate, setFromDate] = useState(from || defaultDate);
  const [toDate, setToDate] = useState(to || defaultDate);

  useEffect(() => {
    setFromDate(from || defaultDate);
    setToDate(to || defaultDate);
  }, [from, to, defaultDate]);

  const pushRange = (nextRange: Exclude<FinanceRange, "custom">) => {
    const params = new URLSearchParams();
    params.set("range", nextRange);
    router.push(`/finance?${params.toString()}`);
  };

  const onRangeChange = (nextRange: FinanceRange) => {
    if (nextRange === "custom") {
      setIsCustomOpen(true);
      return;
    }
    pushRange(nextRange);
  };

  const onApplyCustomRange = () => {
    if (!fromDate || !toDate || fromDate > toDate) return;
    const params = new URLSearchParams();
    params.set("range", "custom");
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/finance?${params.toString()}`);
    setIsCustomOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-[1.75rem] font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">Suivez revenus, charges et cautions en un seul endroit</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
            {rangeItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onRangeChange(item.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
                  range === item.value
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={onAddExpense}
            className="h-10 rounded-xl px-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une charge
          </Button>
        </div>
      </div>

      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Periode personnalisee
            </DialogTitle>
            <DialogDescription>Choisissez un intervalle de dates pour filtrer la finance.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="finance-from-date">Du</Label>
              <Input
                id="finance-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="finance-to-date">Au</Label>
              <Input
                id="finance-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCustomOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={onApplyCustomRange} disabled={!fromDate || !toDate || fromDate > toDate}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
