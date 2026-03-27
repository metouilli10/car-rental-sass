"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Loader2, RefreshCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  VEHICLE_IMPORT_FIELDS,
  type VehicleImportMapping,
  type VehicleImportPreview,
  type VehicleImportPreviewRow,
} from "@/lib/vehicles/import-types";

type PreviewBootstrapResponse = {
  headers: string[];
  sampleRows: Record<string, string>[];
  suggestedMapping: VehicleImportMapping;
  preview?: VehicleImportPreview;
  error?: string;
};

function actionBadgeClass(action: VehicleImportPreviewRow["action"]) {
  switch (action) {
    case "create":
      return "bg-emerald-100 text-emerald-700";
    case "update":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function actionLabel(action: VehicleImportPreviewRow["action"]) {
  switch (action) {
    case "create":
      return "Creer";
    case "update":
      return "Mettre a jour";
    default:
      return "Ignorer";
  }
}

export function VehicleImportPageClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<VehicleImportMapping>({});
  const [preview, setPreview] = useState<VehicleImportPreview | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredFieldsMissing = useMemo(
    () =>
      VEHICLE_IMPORT_FIELDS.filter((field) => field.required && !mapping[field.key]).map(
        (field) => field.label,
      ),
    [mapping],
  );

  const importableRows = useMemo(
    () => preview?.rows.filter((row) => row.action !== "skip") ?? [],
    [preview],
  );

  async function readFileStructure(nextFile: File) {
    const formData = new FormData();
    formData.append("file", nextFile);

    setIsReading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch("/api/vehicles/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as PreviewBootstrapResponse;

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la lecture du fichier");
      }

      setHeaders(data.headers);
      setSampleRows(data.sampleRows);
      setMapping(data.suggestedMapping ?? {});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la lecture du fichier";
      setError(message);
    } finally {
      setIsReading(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setHeaders([]);
    setSampleRows([]);
    setMapping({});
    setPreview(null);

    if (!nextFile) {
      return;
    }

    await readFileStructure(nextFile);
    event.target.value = "";
  }

  async function handlePreview() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    setIsPreviewing(true);
    setError(null);

    try {
      const response = await fetch("/api/vehicles/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as PreviewBootstrapResponse;

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la preparation de l'import");
      }

      setPreview(data.preview ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la preparation de l'import";
      setError(message);
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    if (importableRows.length === 0) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/vehicles/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview?.rows ?? [] }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'import");
      }

      toast.success(
        `${data.created} cree(s), ${data.updated} mis a jour, ${data.skipped} ignore(s)`,
      );
      router.push("/vehicles");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'import";
      setError(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
            Retour aux vehicules
          </Link>
        </Button>
        {file ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            {file.name}
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Import interrompu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Charger le fichier Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Importez votre fichier `.xlsx` ou `.csv`
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  LocaPro lira les colonnes puis vous laissera les mapper avant d'importer.
                </p>
              </div>
              <Label
                htmlFor="vehicle-import-file"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
              >
                {isReading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Choisir un fichier
              </Label>
            </div>
            <input
              id="vehicle-import-file"
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isReading || isPreviewing || isImporting}
            />
          </div>
        </CardContent>
      </Card>

      {headers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapper les colonnes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {VEHICLE_IMPORT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  <Select
                    value={mapping[field.key] ?? "__ignore__"}
                    onValueChange={(value) => {
                      setPreview(null);
                      setMapping((current) => ({
                        ...current,
                        [field.key]: value === "__ignore__" ? undefined : value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ignore__">Ignorer cette colonne</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {requiredFieldsMissing.length > 0 ? (
              <Alert>
                <AlertTitle>Champs obligatoires manquants</AlertTitle>
                <AlertDescription>
                  Mappez encore: {requiredFieldsMissing.join(", ")}
                </AlertDescription>
              </Alert>
            ) : null}

            {sampleRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Apercu des premieres lignes</p>
                    <p className="text-sm text-muted-foreground">
                      Verifiez que les bonnes colonnes sont bien associees.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.slice(0, 6).map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleRows.map((row, index) => (
                        <TableRow key={index}>
                          {headers.slice(0, 6).map((header) => (
                            <TableCell key={header}>{row[header] || "—"}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handlePreview}
                disabled={!file || requiredFieldsMissing.length > 0 || isPreviewing}
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse en cours
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Preparer l'import
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Verifier avant import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">A creer</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{preview.counts.create}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">A mettre a jour</p>
                <p className="mt-1 text-2xl font-semibold text-blue-900">{preview.counts.update}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Ignorees</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">{preview.counts.skip}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Vehicule</TableHead>
                    <TableHead>Plaque</TableHead>
                    <TableHead>Prix / jour</TableHead>
                    <TableHead>Erreur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionBadgeClass(
                            row.action,
                          )}`}
                        >
                          {actionLabel(row.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.normalized ? `${row.normalized.make} ${row.normalized.model}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.normalized?.plate || "—"}
                      </TableCell>
                      <TableCell>
                        {row.normalized ? formatCurrency(row.normalized.pricePerDay) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.errors.length > 0 ? row.errors.join(", ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleImport} disabled={importableRows.length === 0 || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Import en cours
                  </>
                ) : (
                  `Importer ${importableRows.length} vehicule(s)`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isPreviewing || isImporting}
              >
                Recalculer l'aperçu
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
