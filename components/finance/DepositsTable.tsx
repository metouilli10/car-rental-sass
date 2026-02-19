"use client";

import { DepositStatus } from "@prisma/client";
import { UpdateDepositButton } from "@/components/payments/update-deposit-button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export type DepositRow = {
  id: string;
  amount: number;
  status: DepositStatus;
  heldAt: Date;
  returnedAt: Date | null;
  customerName: string;
  vehicleName: string;
};

type DepositsTableProps = {
  rows: DepositRow[];
  compact?: boolean;
};

export function DepositsTable({ rows, compact = false }: DepositsTableProps) {
  const displayedRows = compact ? rows.slice(0, 6) : rows;

  if (displayedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Aucune caution enregistree
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
              <TableHead>Statut</TableHead>
              <TableHead>Date retenue</TableHead>
              <TableHead>Date retour</TableHead>
              <TableHead className="w-[130px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/35">
                <TableCell className="font-medium">{row.customerName}</TableCell>
                <TableCell>{row.vehicleName}</TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.heldAt)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.returnedAt ? formatDate(row.returnedAt) : "-"}
                </TableCell>
                <TableCell>
                  {row.status === "HELD" ? (
                    <UpdateDepositButton depositId={row.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Verrouille</span>
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
