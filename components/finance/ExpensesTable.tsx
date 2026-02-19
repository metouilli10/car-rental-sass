"use client";

import { ExpenseCategory, PaymentType } from "@prisma/client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
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
import { formatCurrency, formatDate } from "@/lib/utils";

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
};

export function ExpensesTable({ rows, compact = false }: ExpensesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const displayedRows = compact ? rows.slice(0, 6) : rows;

  const onDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteExpense(id);
      if ("error" in result) {
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
    <div className="rounded-lg border border-border/70">
      <div className="max-h-[540px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Methode</TableHead>
              <TableHead>Vehicule</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-[90px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/35">
                <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{expenseCategoryLabel[row.category]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{paymentMethodLabel[row.method]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.vehicle
                    ? `${row.vehicle.make} ${row.vehicle.model} (${row.vehicle.plate})`
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">
                  {row.note || "-"}
                </TableCell>
                <TableCell>
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
      </div>
    </div>
  );
}
