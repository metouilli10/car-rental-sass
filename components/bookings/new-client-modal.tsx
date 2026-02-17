"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomerForBooking } from "@/lib/actions/customers";
import type { CustomerFormData } from "@/lib/validations/customer";
import type { BookingCustomerOption } from "@/components/bookings/types";

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: BookingCustomerOption) => void;
}

export function NewClientModal({ open, onOpenChange, onCreated }: NewClientModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CustomerFormData) => {
    const result = await createCustomerForBooking(data);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onCreated({
      ...result,
      bookingCount: 0,
      lastBookingAt: null,
      unpaidCount: 0,
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
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
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
