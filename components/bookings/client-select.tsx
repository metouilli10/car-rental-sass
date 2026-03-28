"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWhatsAppLink } from "@/lib/utils";
import { NewClientModal } from "@/components/bookings/new-client-modal";
import type { BookingCustomerOption } from "@/components/bookings/types";

interface ClientSelectProps {
  customers: BookingCustomerOption[];
  value?: string;
  onChange: (value: string) => void;
  onCustomerCreated: (customer: BookingCustomerOption) => void;
  error?: string;
}

export function ClientSelect({
  customers,
  value,
  onChange,
  onCustomerCreated,
  error,
}: ClientSelectProps) {
  const [query, setQuery] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.phone}`.toLowerCase().includes(term),
    );
  }, [customers, query]);

  const selectedCustomer = customers.find((item) => item.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="client-search">Client *</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setNewClientOpen(true)}>
          + Nouveau client
        </Button>
      </div>

      <Input
        id="client-search"
        placeholder="Rechercher par nom ou téléphone..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-2">
        {filtered.length > 0 ? (
          filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onChange(customer.id)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                customer.id === value
                  ? "border-blue-300 bg-blue-50"
                  : "border-transparent hover:border-border/70 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                </div>
                <div className="flex gap-1">
                  {customer.isVip ? <Badge variant="info">VIP</Badge> : null}
                  {customer.unpaidCount > 0 ? <Badge variant="warning">Impayé</Badge> : null}
                  {customer.isBlacklisted ? <Badge variant="destructive">Blacklist</Badge> : null}
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="p-3 text-sm text-muted-foreground">Aucun client trouvé.</p>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {selectedCustomer ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{selectedCustomer.name}</span>
            {selectedCustomer.isVip ? <Badge variant="info">VIP</Badge> : null}
            {selectedCustomer.unpaidCount > 0 ? <Badge variant="warning">Impayé</Badge> : null}
            {selectedCustomer.isBlacklisted ? <Badge variant="destructive">Blacklist</Badge> : null}
          </div>
          <p className="mt-1 text-muted-foreground">
            Historique: {selectedCustomer.bookingCount} locations
            {selectedCustomer.lastBookingAt
              ? `, dernier le ${format(selectedCustomer.lastBookingAt, "dd/MM/yyyy", { locale: fr })}`
              : ""}
          </p>
          {formatWhatsAppLink(selectedCustomer.phone) ? (
            <a
              href={formatWhatsAppLink(selectedCustomer.phone) ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-blue-700 underline underline-offset-2"
            >
              Contacter sur WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}

      <NewClientModal
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        onCreated={onCustomerCreated}
      />
    </div>
  );
}
