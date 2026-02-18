"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema, VehicleFormData } from "@/lib/validations/vehicle";

export async function createVehicle(data: VehicleFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const validatedData = vehicleSchema.parse(data);

    // Check if plate already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: validatedData.plate },
    });

    if (existingVehicle) {
      return { error: "Cette plaque d'immatriculation existe déjà" };
    }

    await prisma.vehicle.create({
      data: {
        ...validatedData,
        agencyId: session.user.agencyId,
        photoUrl: validatedData.photoUrl || null,
      },
    });

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
  } catch (error) {
    console.error("createVehicle error:", error);
    return { error: "Erreur lors de la création du véhicule" };
  }

  redirect("/vehicles");
}

export async function updateVehicle(id: string, data: VehicleFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
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
      data: {
        ...validatedData,
        photoUrl: validatedData.photoUrl || null,
      },
    });

    revalidatePath("/vehicles");
    revalidatePath("/catalogue");
  } catch (error) {
    console.error("updateVehicle error:", error);
    return { error: "Erreur lors de la mise à jour du véhicule" };
  }

  redirect("/vehicles");
}

export async function deactivateVehicle(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, agencyId: session.user.agencyId },
      select: { id: true, status: true },
    });

    if (!vehicle) {
      return { error: "Véhicule non trouvé" };
    }

    const newStatus = vehicle.status === "UNAVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";

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

export async function deleteVehicle(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
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
