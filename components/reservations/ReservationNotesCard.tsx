"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateBookingOpsMemo } from "@/lib/actions/bookings";

export function ReservationNotesCard({
  bookingId,
  initialNotes,
}: {
  bookingId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = notes !== savedNotes;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateBookingOpsMemo(bookingId, notes);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setSavedNotes(notes);
      toast.success("Notes internes enregistrées");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Notes internes</CardTitle>
            <CardDescription>Visible uniquement par l&apos;équipe Locaryx</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isDirty && savedNotes.trim().length > 0 ? (
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Enregistrées
              </Badge>
            ) : null}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ajouter un contexte opérationnel, un rappel d'équipe ou une consigne particulière."
          className="min-h-[168px] resize-y rounded-2xl border-border/70 bg-muted/20 px-4 py-3 leading-6"
          disabled={isSaving}
        />
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {isDirty
              ? "Modifications non enregistrées"
              : "Les notes sont enregistrées et visibles uniquement par l'équipe."}
          </p>
          <Button onClick={handleSave} disabled={isSaving || !isDirty} className="shrink-0">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les notes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
