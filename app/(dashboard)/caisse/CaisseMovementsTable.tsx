"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CaisseMovement } from "@/lib/dashboard/caisse";

const FORMAT_MAD = (amount: number) =>
  new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\s/g, " ") + " MAD";

type FilterPill = "all" | "payment" | "cautions" | "refund" | "expense";

const FILTER_LABELS: Record<FilterPill, string> = {
  all: "Tous",
  payment: "Paiements",
  cautions: "Cautions",
  refund: "Remboursements",
  expense: "Charges",
};

const PILL_OPTIONS: FilterPill[] = ["all", "payment", "cautions", "refund", "expense"];

type SerializedMovement = Omit<CaisseMovement, "happenedAt"> & {
  happenedAt: string;
};

type CaisseMovementsTableProps = {
  movements: SerializedMovement[];
  showDateColumn?: boolean;
};

export function CaisseMovementsTable({
  movements,
  showDateColumn = false,
}: CaisseMovementsTableProps) {
  const [filter, setFilter] = useState<FilterPill>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = movements;
    if (filter !== "all") {
      if (filter === "cautions") {
        list = list.filter(
          (m) => m.type === "deposit_received" || m.type === "deposit_returned"
        );
      } else {
        list = list.filter((m) => m.type === filter);
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [movements, filter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {PILL_OPTIONS.map((p) => (
            <Button
              key={p}
              variant={filter === p ? "secondary" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setFilter(p)}
            >
              {FILTER_LABELS[p]}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 rounded-lg"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">
              {movements.length === 0
                ? showDateColumn
                  ? "Aucun mouvement pour ce mois."
                  : "Aucun mouvement pour ce jour."
                : "Aucun mouvement ne correspond aux filtres."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-0">
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
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      {showDateColumn && (
                        <TableCell className="font-mono py-3 px-2 text-muted-foreground sm:px-4">
                          {format(new Date(m.happenedAt), "dd/MM")}
                        </TableCell>
                      )}
                      <TableCell className="font-mono py-3 px-2 text-muted-foreground sm:px-4">
                        {format(new Date(m.happenedAt), "HH:mm")}
                      </TableCell>
                      <TableCell className="min-w-0 py-3 px-2 sm:px-4 truncate" title={m.label}>{m.label}</TableCell>
                      <TableCell className="min-w-0 py-3 px-2 font-medium sm:px-4 truncate" title={m.customerName}>
                        {m.customerName}
                      </TableCell>
                      <TableCell className="hidden py-3 px-2 text-xs text-muted-foreground sm:table-cell sm:px-4">
                        {m.reference ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-3 px-2 text-right font-semibold tabular-nums whitespace-nowrap sm:px-4",
                          m.direction === "in"
                            ? "text-emerald-600"
                            : "text-red-600"
                        )}
                      >
                        {m.direction === "in" ? "+" : "-"}
                        {FORMAT_MAD(m.amount)}
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
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Exporter CSV (bientôt)
      </p>
    </div>
  );
}
