"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoGridUploader } from "@/components/inspections/PhotoGridUploader";
import { SECTION_LABELS } from "@/lib/validations/damage-report";
import { cn } from "@/lib/utils";

interface SectionChecklistProps {
  sectionType: string;
  status: "OK" | "DAMAGE";
  notes: string;
  damageCost: number;
  photos: string[];
  onStatusChange: (status: "OK" | "DAMAGE") => void;
  onNotesChange: (notes: string) => void;
  onDamageCostChange: (cost: number) => void;
  onPhotosChange: (photos: string[]) => void;
}

export function SectionChecklist({
  sectionType,
  status,
  notes,
  damageCost,
  photos,
  onStatusChange,
  onNotesChange,
  onDamageCostChange,
  onPhotosChange,
}: SectionChecklistProps) {
  const label = SECTION_LABELS[sectionType] || sectionType;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{label}</h3>

      {/* Status Toggle - Large tap targets */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onStatusChange("OK")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px]",
            status === "OK"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          )}
        >
          <CheckCircle2 className="w-7 h-7" />
          <span className="text-sm font-semibold">OK</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusChange("DAMAGE")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[80px]",
            status === "DAMAGE"
              ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
          )}
        >
          <AlertTriangle className="w-7 h-7" />
          <span className="text-sm font-semibold">Dommage</span>
        </button>
      </div>

      {/* Expanded damage fields */}
      {status === "DAMAGE" && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Damage cost */}
          <div className="space-y-2">
            <Label htmlFor={`cost-${sectionType}`}>Coût estimé (MAD)</Label>
            <Input
              id={`cost-${sectionType}`}
              type="number"
              min={0}
              step={50}
              value={damageCost || ""}
              onChange={(e) => onDamageCostChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="h-12 text-lg"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor={`notes-${sectionType}`}>Description du dommage</Label>
            <Textarea
              id={`notes-${sectionType}`}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Décrivez le dommage observé..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <PhotoGridUploader
              photos={photos}
              onPhotosChange={onPhotosChange}
              maxPhotos={5}
            />
          </div>
        </div>
      )}
    </div>
  );
}
