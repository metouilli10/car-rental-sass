"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download, Eye, FileText, Loader2, Pencil, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { upsertVehicleDocument } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const previewIsImage = useMemo(() => {
    return /\.(png|jpe?g|webp)(\?|$)/i.test(form.fileUrl);
  }, [form.fileUrl]);

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
      <Card className="rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className={compact ? "pb-3" : undefined}>
          <CardTitle className="text-base">Échéances & documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">
                    {item.reference ? `Réf: ${item.reference}` : "Référence non renseignée"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getHealthBadgeClass(item.status)}`}>
                    {item.statusLabel}
                  </span>
                  {canEdit ? (
                    <Button variant="secondary" size="sm" onClick={() => openEditor(item)}>
                      {item.documentId || item.fileUrl || item.reference || item.startDate || item.expiryDate ? (
                        <>
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">Début</span>
                  <p>{item.startDate ? formatDate(item.startDate) : "—"}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">Échéance</span>
                  <p>{item.expiryDate ? formatDate(item.expiryDate) : "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{item.helperText}</span>
                <div className="flex items-center gap-3">
                  <span>{item.fileUrl ? "Fichier disponible" : "Document non uploadé"}</span>
                  {item.fileUrl ? (
                    <>
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        View file
                      </a>
                      <a
                        href={item.fileUrl}
                        download
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        Download file
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `${selectedItem.documentId || selectedItem.fileUrl ? "Modifier" : "Ajouter"} ${selectedItem.label}` : "Document"}
            </DialogTitle>
            <DialogDescription>
              Gérez la conformité et le fichier associé pour ce document véhicule.
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
                <Field label="Reference number" htmlFor="reference">
                  <Input
                    id="reference"
                    value={form.reference}
                    onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                  />
                </Field>
                <Field label="Start date" htmlFor="startDate">
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </Field>
                <Field label="Expiry date" htmlFor="expiryDate">
                  <Input
                    id="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                  />
                </Field>
                <div className="space-y-2">
                  <Label>Upload document file</Label>
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
                    {form.fileUrl ? "Replace file" : "Ajouter fichier"}
                  </Button>
                  <p className="text-xs text-slate-500">PDF, JPG ou PNG. Max 8 Mo.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-900">Document file status</p>
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
                      <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                        View file
                      </a>
                      <a href={form.fileUrl} download className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700">
                        <Download className="h-4 w-4" />
                        Download file
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Document non uploadé</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || isUploading}>
                  {isPending ? "Save..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function getFileName(url: string | null) {
  if (!url) return "";
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() ?? "");
  } catch {
    return url.split("/").pop() ?? "";
  }
}
