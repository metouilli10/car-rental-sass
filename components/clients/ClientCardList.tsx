"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { ClientListItem } from "@/components/customers/clients-page-v2";
import { Button } from "@/components/ui/button";
import { ClientCard } from "./ClientCard";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";

interface ClientCardListProps {
  clients: ClientListItem[];
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
}

export function ClientCardList({
  clients,
  canManageCustomers,
  canDeleteCustomers,
}: ClientCardListProps) {
  const lp = useLocalizedPath();
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-slate-900">Aucun client ne correspond</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustez vos filtres ou ajoutez un nouveau client.
        </p>
        {canManageCustomers ? (
          <Button asChild className="mt-4">
            <Link href={lp("/customers/add")}>
              <UserPlus className="h-4 w-4" />
              Ajouter un client
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          canDeleteCustomers={canDeleteCustomers}
          canManageCustomers={canManageCustomers}
        />
      ))}
    </div>
  );
}
