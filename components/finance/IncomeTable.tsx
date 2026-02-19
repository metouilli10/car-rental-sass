"use client";

import { PaymentStatus, PaymentType } from "@prisma/client";
import { MarkPaymentButton } from "@/components/payments/mark-payment-button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentMethodLabel } from "@/components/finance/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  if (displayedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Aucun revenu enregistre
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70">
      <div className="max-h-[540px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Vehicule</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Methode</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[110px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/35">
                <TableCell className="font-medium">{row.customerName}</TableCell>
                <TableCell>{row.vehicleName}</TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                <TableCell>{paymentMethodLabel[row.type]}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(row.paidAt ?? row.createdAt)}
                </TableCell>
                <TableCell>
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
      </div>
    </div>
  );
}
