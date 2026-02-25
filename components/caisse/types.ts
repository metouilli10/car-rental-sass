import type { CaisseMovement } from "@/lib/dashboard/caisse";

export type SerializedMovement = Omit<CaisseMovement, "happenedAt"> & {
  happenedAt: string;
};
