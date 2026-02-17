import { z } from "zod";

export const inspectionSectionSchema = z.object({
  sectionType: z.enum(["CARROSSERIE", "PNEUS", "INTERIEUR", "KILOMETRAGE", "CARBURANT"]),
  status: z.enum(["OK", "DAMAGE"]),
  notes: z.string().optional(),
  damageCost: z.coerce.number().min(0, "Le coût doit être positif").default(0),
  photos: z.array(z.string()).optional(),
});

export const inspectionSchema = z.object({
  bookingId: z.string().min(1, "La réservation est requise"),
  inspectionType: z.enum(["DEPART", "RETOUR"], {
    required_error: "Le type d'inspection est requis",
  }),
  fuelLevel: z.string().min(1, "Le niveau de carburant est requis"),
  cleanliness: z.string().optional(),
  notes: z.string().optional(),
  sections: z.array(inspectionSectionSchema).length(5, "Les 5 sections sont requises"),
  deductFromDeposit: z.boolean().default(false),
  deductedAmount: z.coerce.number().min(0).default(0),
  depositAction: z.enum(["RELEASE", "PARTIAL", "HOLD"], {
    required_error: "L'action sur la caution est requise",
  }),
});

export type InspectionSectionData = z.infer<typeof inspectionSectionSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;

export const SECTION_LABELS: Record<string, string> = {
  CARROSSERIE: "Carrosserie",
  PNEUS: "Pneus",
  INTERIEUR: "Intérieur",
  KILOMETRAGE: "Kilométrage",
  CARBURANT: "Carburant",
};

export const FUEL_LEVELS = [
  { value: "Vide", label: "Vide" },
  { value: "1/4", label: "1/4" },
  { value: "1/2", label: "1/2" },
  { value: "3/4", label: "3/4" },
  { value: "Plein", label: "Plein" },
];

export const CLEANLINESS_LEVELS = [
  { value: "Propre", label: "Propre" },
  { value: "Acceptable", label: "Acceptable" },
  { value: "Sale", label: "Sale" },
];
