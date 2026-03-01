import type { InspectionSectionData } from "@/lib/validations/damage-report";

export type BookingOption = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  depositAmount: number;
  customer: { name: string };
  vehicle: { make: string; model: string; plate: string };
  deposit: { id: string; amount: number; status: string } | null;
};

export type DepartureData = {
  fuelLevel: string;
  sections: {
    sectionType: string;
    status: string;
    damageCost: number;
  }[];
};

export type InspectionSections = Record<string, InspectionSectionData>;

export const SECTION_TYPES = [
  "CARROSSERIE",
  "PNEUS",
  "INTERIEUR",
  "KILOMETRAGE",
  "CARBURANT",
] as const;
