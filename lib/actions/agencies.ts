"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  agencyProfileSchema,
  type AgencyProfileFormData,
} from "@/lib/validations/agency";

export async function saveAgencyProfile(
  data: AgencyProfileFormData,
  options?: { completeSetup?: boolean },
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    const validated = agencyProfileSchema.parse(data);

    await prisma.agency.update({
      where: { id: session.user.agencyId },
      data: {
        name: validated.name,
        city: validated.city,
        address: validated.address || null,
        rcNumber: validated.rcNumber || null,
        logoUrl: validated.logoUrl || null,
        ...(options?.completeSetup ? { setupCompletedAt: new Date() } : {}),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/setup");
    revalidatePath("/settings/agency");
    return { success: true };
  } catch (error) {
    console.error("saveAgencyProfile error:", error);
    return { error: "Erreur lors de la mise à jour de l'agence" };
  }
}
