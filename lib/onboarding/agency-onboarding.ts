import { prisma } from "@/lib/prisma";

const GUIDED_ONBOARDING_ROLLOUT_AT = new Date("2026-02-28T11:00:00.000Z");

type ComputedOnboardingState = {
  vehicleAdded: boolean;
  reservationCreated: boolean;
  paymentRecorded: boolean;
};

type PersistedOnboardingState = ComputedOnboardingState & {
  dashboardExplored: boolean;
  completed: boolean;
  dismissed: boolean;
};

export function isAgencyEligibleForGuidedOnboarding(createdAt: Date): boolean {
  return createdAt >= GUIDED_ONBOARDING_ROLLOUT_AT;
}

export async function computeAgencyOnboardingState(
  agencyId: string,
): Promise<ComputedOnboardingState> {
  const [vehicle, booking, payment, paidBooking] = await Promise.all([
    prisma.vehicle.findFirst({
      where: {
        agencyId,
        status: { in: ["AVAILABLE", "RENTED", "MAINTENANCE"] },
      },
      select: { id: true },
    }),
    prisma.booking.findFirst({
      where: {
        agencyId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
      },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: {
        booking: { agencyId },
        status: "PAID",
        amount: { gt: 0 },
      },
      select: { id: true },
    }),
    prisma.booking.findFirst({
      where: {
        agencyId,
        paidNow: { gt: 0 },
      },
      select: { id: true },
    }),
  ]);

  return {
    vehicleAdded: Boolean(vehicle),
    reservationCreated: Boolean(booking),
    paymentRecorded: Boolean(payment || paidBooking),
  };
}

export async function syncAgencyOnboardingState(
  agencyId: string,
  overrides?: Partial<{
    dashboardExplored: boolean;
    dismissed: boolean;
  }>,
): Promise<PersistedOnboardingState> {
  const [computed, agency] = await Promise.all([
    computeAgencyOnboardingState(agencyId),
    prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        createdAt: true,
        onboardingVehicleAdded: true,
        onboardingReservationCreated: true,
        onboardingPaymentRecorded: true,
        onboardingDashboardExplored: true,
        onboardingCompleted: true,
        onboardingDismissed: true,
      },
    }),
  ]);

  if (!agency) {
    throw new Error("Agence introuvable");
  }

  if (!isAgencyEligibleForGuidedOnboarding(agency.createdAt)) {
    return {
      ...computed,
      dashboardExplored: false,
      completed: false,
      dismissed: true,
    };
  }

  const dashboardExplored =
    overrides?.dashboardExplored ?? agency.onboardingDashboardExplored;
  const dismissed = overrides?.dismissed ?? agency.onboardingDismissed;
  const completed =
    computed.vehicleAdded &&
    computed.reservationCreated &&
    computed.paymentRecorded &&
    dashboardExplored;

  const nextState: PersistedOnboardingState = {
    vehicleAdded: computed.vehicleAdded,
    reservationCreated: computed.reservationCreated,
    paymentRecorded: computed.paymentRecorded,
    dashboardExplored,
    completed,
    dismissed: completed ? false : dismissed,
  };

  const changed =
    agency.onboardingVehicleAdded !== nextState.vehicleAdded ||
    agency.onboardingReservationCreated !== nextState.reservationCreated ||
    agency.onboardingPaymentRecorded !== nextState.paymentRecorded ||
    agency.onboardingDashboardExplored !== nextState.dashboardExplored ||
    agency.onboardingCompleted !== nextState.completed ||
    agency.onboardingDismissed !== nextState.dismissed;

  if (changed) {
    await prisma.agency.update({
      where: { id: agencyId },
      data: {
        onboardingVehicleAdded: nextState.vehicleAdded,
        onboardingReservationCreated: nextState.reservationCreated,
        onboardingPaymentRecorded: nextState.paymentRecorded,
        onboardingDashboardExplored: nextState.dashboardExplored,
        onboardingCompleted: nextState.completed,
        onboardingDismissed: nextState.dismissed,
      },
    });
  }

  return nextState;
}

export async function markAgencyDashboardExplored(agencyId: string) {
  return syncAgencyOnboardingState(agencyId, { dashboardExplored: true });
}

export async function dismissAgencyOnboarding(agencyId: string) {
  return syncAgencyOnboardingState(agencyId, { dismissed: true });
}

export async function resetAgencyOnboardingDismissal(agencyId: string) {
  return syncAgencyOnboardingState(agencyId, { dismissed: false });
}
