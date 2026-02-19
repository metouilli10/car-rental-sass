"use client";

import { PaymentStatus, PaymentType } from "@prisma/client";
import { MarkPaymentButton } from "@/components/payments/mark-payment-button";
import { FinanceTableShell } from "@/components/finance/FinanceTableShell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentMethodLabel } from "@/components/finance/constants";
import { formatDate } from "@/lib/utils";
import { formatMAD } from "@/lib/format";

export type IncomeRow = {
  id: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  customerName: string;
  vehicleName: string;
};

type IncomeTableProps = {
  rows: IncomeRow[];
  compact?: boolean;
};

export function IncomeTable({ rows, compact = false }: IncomeTableProps) {
  const displayedRows = compact ? rows.slice(0, 6) : rows;

  const statusBadgeClass = (status: PaymentStatus) => {
    if (status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
  };

  if (displayedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Aucun revenu enregistre
      </div>
    );
  }

  return (
    <FinanceTableShell compact={compact}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="px-3 py-2 text-xs font-medium">Client</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium md:table-cell">Vehicule</TableHead>
            <TableHead className="px-3 py-2 text-right text-xs font-medium">Montant</TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium">Methode</TableHead>
            <TableHead className="px-3 py-2 text-xs font-medium">Statut</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium lg:table-cell">Date</TableHead>
            <TableHead className="w-[110px] px-3 py-2 text-xs font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/35">
              <TableCell className="px-3 py-2.5 font-medium">{row.customerName}</TableCell>
              <TableCell className="hidden px-3 py-2.5 md:table-cell">{row.vehicleName}</TableCell>
              <TableCell className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMAD(row.amount)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-700"
                >
                  {paymentMethodLabel[row.type]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <Badge variant="outline" className={`px-2.5 py-0.5 ${statusBadgeClass(row.status)}`}>
                  {row.status === "PAID" ? "Paye" : row.status === "PENDING" ? "En attente" : "Rembourse"}
                </Badge>
              </TableCell>
              <TableCell className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                {formatDate(row.paidAt ?? row.createdAt)}
              </TableCell>
              <TableCell className="px-3 py-2.5">
                {row.status === "PENDING" ? (
                  <MarkPaymentButton paymentId={row.id} currentAmount={row.amount} />
                ) : (
                  <span className="text-xs font-medium text-emerald-700">Recu</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </FinanceTableShell>
  );
}
