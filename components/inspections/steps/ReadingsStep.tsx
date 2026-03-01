"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  FUEL_LEVELS,
  CLEANLINESS_LEVELS,
} from "@/lib/validations/damage-report";

interface ReadingsStepProps {
  fuelLevel: string;
  cleanliness: string;
  mileage: string;
  onFuelLevelChange: (value: string) => void;
  onCleanlinessChange: (value: string) => void;
  onMileageChange: (value: string) => void;
}

export function ReadingsStep({
  fuelLevel,
  cleanliness,
  mileage,
  onFuelLevelChange,
  onCleanlinessChange,
  onMileageChange,
}: ReadingsStepProps) {
  return (
    <div className="space-y-6">
      {/* Fuel level & Cleanliness selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Niveau de carburant *</Label>
          <Select value={fuelLevel} onValueChange={onFuelLevelChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {FUEL_LEVELS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Propreté</Label>
          <Select value={cleanliness} onValueChange={onCleanlinessChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {CLEANLINESS_LEVELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Kilométrage numeric input */}
      <div className="space-y-2">
        <Label htmlFor="mileage">Kilométrage *</Label>
        <div className="relative">
          <Input
            id="mileage"
            type="number"
            min={0}
            value={mileage}
            onChange={(e) => onMileageChange(e.target.value)}
            placeholder="Ex: 52 340"
            className="h-12 text-lg pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            km
          </span>
        </div>
      </div>
    </div>
  );
}
