"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import {
  dismissAgencyOnboarding,
  markAgencyDashboardExplored,
  resetAgencyOnboardingDismissal,
} from "@/lib/onboarding/agency-onboarding";

async function getAgencyIdOrThrow() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.agencyId) {
    throw new Error("Non autorisé");
  }

  return session.user.agencyId;
}

export async function dismissOnboardingChecklist() {
  const agencyId = await getAgencyIdOrThrow();
  await dismissAgencyOnboarding(agencyId);
  revalidatePath("/dashboard");
  revalidatePath("/getting-started");
  return { success: true };
}

export async function markOnboardingDashboardExplored() {
  const agencyId = await getAgencyIdOrThrow();
  await markAgencyDashboardExplored(agencyId);
  revalidatePath("/dashboard");
  revalidatePath("/getting-started");
  return { success: true };
}

export async function resumeOnboardingChecklist() {
  const agencyId = await getAgencyIdOrThrow();
  await resetAgencyOnboardingDismissal(agencyId);
  revalidatePath("/dashboard");
  revalidatePath("/getting-started");
  return { success: true };
}
