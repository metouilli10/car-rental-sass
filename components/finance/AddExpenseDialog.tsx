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

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  plate: string;
};

type AddExpenseDialogProps = {
  vehicles: VehicleOption[];
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

export function AddExpenseDialog({ vehicles }: AddExpenseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("MAINTENANCE");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof methodOptions)[number]["value"]>("CASH");
  const [vehicleId, setVehicleId] = useState("none");
  const [note, setNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const reset = () => {
    setDate(today);
    setCategory("MAINTENANCE");
    setAmount("");
    setMethod("CASH");
    setVehicleId("none");
    setNote("");
    setReceiptUrl("");
  };

  const onSubmit = () => {
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
        method,
        vehicleId: vehicleId === "none" ? undefined : vehicleId,
        note,
        receiptUrl,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Charge ajoutee");
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une charge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle charge</DialogTitle>
          <DialogDescription>
            Enregistrez une depense operationnelle avec rattachement vehicule optionnel.
          </DialogDescription>
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

          <div className="grid gap-2">
            <Label htmlFor="expense-receipt">Lien justificatif (optionnel)</Label>
            <Input
              id="expense-receipt"
              type="url"
              value={receiptUrl}
              onChange={(event) => setReceiptUrl(event.target.value)}
              disabled={isPending}
              placeholder="https://..."
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
