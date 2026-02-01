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

  const validatedData = vehicleSchema.parse(data);

  // Check if plate already exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { plate: validatedData.plate },
  });

  if (existingVehicle) {
    throw new Error("Cette plaque d'immatriculation existe déjà");
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
  redirect("/vehicles");
}

export async function updateVehicle(id: string, data: VehicleFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const validatedData = vehicleSchema.parse(data);

  // Check if vehicle exists and belongs to user's agency
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle || vehicle.agencyId !== session.user.agencyId) {
    throw new Error("Véhicule non trouvé");
  }

  // Check if plate already exists for another vehicle
  if (validatedData.plate !== vehicle.plate) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: validatedData.plate },
    });

    if (existingVehicle && existingVehicle.id !== id) {
      throw new Error("Cette plaque d'immatriculation existe déjà");
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
  redirect("/vehicles");
}

export async function deleteVehicle(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Check if vehicle has active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      vehicleId: id,
      status: { in: ["CONFIRMED", "ACTIVE"] },
    },
  });

  if (activeBookings > 0) {
    throw new Error("Impossible de supprimer un véhicule avec des réservations actives");
  }

  await prisma.vehicle.delete({
    where: { id },
  });

  revalidatePath("/vehicles");
}
