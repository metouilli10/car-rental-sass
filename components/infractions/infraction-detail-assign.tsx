"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  InfractionMatchPanel,
  type BookingMatch,
} from "@/components/infractions/infraction-match-panel";
import {
  matchBookingsForInfraction,
  assignInfraction,
} from "@/lib/actions/infractions";
import { Loader2, Search } from "lucide-react";

interface InfractionDetailAssignProps {
  infractionId: string;
  vehicleId: string;
  date: string;
  time?: string | null;
}

export function InfractionDetailAssign({
  infractionId,
  vehicleId,
  date,
  time,
}: InfractionDetailAssignProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [matchState, setMatchState] = useState<
    "empty" | "loading" | "results" | "no-match"
  >("empty");
  const [matches, setMatches] = useState<BookingMatch[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [showPanel, setShowPanel] = useState(false);

  const doSearch = useCallback(async () => {
    setMatchState("loading");
    try {
      const result = await matchBookingsForInfraction(
        vehicleId,
        date,
        time || undefined
      );
      if (result.matches.length === 0) {
        setMatchState("no-match");
        setMatches([]);
      } else {
        setMatchState("results");
        setMatches(result.matches);
      }
    } catch {
      setMatchState("no-match");
      setMatches([]);
    }
  }, [vehicleId, date, time]);

  useEffect(() => {
    if (showPanel) {
      doSearch();
    }
  }, [showPanel, doSearch]);

  const handleSelect = (match: BookingMatch) => {
    setSelectedBookingId(match.bookingId);
  };

  const handleClear = () => {
    setSelectedBookingId(null);
  };

  const handleAssign = () => {
    if (!selectedBookingId) {
      toast.error("Veuillez sélectionner une réservation.");
      return;
    }
    startTransition(async () => {
      const result = await assignInfraction({
        infractionId,
        bookingId: selectedBookingId,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client assigné avec succès");
        router.refresh();
      }
    });
  };

  if (!showPanel) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Aucun client assigné à cette infraction.
          </p>
          <Button variant="outline" onClick={() => setShowPanel(true)}>
            Rechercher le client
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <InfractionMatchPanel
        state={matchState}
        matches={matches}
        selectedBookingId={selectedBookingId}
        onSelect={handleSelect}
        onClear={handleClear}
      />
      {selectedBookingId && (
        <Button
          onClick={handleAssign}
          disabled={isPending}
          className="w-full gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Assigner ce client
        </Button>
      )}
    </div>
  );
}
