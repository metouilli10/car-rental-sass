"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
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
import type { ExpenseRow } from "@/components/finance/ExpensesTable";

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  plate: string;
};

type AddExpenseDialogProps = {
  vehicles: VehicleOption[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onOptimisticCreate?: (row: ExpenseRow) => void;
  onOptimisticRevert?: (id: string) => void;
};

const categoryOptions = [
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

const methodOptions = [
  { value: "CASH", label: "Especes" },
  { value: "TRANSFER", label: "Virement" },
  { value: "CARD", label: "Carte" },
] as const;

export function AddExpenseDialog({
  vehicles,
  open,
  onOpenChange,
  hideTrigger = false,
  onOptimisticCreate,
  onOptimisticRevert,
}: AddExpenseDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("MAINTENANCE");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof methodOptions)[number]["value"]>("CASH");
  const [vehicleId, setVehicleId] = useState("none");
  const [note, setNote] = useState("");

  const reset = () => {
    setDate(today);
    setCategory("MAINTENANCE");
    setAmount("");
    setMethod("CASH");
    setVehicleId("none");
    setNote("");
  };

  const onSubmit = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Saisissez un montant valide");
      return;
    }

    const selectedVehicle = vehicles.find((item) => item.id === vehicleId) ?? null;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticRow: ExpenseRow = {
      id: optimisticId,
      date: new Date(date),
      category,
      amount: parsedAmount,
      method,
      note: note || null,
      receiptUrl: null,
      vehicle: selectedVehicle
        ? {
            id: selectedVehicle.id,
            make: selectedVehicle.make,
            model: selectedVehicle.model,
            plate: selectedVehicle.plate,
          }
        : null,
    };

    onOptimisticCreate?.(optimisticRow);

    startTransition(async () => {
      const result = await createExpense({
        date,
        category,
        amount: parsedAmount,
        method,
        vehicleId: vehicleId === "none" ? undefined : vehicleId,
        note,
      });

      if ("error" in result) {
        onOptimisticRevert?.(optimisticId);
        toast.error(result.error);
        return;
      }

      toast.success("Charge ajoutee");
      onOpenChange?.(false);
      setInternalOpen(false);
      reset();
      router.refresh();
    });
  };

  const resolvedOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    setInternalOpen(next);
  };

  return (
    <Dialog
      open={resolvedOpen}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une charge
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle charge</DialogTitle>
          <DialogDescription>Enregistrez une depense operationnelle pour votre periode en cours.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Categorie</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {expenseCategoryLabel[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Montant (MAD)</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isPending}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Methode</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as typeof method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Vehicule lie (optionnel)</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expense-note">Notes (optionnel)</Label>
            <Textarea
              id="expense-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isPending}
              placeholder="Details utiles pour le suivi..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
