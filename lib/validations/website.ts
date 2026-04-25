import { z } from "zod";
import { isReservedStorefrontSlug, normalizeAgencySlug } from "@/lib/storefront/constants";
import { isValidStorefrontHostname, normalizeStorefrontHostname } from "@/lib/storefront/domains";

const phoneField = z.string().trim().max(30, "Numéro invalide").optional().or(z.literal(""));
const optionalText = z.string().trim().optional().or(z.literal(""));

export const websiteSettingsSchema = z.object({
  agencySlug: z
    .string()
    .trim()
    .min(3, "Le slug doit contenir au moins 3 caractères")
    .max(50, "Le slug doit contenir au maximum 50 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilisez uniquement des lettres minuscules, chiffres et tirets")
    .transform(normalizeAgencySlug)
    .refine((slug) => !isReservedStorefrontSlug(slug), "Ce slug est réservé"),
  siteTitle: optionalText,
  heroTitle: optionalText,
  heroSubtitle: optionalText,
  heroImageUrl: optionalText,
  contactPhone: phoneField,
  whatsappPhone: phoneField,
  contactEmail: z.union([z.string().trim().email("Email invalide"), z.literal(""), z.undefined()]),
  address: optionalText,
  pickupLocations: z.array(z.string().trim().min(1, "Lieu invalide")).max(20, "Maximum 20 lieux"),
  isWebsiteEnabled: z.boolean(),
});

export type WebsiteSettingsFormData = z.infer<typeof websiteSettingsSchema>;

export const storefrontDomainInputSchema = z.object({
  hostname: z
    .string()
    .trim()
    .min(1, "Domaine requis")
    .transform(normalizeStorefrontHostname)
    .refine((hostname) => isValidStorefrontHostname(hostname), "Nom de domaine invalide"),
});

export type StorefrontDomainInput = z.infer<typeof storefrontDomainInputSchema>;

export const publicBookingRequestSchema = z
  .object({
    vehicleId: z.string().min(1, "Véhicule requis"),
    fullName: z.string().trim().min(2, "Nom complet requis").max(120, "Nom trop long"),
    email: z.string().trim().email("Email invalide"),
    phone: z.string().trim().min(6, "Téléphone requis").max(30, "Téléphone invalide"),
    pickupDate: z.string().min(1, "Date de départ requise"),
    returnDate: z.string().min(1, "Date de retour requise"),
    pickupLocation: z.string().trim().min(1, "Lieu de départ requis").max(120, "Lieu invalide"),
    returnLocation: z.string().trim().min(1, "Lieu de retour requis").max(120, "Lieu invalide"),
    note: optionalText,
    website: z.string().max(0).optional(),
  })
  .refine((input) => {
    const start = new Date(input.pickupDate);
    const end = new Date(input.returnDate);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  }, {
    message: "La date de retour doit être après la date de départ",
    path: ["returnDate"],
  });

export type PublicBookingRequestInput = z.infer<typeof publicBookingRequestSchema>;
