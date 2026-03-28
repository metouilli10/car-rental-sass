import Link from "next/link";
import { WifiOff } from "lucide-react";
import { OfflineRetryButton } from "@/components/pwa/OfflineRetryButton";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Locaryx — Hors connexion",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh-screen items-center justify-center bg-[hsl(var(--background))] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-subtle bg-white/95 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002e5d]/8 text-[#002e5d]">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Connexion indisponible</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Locaryx n’arrive pas à charger l’espace de gestion pour le moment. Vérifiez votre connexion, puis relancez la page.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <OfflineRetryButton />
          <Button asChild type="button" variant="secondary" className="rounded-xl">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Les données opérationnelles en temps réel restent chargées uniquement lorsque la connexion est disponible.
        </p>
      </div>
    </main>
  );
}
