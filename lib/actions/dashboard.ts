"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDashboardCollectionsSheetData,
  getDashboardDueDepositsSheetData,
  getDashboardLateReturnsSheetData,
} from "@/lib/dashboard/v3-queries";
import { resolveDashboardV3Period, type DashboardV3PeriodInput } from "@/lib/dashboard/ranges";
import type {
  DashboardV3CollectionsSheetDTO,
  DashboardV3DueDepositsSheetDTO,
  DashboardV3LateReturnsSheetDTO,
} from "@/lib/dashboard/types";
import type { AppLocale } from "@/lib/i18n/config";

export async function getCollectionsForSheet(
  periodInput: DashboardV3PeriodInput,
  locale?: AppLocale
): Promise<DashboardV3CollectionsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);
  return getDashboardCollectionsSheetData({
    agencyId: session.user.agencyId,
    periodInput,
    locale,
  });
}

export async function getDueDepositsForSheet(
  periodInput: DashboardV3PeriodInput,
  locale?: AppLocale
): Promise<DashboardV3DueDepositsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);
  return getDashboardDueDepositsSheetData({
    agencyId: session.user.agencyId,
    periodInput,
    locale,
  });
}

export async function getLateReturnsForSheet(
  periodInput: DashboardV3PeriodInput,
  locale?: AppLocale
): Promise<DashboardV3LateReturnsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);
  return getDashboardLateReturnsSheetData({
    agencyId: session.user.agencyId,
    periodInput,
    locale,
  });
}
