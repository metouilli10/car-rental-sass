import { getCaisseByDate } from "@/lib/dashboard/caisse";
import { CashFlowSummary } from "./CashFlowSummary";
import { format } from "date-fns";

export async function CashFlowSummaryWrapper({ agencyId }: { agencyId: string }) {
  const now = new Date();
  const caisse = await getCaisseByDate(agencyId, now);
  const transactions = caisse.movements.map((movement) => ({
    id: movement.id,
    type: movement.direction === "in" ? "in" as const : "out" as const,
    category: movement.type,
    amount: movement.amount,
    customerName: movement.customerName,
    time: format(new Date(movement.happenedAt), "HH:mm"),
  }));

  return (
    <CashFlowSummary
      cashEntrees={caisse.cashEntrees}
      cashSorties={caisse.cashSorties}
      cashSolde={caisse.cashSolde}
      resultatNet={caisse.resultatNet}
      transactions={transactions}
    />
  );
}
