"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionChecklist } from "@/components/damage-reports/section-checklist";
import { Car, Disc3, Armchair } from "lucide-react";
import type { InspectionSectionData } from "@/lib/validations/damage-report";
import type { InspectionSections } from "../types";

const VEHICLE_SECTIONS = [
  { type: "CARROSSERIE", label: "Carrosserie", icon: Car },
  { type: "PNEUS", label: "Pneus", icon: Disc3 },
  { type: "INTERIEUR", label: "Intérieur", icon: Armchair },
] as const;

interface VehicleConditionStepProps {
  sections: InspectionSections;
  onUpdateSection: (type: string, updates: Partial<InspectionSectionData>) => void;
}

export function VehicleConditionStep({
  sections,
  onUpdateSection,
}: VehicleConditionStepProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="CARROSSERIE" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          {VEHICLE_SECTIONS.map(({ type, label, icon: Icon }) => {
            const section = sections[type];
            const hasDamage = section?.status === "DAMAGE";
            return (
              <TabsTrigger
                key={type}
                value={type}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:shadow-sm"
              >
                <Icon className="w-4 h-4 hidden sm:block" />
                {label}
                {hasDamage && (
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {VEHICLE_SECTIONS.map(({ type }) => {
          const section = sections[type];
          return (
            <TabsContent key={type} value={type} className="mt-4">
              <SectionChecklist
                sectionType={type}
                status={section.status as "OK" | "DAMAGE"}
                notes={section.notes || ""}
                damageCost={section.damageCost || 0}
                photos={section.photos || []}
                onStatusChange={(status) => onUpdateSection(type, { status })}
                onNotesChange={(notes) => onUpdateSection(type, { notes })}
                onDamageCostChange={(damageCost) => onUpdateSection(type, { damageCost })}
                onPhotosChange={(photos) => onUpdateSection(type, { photos })}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
