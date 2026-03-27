"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAccessOrThrow } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleSchema, VehicleFormData } from "@/lib/validations/vehicle";
import {
  vehicleDocumentSchema,
  type VehicleDocumentFormData,
} from "@/lib/validations/vehicle-document";
import { vehicleReminderSchema, type VehicleReminderFormData } from "@/lib/validations/vehicle-reminder";
import { computeVehicleReminders } from "@/lib/reminders/engine";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";
import { brandKeyFromMake } from "@/lib/brands";
import { persistVehicleFuelType } from "@/lib/vehicle-fuel-type";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateOrNull(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function buildVehiclePayload(validatedData: VehicleFormData) {
  return {
    make: validatedData.make,
    brandKey: brandKeyFromMake(validatedData.make),
    model: validatedData.model,
    year: validatedData.year,
    plate: validatedData.plate,
    color: validatedData.color,
    status: validatedData.status,
    pricePerDay: validatedData.pricePerDay,
    depositAmount: validatedData.depositAmount,
    gearbox: validatedData.gearbox,
    mileage: validatedData.mileage ?? null,
    photoUrl: validatedData.photoUrl || null,
    // Mileage / oil change
    currentKm: validatedData.currentKm ?? null,
    lastOilChangeMileageKm: validatedData.lastOilChangeMileageKm ?? null,
    lastOilChangeDate: toDateOrNull(validatedData.lastOilChangeDate),
    oilChangeIntervalKm: validatedData.oilChangeIntervalKm ?? null,
    oilChangeIntervalMonths: validatedData.oilChangeIntervalMonths ?? null,
    nextOilChangeMileageKm: validatedData.nextOilChangeMileageKm ?? null,
    nextOilChangeDate: toDateOrNull(validatedData.nextOilChangeDate),
    // Insurance
    insuranceProvider: validatedData.insuranceProvider || null,
    insurancePolicyNumber: validatedData.insurancePolicyNumber || null,
    insuranceStartDate: toDateOrNull(validatedData.insuranceStartDate),
    insuranceExpiryDate: toDateOrNull(validatedData.insuranceExpiryDate),
    insuranceReminderDays: validatedData.insuranceReminderDays ?? [],
    // Visite technique
    lastTechnicalInspectionDate: toDateOrNull(validatedData.lastTechnicalInspectionDate),
    nextTechnicalInspectionDate: toDateOrNull(validatedData.nextTechnicalInspectionDate),
    technicalInspectionReminderDays: validatedData.technicalInspectionReminderDays ?? [],
    // Vignette
    vignetteExpiryDate: toDateOrNull(validatedData.vignetteExpiryDate),
    vignetteReminderDays: validatedData.vignetteReminderDays ?? [],
    // General
    maintenanceNotes: validatedData.maintenanceNotes || null,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createVehicle(data: VehicleFormData) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  let vehicleId: string | null = null;

  try {
    const validatedData = vehicleSchema.parse(data);

    // Check if plate already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: validatedData.plate },
    });

    if (existingVehicle) {
      return { error: "Cette plaque d'immatriculation existe déjà" };
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...buildVehiclePayload(validatedData),
        agencyId: currentUser.agencyId,
      },
    });

    vehicleId = vehicle.id;
    await persistVehicleFuelType(vehicle.id, validatedData.fuelType);

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("createVehicle error:", error);
    return { error: "Erreur lors de la création du véhicule" };
  }

  // Trigger reminder engine after successful save (outside try so redirect works)
  if (vehicleId) {
    try {
      await computeVehicleReminders(vehicleId, currentUser.agencyId);
      revalidatePath("/notifications");
    } catch (err) {
      console.error("computeVehicleReminders error:", err);
    }

    try {
      await syncAgencyOnboardingState(currentUser.agencyId);
    } catch (err) {
      console.error("syncAgencyOnboardingState error:", err);
    }
  }

  redirect("/vehicles");
}

export async function updateVehicle(id: string, data: VehicleFormData) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const validatedData = vehicleSchema.parse(data);

    // Check if vehicle exists and belongs to user's agency
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true, plate: true, mileage: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    // Check if plate already exists for another vehicle
    if (validatedData.plate !== vehicle.plate) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plate: validatedData.plate },
      });

      if (existingVehicle && existingVehicle.id !== id) {
        return { error: "Cette plaque d'immatriculation existe déjà" };
      }
    }

    await prisma.vehicle.update({
      where: { id },
      data: {
        ...buildVehiclePayload(validatedData),
        mileage: validatedData.mileage ?? vehicle.mileage,
      },
    });
    await persistVehicleFuelType(id, validatedData.fuelType);

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
  } catch (error) {
    console.error("updateVehicle error:", error);
    return { error: "Erreur lors de la mise à jour du véhicule" };
  }

  // Trigger reminder engine after successful save
  try {
    await computeVehicleReminders(id, currentUser.agencyId);
    revalidatePath("/notifications");
  } catch (err) {
    console.error("computeVehicleReminders error:", err);
  }

  redirect("/vehicles");
}

export async function deactivateVehicle(id: string) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true, status: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    const newStatus = vehicle.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    await prisma.vehicle.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
    return { success: true as const, status: newStatus };
  } catch (error) {
    console.error("deactivateVehicle error:", error);
    return { error: "Erreur lors de la mise à jour du statut" };
  }
}

