"use client";

import { MovementCard } from "./MovementCard";
import type { SerializedMovement } from "./types";

type MovementsCardListProps = {
  movements: SerializedMovement[];
  showDateColumn?: boolean;
  emptyMessage: string;
};

export function MovementsCardList({
  movements,
  showDateColumn = false,
  emptyMessage,
}: MovementsCardListProps) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-card py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {movements.map((m) => (
        <MovementCard
          key={m.id}
          movement={m}
          showDate={showDateColumn}
        />
      ))}
    </div>
  );
}
