"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) setError(null);
  }, [open]);

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

  const content = (
    <>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <CustomerForm
        submitLabel="Ajouter et sélectionner"
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        presentation={isDesktop ? "default" : "mobile-sheet"}
      />
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] rounded-t-[32px] border-t border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_100%)] px-0 pb-safe-bottom pt-safe-top"
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>
          <SheetHeader className="px-5 pb-3 pt-4 text-left">
            <SheetTitle>Nouveau client</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6">{content}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
