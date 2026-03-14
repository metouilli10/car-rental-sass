"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { saveAgencyProfile } from "@/lib/actions/agencies";
import { cn } from "@/lib/utils";

interface AgencyProfileFormProps {
  initialValues: {
    name: string;
    city: string;
    address: string;
    rcNumber: string;
    logoUrl: string;
  };
  mode: "setup" | "settings";
}

export function AgencyProfileForm({
  initialValues,
  mode,
}: AgencyProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialValues);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isSetup = mode === "setup";
  const helperText = "Vous pouvez modifier cela plus tard dans Paramètres.";
  const logoLabel = getLogoLabel(form.logoUrl);
  const inputClass = cn(
    "h-11",
    isSetup && "h-12 bg-neutral-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2c2cf2]/30"
  );

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.append("logo", file);

      const response = await fetch("/api/agencies/upload-logo", {
        method: "POST",
        body,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.logoUrl) {
        setUploadError(payload.error || "Erreur lors de l'upload du logo");
        return;
      }

      setForm((current) => ({ ...current, logoUrl: payload.logoUrl }));
    } catch (uploadErr) {
      console.error("handleLogoUpload error:", uploadErr);
      setUploadError("Erreur lors de l'upload du logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(() => {
      void (async () => {
        const result = await saveAgencyProfile(form, {
          completeSetup: mode === "setup",
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        if (mode === "setup") {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        toast.success("Profil de l'agence mis à jour");
        router.refresh();
      })();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 rounded-2xl border border-border/70 bg-white p-6",
        isSetup && "space-y-8 rounded-none border-0 bg-transparent p-0"
      )}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Informations essentielles
          </p>
          <p className="text-sm text-slate-600">
            Ajoutez les informations minimales pour personnaliser votre espace.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Nom de l&apos;agence *</Label>
            <Input
              id="agency-name"
              className={inputClass}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agency-city">Ville *</Label>
            <Input
              id="agency-city"
              className={inputClass}
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      {isSetup ? <Separator /> : null}

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Compléments
            </p>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Optionnel
            </span>
          </div>
          <p className="text-sm text-slate-600">{helperText}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agency-address">Adresse</Label>
            <Input
              id="agency-address"
              className={inputClass}
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agency-rc">RC</Label>
            <Input
              id="agency-rc"
              className={inputClass}
              value={form.rcNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, rcNumber: event.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Logo</Label>
        <div className={cn(
          "flex flex-col gap-3 rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between",
          isSetup && "hover:bg-[#2c2cf2]/[0.05] transition-colors duration-200"
        )}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-700">
                {form.logoUrl ? "Logo importé" : "Ajoutez votre logo (optionnel)"}
              </p>
              {form.logoUrl ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Prêt
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {logoLabel || "Téléversez votre logo pour personnaliser votre espace."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleLogoUpload(file);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-primary/20 bg-white/90 text-primary hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {form.logoUrl ? "Remplacer" : "Téléverser"}
            </Button>
          </div>
        </div>
        {uploadError ? <p className="text-sm text-amber-700">{uploadError}</p> : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-border/60 pt-5">
        <Button
          type="submit"
          className={cn(
            "w-full rounded-xl sm:w-auto",
            isSetup && "h-12 font-semibold shadow-sm transition-all hover:shadow-md"
          )}
          disabled={isPending || uploadingLogo}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "setup" ? "Continuer vers le tableau de bord" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function getLogoLabel(logoUrl: string) {
  if (!logoUrl) {
    return "";
  }

  try {
    const { pathname } = new URL(logoUrl);
    const fileName = pathname.split("/").pop();

    return fileName || "Logo prêt";
  } catch {
    return "Logo prêt";
  }
}
