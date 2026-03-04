"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  InfractionMatchPanel,
  type BookingMatch,
} from "@/components/infractions/infraction-match-panel";
import { INFRACTION_TYPE_OPTIONS } from "@/components/infractions/infraction-constants";
import {
  infractionSchema,
  type InfractionFormData,
} from "@/lib/validations/infraction";
import {
  createInfraction,
  matchBookingsForInfraction,
} from "@/lib/actions/infractions";
import { Loader2, Save } from "lucide-react";

type Vehicle = {
  id: string;
  plate: string;
  make: string;
  model: string;
};

interface InfractionFormProps {
  vehicles: Vehicle[];
}

export function InfractionForm({ vehicles }: InfractionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Match panel state
  const [matchState, setMatchState] = useState<
    "empty" | "loading" | "results" | "no-match"
  >("empty");
  const [matches, setMatches] = useState<BookingMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<BookingMatch | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InfractionFormData>({
    resolver: zodResolver(infractionSchema),
    defaultValues: {
      vehicleId: "",
      date: "",
      time: "",
      type: "OTHER",
      amount: undefined,
      notes: "",
    },
  });

  const vehicleId = watch("vehicleId");
  const date = watch("date");
  const time = watch("time");

  const handleSelectMatch = useCallback(
    (match: BookingMatch) => {
      setSelectedMatch(match);
      setValue("bookingId", match.bookingId);
      setValue("customerId", match.customerId);
      setValue("clientName", match.customerName);
      setValue("clientCin", match.customerCin || "");
      setValue("clientPhone", match.customerPhone);
    },
    [setValue]
  );

  const doMatch = useCallback(
    async (vId: string, d: string, t?: string) => {
      if (!vId || !d) {
        setMatchState("empty");
        setMatches([]);
        setSelectedMatch(null);
        return;
      }

      setMatchState("loading");
      setSelectedMatch(null);

      try {
        const result = await matchBookingsForInfraction(vId, d, t || undefined);
        if (result.matches.length === 0) {
          setMatchState("no-match");
          setMatches([]);
        } else {
          setMatchState("results");
          setMatches(result.matches);
        }
      } catch {
        setMatchState("no-match");
        setMatches([]);
      }
    },
    []
  );

  // Debounced match lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      doMatch(vehicleId, date, time);
    }, 400);
    return () => clearTimeout(timer);
  }, [vehicleId, date, time, doMatch]);

  // Auto-select when exactly one match (runs after state updates from doMatch)
  useEffect(() => {
    if (matchState === "results" && matches.length === 1 && !selectedMatch) {
      handleSelectMatch(matches[0]);
    }
  }, [matchState, matches, selectedMatch, handleSelectMatch]);

  const handleClearMatch = () => {
    setSelectedMatch(null);
    setValue("bookingId", "");
    setValue("customerId", "");
    setValue("clientName", "");
    setValue("clientCin", "");
    setValue("clientPhone", "");
  };

  const onSubmit = (data: InfractionFormData) => {
    startTransition(async () => {
      const result = await createInfraction(data);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("infractionId" in result) {
        toast.success("Infraction enregistrée");
        router.push(`/infractions/${result.infractionId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="space-y-5 p-5">
              <h3 className="text-sm font-semibold">
                Détails de l&apos;infraction
              </h3>

              {/* Vehicle select */}
              <div className="space-y-1.5">
                <Label htmlFor="vehicleId">
                  Véhicule <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={vehicleId}
                  onValueChange={(v) => setValue("vehicleId", v)}
                >
                  <SelectTrigger id="vehicleId">
                    <SelectValue placeholder="Sélectionner un véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="font-mono">{v.plate}</span>
                        {" — "}
                        {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && (
                  <p className="text-xs text-red-500">
                    {errors.vehicleId.message}
                  </p>
                )}
              </div>

              {/* Date + Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input type="date" id="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-xs text-red-500">
                      {errors.date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Heure (optionnel)</Label>
                  <Input
                    type="time"
                    id="time"
                    {...register("time")}
                    placeholder="HH:mm"
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label htmlFor="type">Type d&apos;infraction</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(v) =>
                    setValue(
                      "type",
                      v as InfractionFormData["type"]
                    )
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INFRACTION_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant (MAD)</Label>
                <Input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Détails supplémentaires..."
                  {...register("notes")}
                />
              </div>

              {/* Hidden fields for match data */}
              <input type="hidden" {...register("bookingId")} />
              <input type="hidden" {...register("customerId")} />
              <input type="hidden" {...register("clientName")} />
              <input type="hidden" {...register("clientCin")} />
              <input type="hidden" {...register("clientPhone")} />

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Match panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <InfractionMatchPanel
              state={matchState}
              matches={matches}
              selectedBookingId={selectedMatch?.bookingId}
              onSelect={handleSelectMatch}
              onClear={handleClearMatch}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
