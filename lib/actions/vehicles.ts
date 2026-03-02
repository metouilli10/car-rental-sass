"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canManageVehicles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleSchema, VehicleFormData } from "@/lib/validations/vehicle";
import { computeVehicleReminders } from "@/lib/reminders/engine";
import { syncAgencyOnboardingState } from "@/lib/onboarding/agency-onboarding";
import { brandKeyFromMake } from "@/lib/brands";

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
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
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
        agencyId: session.user.agencyId,
      },
    });

    vehicleId = vehicle.id;

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
      await computeVehicleReminders(vehicleId, session.user.agencyId);
      revalidatePath("/notifications");
    } catch (err) {
      console.error("computeVehicleReminders error:", err);
    }

    try {
      await syncAgencyOnboardingState(session.user.agencyId);
    } catch (err) {
      console.error("syncAgencyOnboardingState error:", err);
    }
  }

  redirect("/vehicles");
}

export async function updateVehicle(id: string, data: VehicleFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const validatedData = vehicleSchema.parse(data);

    // Check if vehicle exists and belongs to user's agency
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle || vehicle.agencyId !== session.user.agencyId) {
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
      data: buildVehiclePayload(validatedData),
    });

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
  } catch (error) {
    console.error("updateVehicle error:", error);
    return { error: "Erreur lors de la mise à jour du véhicule" };
  }

  // Trigger reminder engine after successful save
  try {
    await computeVehicleReminders(id, session.user.agencyId);
    revalidatePath("/notifications");
  } catch (err) {
    console.error("computeVehicleReminders error:", err);
  }

  redirect("/vehicles");
}

export async function deactivateVehicle(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: session.user.agencyId },
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
  } catch (error) {
    console.error("deactivateVehicle error:", error);
    return { error: "Erreur lors de la mise à jour du statut" };
  }
}

export async function setVehicleMaintenance(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
    return { error: "Vous n'avez pas l'autorisation de gerer les vehicules" };
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: session.user.agencyId },
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
  } catch (error) {
    console.error("setVehicleMaintenance error:", error);
    return { error: "Erreur lors du passage en maintenance" };
  }
}

export async function deleteVehicle(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
    return {
      error: "Vous n'avez pas l'autorisation de supprimer un véhicule",
    };
  }

  try {
    // Verify ownership: ensure vehicle belongs to user's agency
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: session.user.agencyId },
      select: { id: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    // Check if vehicle has active bookings (scoped to agency)
    const activeBookings = await prisma.booking.count({
      where: {
        vehicleId: id,
        agencyId: session.user.agencyId,
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
