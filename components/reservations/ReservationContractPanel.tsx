"use client";

import Image from "next/image";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload, ExternalLink, PenSquare } from "lucide-react";
import { toast } from "sonner";
import { attachBookingContract } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReservationContractPanelProps {
  bookingId: string;
  contractImageUrl: string | null;
  contractSignedAt: string | null;
}

export function ReservationContractPanel({
  bookingId,
  contractImageUrl,
  contractSignedAt,
}: ReservationContractPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isImage = Boolean(contractImageUrl && /\.(jpe?g|png|webp)(\?|$)/i.test(contractImageUrl));

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("contract", file);

      const uploadResponse = await fetch("/api/bookings/upload-contract", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Erreur lors de l'upload");
      }

      startTransition(() => {
        void (async () => {
          try {
            const result = await attachBookingContract(bookingId, uploadData.contractUrl);

            if (result && "error" in result) {
              setError(result.error ?? "Erreur lors de l'enregistrement du contrat");
              return;
            }

            toast.success("Contrat rattaché à la réservation");
            router.refresh();
          } catch {
            setError("Erreur lors de l'enregistrement du contrat");
          }
        })();
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Contrat signé</CardTitle>
        <p className="text-sm text-muted-foreground">
          Le contrat est remis et signé manuellement avec le client, puis téléversé ici pour archivage.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {contractImageUrl ? (
          <div className="space-y-3">
            {isImage ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                <Image
                  src={contractImageUrl}
                  alt="Contrat signé"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 640px"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Document PDF joint</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={contractImageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir le document
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading || isPending}
              >
                {isUploading || isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Remplacer
                  </>
                )}
              </Button>
            </div>
            {contractSignedAt ? (
              <p className="text-xs text-muted-foreground">
                Dernier rattachement: {new Date(contractSignedAt).toLocaleString("fr-FR")}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PenSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Aucun contrat téléversé</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajoutez la photo ou le PDF signé après remise au client pour conserver une copie dans le dossier.
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />

        <Button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || isPending}
        >
          {isUploading || isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {contractImageUrl ? "Téléverser une nouvelle version" : "Téléverser le contrat signé"}
            </>
          )}
        </Button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
