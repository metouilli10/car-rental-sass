"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { ClientListItem } from "@/components/customers/clients-page-v2";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";

interface ClientsTableProps {
  rows: ClientListItem[];
  currentUserRole: UserRole;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClientsTable({
  rows,
  currentUserRole,
  selectedId,
  onSelect,
}: ClientsTableProps) {
  const router = useRouter();
  const canDelete = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-slate-900">Aucun client ne correspond</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustez vos filtres ou ajoutez un nouveau client.
        </p>
        <Button asChild className="mt-4">
          <Link href="/customers/add">
            <UserPlus className="h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <tr>
              <th className="w-[28%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Client
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Documents
              </th>
              <th className="w-[22%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Activité
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Solde
              </th>
              <th className="w-[18%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((customer) => {
              const isSelected = selectedId === customer.id;
              const hasOutstandingBalance = customer.balance > 0;
              const secondaryLine =
                customer.customerType === "PERSONNE_MORALE"
                  ? "Entreprise"
                  : customer.email ?? customer.phone;

              return (
                <tr
                  key={customer.id}
                  onClick={() => onSelect(customer.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-100/70"
                      : hasOutstandingBalance
                        ? "bg-amber-50/30 hover:bg-blue-50/40"
                        : "hover:bg-blue-50/40"
                  }`}
                >
                  <td className="px-4 py-3" style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                        {customer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/clients/${customer.id}`}
                          className="block truncate text-sm font-semibold text-slate-900 hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {customer.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{secondaryLine}</p>
                        <p className="truncate text-xs text-muted-foreground/80">
                          Créé le {formatDate(customer.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ minWidth: 0 }}>
                    {customer.passportOrCIN ? (
                      <span className="inline-block max-w-full truncate rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                        {customer.passportOrCIN}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non renseigné</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/reservations?clientId=${customer.id}`);
                        }}
                        className="text-left"
                        aria-label={`Voir les réservations de ${customer.name}`}
                      >
                        <Badge variant="secondary" className="text-xs">
                          {customer.bookingsCount} résa.
                        </Badge>
                      </button>
                      <span className="text-xs font-medium text-slate-700 tabular-nums">
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {hasOutstandingBalance ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {formatCurrency(customer.balance)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                        {formatCurrency(customer.balance)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <CustomerRowActions
                      customerId={customer.id}
                      canDelete={canDelete}
                      compact
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
