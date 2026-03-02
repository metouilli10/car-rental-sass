"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ClientListItem } from "@/components/customers/clients-page-v2";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";

interface ClientCardProps {
  client: ClientListItem;
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
}

export function ClientCard({
  client,
  canManageCustomers,
  canDeleteCustomers,
}: ClientCardProps) {
  const hasOutstandingBalance = client.balance > 0;

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/clients/${client.id}`}
              className="block truncate text-base font-semibold text-slate-900 hover:text-primary hover:underline"
            >
              {client.name}
            </Link>
            {hasOutstandingBalance ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Solde {formatCurrency(client.balance)}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                {formatCurrency(client.balance)}
              </span>
            )}
          </div>
          <div className="shrink-0">
            <CustomerRowActions
              customerId={client.id}
              canDelete={canDeleteCustomers}
              canManage={canManageCustomers}
              compact
            />
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <a
            href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-slate-700 hover:text-primary hover:underline"
          >
            {client.phone}
          </a>
          {client.email ? (
            <p className="truncate text-muted-foreground">{client.email}</p>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground">
          {client.passportOrCIN ? (
            <span className="rounded bg-muted/60 px-1.5 py-0.5">CIN/Passeport: {client.passportOrCIN}</span>
          ) : (
            <span>Documents: Non renseigné</span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Réservations: <span className="font-medium text-slate-700">{client.bookingsCount}</span>
          {" • "}
          Dépensé: <span className="font-medium text-slate-700">{formatCurrency(client.totalSpent)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