export async function setVehicleMaintenance(id: string) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true, status: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    if (vehicle.status === "MAINTENANCE") {
      return { error: "Le véhicule est déjà en maintenance" };
    }

    await prisma.vehicle.update({
      where: { id },
      data: { status: "MAINTENANCE" },
    });

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
    return { success: true as const, status: "MAINTENANCE" as const };
  } catch (error) {
    console.error("setVehicleMaintenance error:", error);
    return { error: "Erreur lors du passage en maintenance" };
  }
}

export async function deleteVehicle(id: string) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return {
      error: "Vous n'avez pas l'autorisation de supprimer un véhicule",
    };
  }

  try {
    // Verify ownership: ensure vehicle belongs to user's agency
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    // Check if vehicle has active bookings (scoped to agency)
    const activeBookings = await prisma.booking.count({
      where: {
        vehicleId: id,
        agencyId: currentUser.agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
      },
    });

    if (activeBookings > 0) {
      return { error: "Impossible de supprimer un véhicule avec des réservations actives" };
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    revalidatePath("/vehicles");
  } catch (error) {
    console.error("deleteVehicle error:", error);
    return { error: "Erreur lors de la suppression du véhicule" };
  }
}

export async function updateVehicleReminderFields(
  id: string,
  data: VehicleReminderFormData,
) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const validated = vehicleReminderSchema.parse(data);
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    await prisma.vehicle.update({
      where: { id },
      data: {
        nextOilChangeDate: toDateOrNull(validated.nextOilChangeDate),
        nextOilChangeMileageKm: validated.nextOilChangeMileageKm ?? null,
        insuranceExpiryDate: toDateOrNull(validated.insuranceExpiryDate),
        nextTechnicalInspectionDate: toDateOrNull(validated.nextTechnicalInspectionDate),
        vignetteExpiryDate: toDateOrNull(validated.vignetteExpiryDate),
        maintenanceNotes: validated.maintenanceNotes?.trim() || null,
      },
    });

    try {
      await computeVehicleReminders(id, currentUser.agencyId);
    } catch (error) {
      console.error("updateVehicleReminderFields computeVehicleReminders error:", error);
    }

    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/notifications");

    return { success: true as const };
  } catch (error) {
    console.error("updateVehicleReminderFields error:", error);
    return { error: "Erreur lors de la mise à jour des rappels" };
  }
}

export async function upsertVehicleDocument(
  id: string,
  data: VehicleDocumentFormData,
) {
  const currentUser = await getCurrentUserAccessOrThrow();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  const vehicleDocumentDelegate = (prisma as typeof prisma & {
    vehicleDocument?: {
      upsert: typeof prisma.vehicleDocument.upsert;
    };
  }).vehicleDocument;

  if (!vehicleDocumentDelegate) {
    return {
      error:
        "Le module documents n'est pas encore disponible. Redémarrez l'application après avoir appliqué la migration Prisma.",
    };
  }

  try {
    const validated = vehicleDocumentSchema.parse(data);
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: { id: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    const startDateInput = typeof validated.startDate === "string" ? validated.startDate : undefined;
    const expiryDateInput = typeof validated.expiryDate === "string" ? validated.expiryDate : undefined;
    const referenceInput = typeof validated.reference === "string" ? validated.reference : undefined;
    const fileUrlInput = typeof validated.fileUrl === "string" ? validated.fileUrl : undefined;

    const startDate = toDateOrNull(startDateInput);
    const expiryDate = toDateOrNull(expiryDateInput);
    const reference = referenceInput?.trim() || null;
    const fileUrl = fileUrlInput?.trim() || null;

    await vehicleDocumentDelegate.upsert({
      where: {
        agencyId_vehicleId_type: {
          agencyId: currentUser.agencyId,
          vehicleId: id,
          type: validated.type,
        },
      },
      update: {
        reference,
        startDate,
        expiryDate,
        fileUrl,
      },
      create: {
        agencyId: currentUser.agencyId,
        vehicleId: id,
        type: validated.type,
        reference,
        startDate,
        expiryDate,
        fileUrl,
      },
    });

    const vehicleUpdateData: Record<string, string | Date | null | undefined> = {};
    if (validated.type === "INSURANCE") {
      vehicleUpdateData.insurancePolicyNumber = reference;
      vehicleUpdateData.insuranceStartDate = startDate;
      vehicleUpdateData.insuranceExpiryDate = expiryDate;
    }
    if (validated.type === "TECHNICAL_INSPECTION") {
      vehicleUpdateData.lastTechnicalInspectionDate = startDate;
      vehicleUpdateData.nextTechnicalInspectionDate = expiryDate;
    }
    if (validated.type === "VIGNETTE") {
      vehicleUpdateData.vignetteExpiryDate = expiryDate;
    }

    if (Object.keys(vehicleUpdateData).length > 0) {
      await prisma.vehicle.update({
        where: { id },
        data: vehicleUpdateData,
      });
    }

    try {
      await computeVehicleReminders(id, currentUser.agencyId);
    } catch (error) {
      console.error("upsertVehicleDocument computeVehicleReminders error:", error);
    }

    revalidatePath(`/vehicles/${id}`);
    revalidatePath("/vehicles");
    revalidatePath("/notifications");

    return { success: true as const };
  } catch (error) {
    console.error("upsertVehicleDocument error:", error);
    return { error: "Erreur lors de l'enregistrement du document" };
  }
}
