"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomerForBooking } from "@/lib/actions/customers";
import type { CustomerFormData } from "@/lib/validations/customer";
import type { BookingCustomerOption } from "@/components/bookings/types";

interface NewClientWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: BookingCustomerOption) => void;
}

export function NewClientWizardModal({
  open,
  onOpenChange,
  onClientCreated,
}: NewClientWizardModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CustomerFormData) => {
    const result = await createCustomerForBooking(data);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onClientCreated({
      ...result,
      bookingCount: 0,
      unpaidCount: 0,
      lastBookingAt: null,
      isVip: false,
      isBlacklisted: false,
    });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        <CustomerForm
          submitLabel="Ajouter et sélectionner"
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
