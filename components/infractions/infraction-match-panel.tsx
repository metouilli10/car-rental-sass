"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import {
  User,
  Phone,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BookingMatch = {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerCin: string | null;
  customerPhone: string;
  startDate: string;
  endDate: string;
  status: string;
};

type MatchPanelState = "empty" | "loading" | "results" | "no-match";

interface InfractionMatchPanelProps {
  state: MatchPanelState;
  matches: BookingMatch[];
  selectedBookingId?: string | null;
  onSelect: (match: BookingMatch) => void;
  onClear: () => void;
}

export function InfractionMatchPanel({
  state,
  matches,
  selectedBookingId,
  onSelect,
  onClear,
}: InfractionMatchPanelProps) {
  const selectedMatch = matches.find((m) => m.bookingId === selectedBookingId);

  return (
    <Card className="border-dashed">
      <CardContent className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Correspondance réservation
        </h3>

        {/* Empty state */}
        {state === "empty" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Sélectionnez un véhicule et une date pour rechercher le client
              responsable.
            </p>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div className="flex flex-col items-center py-8 text-center">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary/60" />
            <p className="text-sm text-muted-foreground">
              Recherche en cours...
            </p>
          </div>
        )}

        {/* No match */}
        {state === "no-match" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Search className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Aucune réservation trouvée
            </p>
            <p className="text-xs text-muted-foreground">
              Aucun client n&apos;avait ce véhicule à cette date.
              L&apos;infraction sera enregistrée comme non assignée.
            </p>
          </div>
        )}

        {/* Results */}
        {state === "results" && !selectedMatch && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {matches.length} réservation{matches.length > 1 ? "s" : ""}{" "}
              trouvée{matches.length > 1 ? "s" : ""}
            </p>
            {matches.map((match) => (
              <button
                key={match.bookingId}
                type="button"
                onClick={() => onSelect(match)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/[0.02]",
                  selectedBookingId === match.bookingId
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {match.customerName}
                      </span>
                    </div>
                    {match.customerCin && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        <span>{match.customerCin}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{match.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      <span>
                        {formatDate(match.startDate)} →{" "}
                        {formatDate(match.endDate)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={match.status as "CONFIRMED" | "ACTIVE" | "COMPLETED" | "DRAFT"} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected match */}
        {state === "results" && selectedMatch && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Client identifié
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-900">
                  {selectedMatch.customerName}
                </span>
              </div>
              {selectedMatch.customerCin && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <CreditCard className="h-3 w-3" />
                  <span>{selectedMatch.customerCin}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <Phone className="h-3 w-3" />
                <span>{selectedMatch.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {formatDate(selectedMatch.startDate)} →{" "}
                  {formatDate(selectedMatch.endDate)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Retirer l&apos;assignation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
