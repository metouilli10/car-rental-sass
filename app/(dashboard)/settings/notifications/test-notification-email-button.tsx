"use client";

import { useTransition } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendTestNotificationEmail } from "./actions";

export function TestNotificationEmailButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isPending}
      className="w-full sm:w-auto"
      onClick={() => {
        startTransition(async () => {
          try {
            const result = await sendTestNotificationEmail();

            if (!result.success) {
              toast.error(result.error);
              return;
            }

            toast.success(
              result.providerMessageId
                ? `Email de test envoyé à ${result.recipient} (${result.providerMessageId})`
                : `Email de test envoyé à ${result.recipient}`,
            );
          } catch {
            toast.error("Erreur lors de l'envoi de l'email de test");
          }
        });
      }}
    >
      {isPending ? (
        <>
          <Mail className="h-4 w-4 animate-pulse" />
          Envoi en cours...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Envoyer un email de test
        </>
      )}
    </Button>
  );
}
