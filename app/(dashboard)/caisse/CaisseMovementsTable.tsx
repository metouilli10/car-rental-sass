"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SerializedMovement } from "@/components/caisse/types";
import { MovementsTable } from "@/components/caisse/MovementsTable";
import { MovementsCardList } from "@/components/caisse/MovementsCardList";

type FilterPill = "all" | "payment" | "cautions" | "refund" | "expense";

const FILTER_LABELS: Record<FilterPill, string> = {
  all: "Tous",
  payment: "Paiements",
  cautions: "Cautions",
  refund: "Remboursements",
  expense: "Charges",
};

const PILL_OPTIONS: FilterPill[] = ["all", "payment", "cautions", "refund", "expense"];

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

  const emptyMessage =
    movements.length === 0
      ? showDateColumn
        ? "Aucun mouvement pour ce mois."
        : "Aucun mouvement pour ce jour."
      : "Aucun mouvement ne correspond aux filtres.";

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

      <div className="md:hidden">
        <MovementsCardList
          movements={filtered}
          showDateColumn={showDateColumn}
          emptyMessage={emptyMessage}
        />
      </div>
      <div className="hidden md:block">
        <MovementsTable
          movements={filtered}
          showDateColumn={showDateColumn}
          emptyMessage={emptyMessage}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Exporter CSV (bientôt)
      </p>
    </div>
  );
}
