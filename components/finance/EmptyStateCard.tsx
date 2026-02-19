import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateCardProps = {
  onAddExpense: () => void;
};

export function EmptyStateCard({ onAddExpense }: EmptyStateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Receipt className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">Aucune charge enregistree</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Ajoutez vos depenses pour calculer votre profit reel.
      </p>
      <Button type="button" onClick={onAddExpense} className="mt-5 rounded-xl px-4">
        Ajouter une charge
      </Button>
    </div>
  );
}
