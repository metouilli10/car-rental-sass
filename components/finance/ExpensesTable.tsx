"use client";

import { ExpenseCategory, PaymentType } from "@prisma/client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
import { FinanceTableShell } from "@/components/finance/FinanceTableShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expenseCategoryLabel, paymentMethodLabel } from "@/components/finance/constants";
import { formatDate } from "@/lib/utils";
import { formatMAD } from "@/lib/format";

export type ExpenseRow = {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  method: PaymentType;
  note: string | null;
  receiptUrl: string | null;
  vehicle: { id: string; make: string; model: string; plate: string } | null;
};

type ExpensesTableProps = {
  rows: ExpenseRow[];
  compact?: boolean;
  onDeleteOptimistic?: (id: string) => void;
  onDeleteRevert?: (row: ExpenseRow) => void;
};

export function ExpensesTable({
  rows,
  compact = false,
  onDeleteOptimistic,
  onDeleteRevert,
}: ExpensesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const displayedRows = compact ? rows.slice(0, 6) : rows;

  const onDelete = (id: string) => {
    const rowToDelete = rows.find((row) => row.id === id);
    onDeleteOptimistic?.(id);

    startTransition(async () => {
      const result = await deleteExpense(id);
      if ("error" in result) {
        if (rowToDelete) onDeleteRevert?.(rowToDelete);
        toast.error(result.error);
        return;
      }
      toast.success("Charge supprimee");
      router.refresh();
    });
  };

  if (displayedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Aucune charge enregistree
      </div>
    );
  }

  return (
    <FinanceTableShell compact={compact}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="px-3 py-2 text-xs font-medium">Date</TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium">Categorie</TableHead>
            <TableHead className="px-3 py-2 text-right text-xs font-medium">Montant</TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium">Methode</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium lg:table-cell">Vehicule</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium xl:table-cell">Note</TableHead>
            <TableHead className="w-[90px] px-3 py-2 text-xs font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/35">
              <TableCell className="px-3 py-2.5 text-muted-foreground">{formatDate(row.date)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <Badge variant="secondary" className="px-2.5 py-0.5">
                  {expenseCategoryLabel[row.category]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMAD(row.amount)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-700"
                >
                  {paymentMethodLabel[row.method]}
                </Badge>
              </TableCell>
              <TableCell className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                {row.vehicle ? `${row.vehicle.make} ${row.vehicle.model} (${row.vehicle.plate})` : "-"}
              </TableCell>
              <TableCell className="hidden max-w-[280px] truncate px-3 py-2.5 text-muted-foreground xl:table-cell">
                {row.note || "-"}
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isPending}
                  onClick={() => onDelete(row.id)}
                  aria-label="Supprimer la charge"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </FinanceTableShell>
  );
}
