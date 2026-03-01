"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { resolveDashboardV3Period, type DashboardV3PeriodInput } from "@/lib/dashboard/ranges";
import { computeBookingDue, computeOutstanding } from "@/lib/dashboard/rules";
import {
  getCollectionDueDate,
  isCollectionOverdue,
  isDepositReleaseDue,
  sortCollectionItems,
  sortDepositItems,
} from "@/lib/dashboard/v3-rules";
import type {
  DashboardV3CollectionsSheetDTO,
  DashboardV3DueDepositsSheetDTO,
  DashboardV3LateReturnsSheetDTO,
} from "@/lib/dashboard/types";

export async function getCollectionsForSheet(
  periodInput: DashboardV3PeriodInput
): Promise<DashboardV3CollectionsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: session.user.agencyId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
    },
    select: {
      id: true,
      startDate: true,
      status: true,
      totalPrice: true,
      totalTtc: true,
      taxEnabled: true,
      discountAmount: true,
      addonsTotal: true,
      remainingAmount: true,
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
      payments: {
        where: {
          status: "PAID",
          category: "RENTAL",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  const items = sortCollectionItems(
    bookings
      .map((booking) => {
        const due = computeBookingDue({
          totalPrice: booking.totalPrice,
          totalTtc: booking.totalTtc,
          taxEnabled: booking.taxEnabled,
          discountAmount: booking.discountAmount,
          addonsTotal: booking.addonsTotal,
        });
        const paidAmount = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const outstanding = computeOutstanding(due, paidAmount);
        if (outstanding <= 0) return null;

        const dueDate = getCollectionDueDate(booking);
        const isOverdue = isCollectionOverdue(booking, outstanding, now);
        const customerName = booking.customer.name;
        const vehicleLabel = `${booking.vehicle.make} ${booking.vehicle.model}`;
        const plate = booking.vehicle.plate;

        return {
          id: booking.id,
          bookingId: booking.id,
          customerName,
          vehicleLabel,
          plate,
          amount: outstanding,
          dueLabel: isOverdue
            ? `En retard depuis ${formatDateTime(dueDate)}`
            : `A encaisser avant ${formatDateTime(dueDate)}`,
          isOverdue,
          primaryHref: `/bookings/${booking.id}`,
          label: `${customerName} - ${vehicleLabel}`,
          sublabel: plate,
          primaryAction: "Encaisser",
          actionType: "collection" as const,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  ).map((item) => ({
    id: item.id,
    bookingId: item.bookingId!,
    customerName: item.customerName!,
    vehicleLabel: item.vehicleLabel!,
    plate: item.plate!,
    amount: item.amount ?? 0,
    dueLabel: item.dueLabel ?? "",
    isOverdue: Boolean(item.isOverdue),
    primaryHref: item.primaryHref,
  }));

  return {
    count: items.length,
    overdueCount: items.filter((item) => item.isOverdue).length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

export async function getDueDepositsForSheet(
  periodInput: DashboardV3PeriodInput
): Promise<DashboardV3DueDepositsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);

  const deposits = await prisma.deposit.findMany({
    where: {
      booking: { agencyId: session.user.agencyId },
      status: "HELD",
    },
    select: {
      id: true,
      amount: true,
      status: true,
      bookingId: true,
      booking: {
        select: {
          id: true,
          status: true,
          endDate: true,
          actualReturnDate: true,
          customer: { select: { name: true } },
          vehicle: { select: { make: true, model: true, plate: true } },
        },
      },
    },
  });

  const items = sortDepositItems(
    deposits
      .filter((deposit) => isDepositReleaseDue(deposit, deposit.booking, now))
      .map((deposit) => {
        const dueDate = deposit.booking.actualReturnDate ?? deposit.booking.endDate;
        const isOverdue = dueDate.getTime() < now.getTime();
        const customerName = deposit.booking.customer.name;
        const vehicleLabel = `${deposit.booking.vehicle.make} ${deposit.booking.vehicle.model}`;
        const plate = deposit.booking.vehicle.plate;

        return {
          id: deposit.id,
          depositId: deposit.id,
          bookingId: deposit.bookingId,
          customerName,
          vehicleLabel,
          plate,
          amount: deposit.amount,
          dueLabel: isOverdue
            ? `En retard depuis ${formatDateTime(dueDate)}`
            : `A liberer le ${formatDateTime(dueDate)}`,
          isOverdue,
          primaryHref: `/bookings/${deposit.bookingId}`,
          label: `${customerName} - ${vehicleLabel}`,
          sublabel: `${plate} - caution en attente`,
          primaryAction: "Liberer",
          actionType: "deposit_release" as const,
        };
      })
  ).map((item) => ({
    id: item.id,
    depositId: item.depositId!,
    bookingId: item.bookingId!,
    customerName: item.customerName!,
    vehicleLabel: item.vehicleLabel!,
    plate: item.plate!,
    amount: item.amount ?? 0,
    dueLabel: item.dueLabel ?? "",
    isOverdue: Boolean(item.isOverdue),
    primaryHref: item.primaryHref,
  }));

  return {
    count: items.length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

export async function getLateReturnsForSheet(
  periodInput: DashboardV3PeriodInput
): Promise<DashboardV3LateReturnsSheetDTO> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.agencyId) {
    throw new Error("Non autorise");
  }

  const now = new Date();
  resolveDashboardV3Period(periodInput, now);

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: session.user.agencyId,
      status: { notIn: ["COMPLETED", "CANCELED"] },
      endDate: { lt: now },
    },
    select: {
      id: true,
      endDate: true,
      status: true,
      totalPrice: true,
      totalTtc: true,
      taxEnabled: true,
      discountAmount: true,
      addonsTotal: true,
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
      payments: {
        where: {
          status: "PAID",
          category: "RENTAL",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  const items = bookings
    .map((booking) => {
      const due = computeBookingDue({
        totalPrice: booking.totalPrice,
        totalTtc: booking.totalTtc,
        taxEnabled: booking.taxEnabled,
        discountAmount: booking.discountAmount,
        addonsTotal: booking.addonsTotal,
      });
      const paidAmount = booking.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstanding = computeOutstanding(due, paidAmount);
      const customerName = booking.customer.name;
      const vehicleLabel = `${booking.vehicle.make} ${booking.vehicle.model}`;
      const plate = booking.vehicle.plate;

      return {
        id: booking.id,
        bookingId: booking.id,
        customerName,
        vehicleLabel,
        plate,
        dueLabel: `Retour en retard depuis ${formatDateTime(booking.endDate)}`,
        isOverdue: true,
        amount: outstanding > 0 ? outstanding : undefined,
        primaryHref: `/bookings/${booking.id}`,
      };
    })
    .sort((a, b) => {
      if ((a.amount ?? 0) !== (b.amount ?? 0)) return (b.amount ?? 0) - (a.amount ?? 0);
      return a.customerName.localeCompare(b.customerName);
    });

  return {
    count: items.length,
    exposedCount: items.filter((item) => (item.amount ?? 0) > 0).length,
    totalAmount: items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    items,
  };
}
