"use client";

import { DepositStatus } from "@prisma/client";
import { UpdateDepositButton } from "@/components/payments/update-deposit-button";
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
import { formatDate } from "@/lib/utils";
import { formatMAD } from "@/lib/format";

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
  const statusBadgeClass = (status: DepositStatus) => {
    if (status === "RETURNED") return "border-emerald-300 bg-transparent text-emerald-700";
    if (status === "HELD") return "border-amber-200 bg-amber-50 text-amber-700";
    if (status === "PARTIAL_RETURNED") return "border-sky-200 bg-sky-50 text-sky-700";
    return "border-rose-200 bg-rose-50 text-rose-700";
  };

  if (displayedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Aucune caution enregistree
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
            <TableHead className="px-3 py-2 text-xs font-medium">Statut</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium lg:table-cell">Date retenue</TableHead>
            <TableHead className="hidden px-3 py-2 text-xs font-medium xl:table-cell">Date retour</TableHead>
            <TableHead className="w-[130px] px-3 py-2 text-xs font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/35">
              <TableCell className="px-3 py-2.5 font-medium">{row.customerName}</TableCell>
              <TableCell className="hidden px-3 py-2.5 md:table-cell">{row.vehicleName}</TableCell>
              <TableCell className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMAD(row.amount)}</TableCell>
              <TableCell className="px-3 py-2.5">
                <Badge variant="outline" className={`px-2.5 py-0.5 ${statusBadgeClass(row.status)}`}>
                  {row.status === "HELD"
                    ? "Retenue"
                    : row.status === "PARTIAL_RETURNED"
                      ? "Partiel"
                      : row.status === "RETURNED"
                        ? "Retournee"
                        : "Confisquee"}
                </Badge>
              </TableCell>
              <TableCell className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">
                {formatDate(row.heldAt)}
              </TableCell>
              <TableCell className="hidden px-3 py-2.5 text-muted-foreground xl:table-cell">
                {row.returnedAt ? formatDate(row.returnedAt) : "-"}
              </TableCell>
              <TableCell className="px-3 py-2.5">
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
    </FinanceTableShell>
  );
}
