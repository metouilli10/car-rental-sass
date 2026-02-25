"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { SerializedMovement } from "./types";

type MovementsTableProps = {
  movements: SerializedMovement[];
  showDateColumn?: boolean;
  emptyMessage?: string;
};

export function MovementsTable({
  movements,
  showDateColumn = false,
  emptyMessage,
}: MovementsTableProps) {
  if (movements.length === 0 && emptyMessage) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-card py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {showDateColumn && (
              <TableHead className="py-3 px-2 sm:px-4">Date</TableHead>
            )}
            <TableHead className="py-3 px-2 sm:px-4">Heure</TableHead>
            <TableHead className="min-w-0 py-3 px-2 sm:px-4 truncate">Type</TableHead>
            <TableHead className="min-w-0 py-3 px-2 sm:px-4 truncate">Client</TableHead>
            <TableHead className="hidden py-3 px-2 text-muted-foreground sm:table-cell sm:px-4">
              Réf
            </TableHead>
            <TableHead className="w-[90px] py-3 px-2 text-right whitespace-nowrap sm:px-4">
              Montant
            </TableHead>
            <TableHead className="w-10 py-3 px-2 sm:px-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => (
            <TableRow key={m.id}>
              {showDateColumn && (
                <TableCell className="font-mono py-3 px-2 text-muted-foreground sm:px-4">
                  {format(new Date(m.happenedAt), "dd/MM")}
                </TableCell>
              )}
              <TableCell className="font-mono py-3 px-2 text-muted-foreground sm:px-4">
                {format(new Date(m.happenedAt), "HH:mm")}
              </TableCell>
              <TableCell className="min-w-0 py-3 px-2 sm:px-4 truncate" title={m.label}>
                {m.label}
              </TableCell>
              <TableCell className="min-w-0 py-3 px-2 font-medium sm:px-4 truncate" title={m.customerName}>
                {m.customerName}
              </TableCell>
              <TableCell className="hidden py-3 px-2 text-xs text-muted-foreground sm:table-cell sm:px-4">
                {m.reference ?? "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "py-3 px-2 text-right font-semibold tabular-nums whitespace-nowrap sm:px-4",
                  m.direction === "in" ? "text-emerald-600" : "text-red-600"
                )}
              >
                {m.direction === "in" ? "+" : "-"}
                {formatCurrency(m.amount)}
              </TableCell>
              <TableCell className="py-3 px-2 sm:px-4">
                {m.bookingId ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Ouvrir la réservation"
                  >
                    <Link href={`/bookings/${m.bookingId}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
