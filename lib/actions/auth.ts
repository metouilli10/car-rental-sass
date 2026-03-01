"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  registerOwnerSchema,
  type RegisterOwnerFormData,
} from "@/lib/validations/auth";

export async function registerOwnerAccount(data: RegisterOwnerFormData) {
  try {
    const validated = registerOwnerSchema.parse(data);
    const email = validated.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Cet email est déjà utilisé" };
    }

    const hashedPassword = await hash(validated.password, 10);

    await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: "Nouvelle agence",
          city: "",
          address: null,
          phone: null,
          email: null,
          setupCompletedAt: null,
          onboardingVehicleAdded: false,
          onboardingReservationCreated: false,
          onboardingPaymentRecorded: false,
          onboardingDashboardExplored: false,
          onboardingCompleted: false,
          onboardingDismissed: false,
        },
        select: { id: true },
      });

      await tx.user.create({
        data: {
          name: validated.name,
          email,
          password: hashedPassword,
          role: "OWNER",
          isActive: true,
          agencyId: agency.id,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("registerOwnerAccount error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2011", "P2021", "P2022"].includes(error.code)
    ) {
      return {
        error:
          "La base de données n'est pas à jour. Exécutez la migration Prisma de l'onboarding avant de créer un compte.",
      };
    }

    return { error: "Erreur lors de la création du compte" };
  }
}
