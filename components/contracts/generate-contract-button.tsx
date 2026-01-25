"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Loader2 } from "lucide-react";
import { generateContractPDF } from "@/lib/actions/contracts";
import { useRouter } from "next/navigation";

interface GenerateContractButtonProps {
  bookingId: string;
  isRegenerate?: boolean;
}

export function GenerateContractButton({
  bookingId,
  isRegenerate = false,
}: GenerateContractButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await generateContractPDF(bookingId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleGenerate} disabled={isLoading} variant={isRegenerate ? "outline" : "default"}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Génération...
          </>
        ) : (
          <>
            {isRegenerate ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le contrat
              </>
            )}
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
