"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema, CustomerFormData } from "@/lib/validations/customer";

export async function createCustomer(data: CustomerFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const validatedData = customerSchema.parse(data);

  await prisma.customer.create({
    data: {
      customerType: validatedData.customerType,
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone,
      passportOrCIN: validatedData.passportOrCIN || null,
      passportOrCINExpiry: validatedData.passportOrCINExpiry ?? null,
      passportPhotoUrl: validatedData.passportPhotoUrl || null,
      licensePhotoUrl: validatedData.licensePhotoUrl || null,
      ice: validatedData.ice || null,
      rc: validatedData.rc || null,
      representativeName: validatedData.representativeName || null,
      address: validatedData.address || null,
      agencyId: session.user.agencyId,
    },
  });

  revalidatePath("/customers");
  redirect("/customers");
}

/** Creates a customer and returns { id, name, phone } for use in booking form (no redirect). */
export async function createCustomerForBooking(data: CustomerFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const validatedData = customerSchema.parse(data);

  const customer = await prisma.customer.create({
    data: {
      customerType: validatedData.customerType,
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone,
      passportOrCIN: validatedData.passportOrCIN || null,
      passportOrCINExpiry: validatedData.passportOrCINExpiry ?? null,
      passportPhotoUrl: validatedData.passportPhotoUrl || null,
      licensePhotoUrl: validatedData.licensePhotoUrl || null,
      ice: validatedData.ice || null,
      rc: validatedData.rc || null,
      representativeName: validatedData.representativeName || null,
      address: validatedData.address || null,
      agencyId: session.user.agencyId,
    },
    select: { id: true, name: true, phone: true },
  });

  revalidatePath("/customers");
  revalidatePath("/bookings/create");
  return customer;
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const validatedData = customerSchema.parse(data);

  // Check if customer exists and belongs to user's agency
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer || customer.agencyId !== session.user.agencyId) {
    throw new Error("Client non trouvé");
  }

  await prisma.customer.update({
    where: { id },
    data: {
      customerType: validatedData.customerType,
      name: validatedData.name,
      email: validatedData.email || null,
      phone: validatedData.phone,
      passportOrCIN: validatedData.passportOrCIN || null,
      passportOrCINExpiry: validatedData.passportOrCINExpiry ?? null,
      passportPhotoUrl: validatedData.passportPhotoUrl || null,
      licensePhotoUrl: validatedData.licensePhotoUrl || null,
      ice: validatedData.ice || null,
      rc: validatedData.rc || null,
      representativeName: validatedData.representativeName || null,
      address: validatedData.address || null,
    },
  });

  revalidatePath("/customers");
  redirect("/customers");
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Check if customer has bookings
  const bookingsCount = await prisma.booking.count({
    where: { customerId: id },
  });

  if (bookingsCount > 0) {
    throw new Error(
      "Impossible de supprimer un client avec des réservations"
    );
  }

  await prisma.customer.delete({
    where: { id },
  });

  revalidatePath("/customers");
}
