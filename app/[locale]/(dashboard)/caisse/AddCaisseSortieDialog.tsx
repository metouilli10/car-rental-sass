"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExpense } from "@/lib/actions/expenses";
import { expenseCategoryLabel } from "@/components/finance/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CATEGORY_OPTIONS = [
  "MAINTENANCE",
  "CARBURANT",
  "NETTOYAGE",
  "ASSURANCE",
  "TAXES",
  "SALAIRES",
  "LOYER",
  "MARKETING",
  "AUTRE",
] as const;

type AddCaisseSortieDialogProps = {
  defaultDate: string; // yyyy-MM-dd
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function AddCaisseSortieDialog({
  defaultDate,
  open,
  onOpenChange,
  trigger,
}: AddCaisseSortieDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>("AUTRE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  const reset = () => {
    setDate(defaultDate);
    setCategory("AUTRE");
    setAmount("");
    setNote("");
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange?.(next);
    setInternalOpen(next);
    if (!next) reset();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Saisissez un montant valide");
      return;
    }

    startTransition(async () => {
      const result = await createExpense({
        date,
        category,
        amount: parsedAmount,
        method: "CASH",
        note: note.trim() || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Sortie enregistrée");
      handleOpenChange(false);
      router.refresh();
    });
  };

  const resolvedOpen = open ?? internalOpen;

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sortie caisse</DialogTitle>
          <DialogDescription>
            Enregistrer une sortie d&apos;espèces (charge, achat pour l&apos;agence, etc.).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="caisse-sortie-date">Date</Label>
            <Input
              id="caisse-sortie-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as (typeof CATEGORY_OPTIONS)[number])}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {expenseCategoryLabel[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="caisse-sortie-amount">Montant (MAD)</Label>
              <Input
                id="caisse-sortie-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="caisse-sortie-note">Note (optionnel)</Label>
            <Textarea
              id="caisse-sortie-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isPending}
              placeholder="Ex. Carburant véhicule, fournitures..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer la sortie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
