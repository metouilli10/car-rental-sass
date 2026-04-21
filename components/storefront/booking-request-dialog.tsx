"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BookingRequestDialogProps {
  agencySlug: string;
  triggerClassName?: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    category: string;
    pricePerDay: number;
  };
  pickupLocations: string[];
}

const initialState = {
  fullName: "",
  email: "",
  phone: "",
  pickupDate: "",
  returnDate: "",
  pickupLocation: "",
  returnLocation: "",
  note: "",
  website: "",
};

function getApiErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Impossible d'envoyer la demande.";
  }

  const error = "error" in payload ? payload.error : null;

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (Array.isArray(error) && error.length > 0) {
    const firstItem = error[0];
    if (
      firstItem &&
      typeof firstItem === "object" &&
      "message" in firstItem &&
      typeof firstItem.message === "string"
    ) {
      return firstItem.message;
    }
  }

  return "Impossible d'envoyer la demande.";
}

export function BookingRequestDialog({
  agencySlug,
  triggerClassName,
  vehicle,
  pickupLocations,
}: BookingRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const locationOptions = useMemo(
    () => pickupLocations.length > 0 ? pickupLocations : ["Agence"],
    [pickupLocations],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setError(null);
      setSuccess(null);
      setForm((current) => ({
        ...current,
        pickupLocation: current.pickupLocation || locationOptions[0] || "",
        returnLocation: current.returnLocation || locationOptions[0] || "",
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/public/${agencySlug}/booking-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleId: vehicle.id,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(getApiErrorMessage(payload));
        return;
      }

      setSuccess(
        payload.message ||
          "Votre demande a bien été envoyée. Notre équipe vérifiera la disponibilité et vous contactera rapidement.",
      );
      setForm({
        ...initialState,
        pickupLocation: locationOptions[0] ?? "",
        returnLocation: locationOptions[0] ?? "",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d'envoyer la demande.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerClassName || "w-full"}>Envoyer une demande</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[1.75rem] border-slate-200 bg-[#f7f9fb] p-0 shadow-[0_30px_80px_rgba(25,28,30,0.18)]">
        <div className="rounded-t-[1.75rem] bg-[linear-gradient(135deg,#002045_0%,#1a365d_100%)] px-6 py-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold tracking-[-0.04em] text-white">
              {vehicle.make} {vehicle.model}
            </DialogTitle>
            <DialogDescription className="text-slate-200">
              Envoyez une demande de réservation. Notre équipe vérifiera la disponibilité et vous recontactera avant toute confirmation.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-6">
          {success ? (
            <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Demande envoyée</p>
              <p className="mt-1">{success}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet" htmlFor={`fullName-${vehicle.id}`}>
                <Input
                  id={`fullName-${vehicle.id}`}
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Téléphone" htmlFor={`phone-${vehicle.id}`}>
                <Input
                  id={`phone-${vehicle.id}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+212 6 12 34 56 78"
                  minLength={6}
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Email" htmlFor={`email-${vehicle.id}`}>
                <Input
                  id={`email-${vehicle.id}`}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </Field>
              <div className="rounded-[1rem] border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
                <p className="font-medium text-slate-900">À partir de {vehicle.pricePerDay} MAD / jour</p>
                <p className="mt-1 text-xs text-slate-500">Catégorie {vehicle.category}</p>
              </div>
              <Field label="Date de départ" htmlFor={`pickupDate-${vehicle.id}`}>
                <Input
                  id={`pickupDate-${vehicle.id}`}
                  type="date"
                  value={form.pickupDate}
                  onChange={(event) => setForm((current) => ({ ...current, pickupDate: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Date de retour" htmlFor={`returnDate-${vehicle.id}`}>
                <Input
                  id={`returnDate-${vehicle.id}`}
                  type="date"
                  value={form.returnDate}
                  onChange={(event) => setForm((current) => ({ ...current, returnDate: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Lieu de départ" htmlFor={`pickupLocation-${vehicle.id}`}>
                <Select
                  value={form.pickupLocation}
                  onValueChange={(value) => setForm((current) => ({ ...current, pickupLocation: value }))}
                >
                  <SelectTrigger id={`pickupLocation-${vehicle.id}`}>
                    <SelectValue placeholder="Choisir un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lieu de retour" htmlFor={`returnLocation-${vehicle.id}`}>
                <Select
                  value={form.returnLocation}
                  onValueChange={(value) => setForm((current) => ({ ...current, returnLocation: value }))}
                >
                  <SelectTrigger id={`returnLocation-${vehicle.id}`}>
                    <SelectValue placeholder="Choisir un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Note (optionnel)" htmlFor={`note-${vehicle.id}`}>
              <Textarea
                id={`note-${vehicle.id}`}
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="min-h-24"
              />
            </Field>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              value={form.website}
              onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            />
            <Button
              type="submit"
              className="w-full rounded-xl bg-[#002045] py-3 text-sm font-bold text-white transition hover:bg-[#163765]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Envoyer la demande
            </Button>
            <p className="text-center text-xs leading-5 text-slate-500">
              Aucune réservation n&apos;est confirmée automatiquement. L&apos;agence vous recontacte après vérification.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
