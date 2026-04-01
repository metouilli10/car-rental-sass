"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocalizedPath } from "@/components/i18n/use-localized-path";
import { CalendarPlus, MoreVertical, Pencil, Eye, FileText, History, Trash2 } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerRowActionsProps {
  customerId: string;
  canDelete: boolean;
  canManage?: boolean;
  compact?: boolean;
}

export function CustomerRowActions({
  customerId,
  canDelete,
  canManage = true,
  compact,
}: CustomerRowActionsProps) {
  const lp = useLocalizedPath();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCustomer(customerId);
      if (result?.error) {
        setError(result.error);
      } else {
        setConfirmOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {compact ? (
          <>
            <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="Voir le client">
              <Link href={lp(`/clients/${customerId}`)}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Plus d'actions client"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href={lp(`/clients/${customerId}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir détails
                  </Link>
                </DropdownMenuItem>
                {canManage ? (
                  <DropdownMenuItem asChild>
                    <Link href={lp(`/customers/${customerId}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href={lp(`/bookings/create?customerId=${customerId}`)}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Nouvelle réservation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={lp(`/customers/${customerId}/edit?tab=documents`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ajouter document
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={lp(`/reservations?clientId=${customerId}`)}>
                    <History className="mr-2 h-4 w-4" />
                    Historique réservations
                  </Link>
                </DropdownMenuItem>
                {canDelete ? <DropdownMenuSeparator /> : null}
                {canDelete ? (
                  <DropdownMenuItem
                    onClick={() => setConfirmOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {canManage ? (
              <Button asChild size="sm" variant="ghost" aria-label="Modifier le client">
                <Link href={lp(`/customers/${customerId}/edit`)}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            ) : null}

            <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Plus d'actions client"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={lp(`/clients/${customerId}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={lp(`/bookings/create?customerId=${customerId}`)}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={lp(`/customers/${customerId}/edit?tab=documents`)}>
                <FileText className="mr-2 h-4 w-4" />
                Ajouter document
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={lp(`/reservations?clientId=${customerId}`)}>
                <History className="mr-2 h-4 w-4" />
                Historique réservations
              </Link>
            </DropdownMenuItem>
            {canDelete ? <DropdownMenuSeparator /> : null}
            {canDelete ? (
              <DropdownMenuItem
                onClick={() => setConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
          </>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Le client sera supprime definitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
