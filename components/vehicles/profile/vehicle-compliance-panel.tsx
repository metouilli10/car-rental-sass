"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download, Eye, FileText, Loader2, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";
import { upsertVehicleDocument } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { VehicleComplianceItem } from "@/lib/vehicles/profile";
import { getHealthBadgeClass } from "./presentation";

interface VehicleCompliancePanelProps {
  vehicleId?: string;
  items: VehicleComplianceItem[];
  compact?: boolean;
  editable?: boolean;
}

type FormState = {
  reference: string;
  startDate: string;
  expiryDate: string;
  fileUrl: string;
  fileName: string;
};

export function VehicleCompliancePanel({
  vehicleId,
  items,
  compact = false,
  editable = false,
}: VehicleCompliancePanelProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<VehicleComplianceItem | null>(null);
  const [form, setForm] = useState<FormState>({
    reference: "",
    startDate: "",
    expiryDate: "",
    fileUrl: "",
    fileName: "",
  });
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canEdit = Boolean(editable && vehicleId);
  const previewIsImage = useMemo(() => /\.(png|jpe?g|webp)(\?|$)/i.test(form.fileUrl), [form.fileUrl]);

  const openEditor = (item: VehicleComplianceItem) => {
    setSelectedItem(item);
    setForm({
      reference: item.reference ?? "",
      startDate: toDateInputValue(item.startDate),
      expiryDate: toDateInputValue(item.expiryDate),
      fileUrl: item.fileUrl ?? "",
      fileName: getFileName(item.fileUrl),
    });
  };

  return (
    <>
      <Card className="rounded-[24px] border-slate-200/80 bg-white shadow-sm">
        <CardHeader className={compact ? "pb-4" : undefined}>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${compact ? "md:grid-cols-1" : "xl:grid-cols-2"}`}>
            {items.map((item) => {
              const hasContent = Boolean(item.documentId || item.reference || item.startDate || item.expiryDate || item.fileUrl);

              return (
                <div
                  key={item.id}
                  className="flex h-full flex-col rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Document</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{item.label}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          {item.fileUrl ? "Uploadé" : "Manquant"}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getHealthBadgeClass(item.status)}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>
                    {canEdit ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditor(item)}>
                          <Upload className="h-4 w-4" />
                          {item.fileUrl ? "Remplacer" : "Ajouter"}
                        </Button>
                        {hasContent ? (
                          <Button variant="outline" size="sm" onClick={() => openEditor(item)}>
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <FieldValue label="Référence" value={item.reference ?? "Non renseignée"} />
                    <FieldValue label="Fichier" value={item.fileUrl ? "Disponible" : "Aucun fichier"} />
                    <FieldValue label="Date de début" value={item.startDate ? formatDate(item.startDate) : "—"} />
                    <FieldValue label="Date de fin" value={item.expiryDate ? formatDate(item.expiryDate) : "—"} />
                  </div>

                  <div className="mt-5 rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    {item.fileUrl
                      ? "Le document est disponible et peut être remplacé si besoin."
                      : item.status === "missing"
                      ? "Aucun document enregistré pour ce type."
                      : item.helperText}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {item.fileUrl ? (
                      <>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </a>
                        <a
                          href={item.fileUrl}
                          download
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger
                        </a>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem
                ? `${selectedItem.documentId || selectedItem.fileUrl ? "Modifier" : "Ajouter"} ${selectedItem.label}`
                : "Document"}
            </DialogTitle>
            <DialogDescription>
              Mettez à jour les références, dates et fichier associé à ce document véhicule.
            </DialogDescription>
          </DialogHeader>

          {selectedItem ? (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!vehicleId) return;
                startTransition(async () => {
                  const result = await upsertVehicleDocument(vehicleId, {
                    type: selectedItem.type,
                    reference: form.reference,
                    startDate: form.startDate,
                    expiryDate: form.expiryDate,
                    fileUrl: form.fileUrl,
                  });
                  if (result?.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Document enregistré");
                  setSelectedItem(null);
                  router.refresh();
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Numéro de référence" htmlFor="reference">
                  <Input
                    id="reference"
                    value={form.reference}
                    onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                  />
                </Field>
                <Field label="Date de début" htmlFor="startDate">
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </Field>
                <Field label="Date d’échéance" htmlFor="expiryDate">
                  <Input
                    id="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                  />
                </Field>
                <div className="space-y-2">
                  <Label>Téléverser le document</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file || !vehicleId || !selectedItem) return;
                      setIsUploading(true);
                      try {
                        const body = new FormData();
                        body.set("document", file);
                        body.set("vehicleId", vehicleId);
                        body.set("documentType", selectedItem.type);
                        const response = await fetch("/api/vehicles/upload-document", {
                          method: "POST",
                          body,
                        });
                        const payload = await response.json();
                        if (!response.ok) {
                          toast.error(payload.error ?? "Upload impossible");
                          return;
                        }
                        setForm((current) => ({
                          ...current,
                          fileUrl: payload.fileUrl,
                          fileName: payload.fileName ?? file.name,
                        }));
                        toast.success("Fichier uploadé");
                      } catch (error) {
                        console.error(error);
                        toast.error("Erreur lors de l'upload");
                      } finally {
                        setIsUploading(false);
                        event.target.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.fileUrl ? "Remplacer le fichier" : "Ajouter le fichier"}
                  </Button>
                  <p className="text-xs text-slate-500">PDF, JPG ou PNG. Max 8 Mo.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-900">Aperçu du document</p>
                {form.fileUrl ? (
                  <div className="mt-3 space-y-3">
                    {previewIsImage ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl bg-white sm:w-56">
                        <Image src={form.fileUrl} alt={selectedItem.label} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm text-slate-600">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>{form.fileName || "PDF uploadé"}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <a
                        href={form.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        Voir le fichier
                      </a>
                      <a
                        href={form.fileUrl}
                        download
                        className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger le fichier
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Aucun fichier joint pour le moment.</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function getFileName(fileUrl: string | null) {
  if (!fileUrl) return "";
  try {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.split("/").pop() ?? "");
  } catch {
    return fileUrl.split("/").pop() ?? "";
  }
}
