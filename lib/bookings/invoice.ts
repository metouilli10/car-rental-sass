import type { PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BookingInvoiceSource = {
  id: string;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  pickupLocation: string | null;
  returnLocation: string | null;
  pricePerDay: number;
  pricingDays: number;
  pricingHours: number;
  addonsTotal: number;
  discountAmount: number;
  taxEnabled: boolean;
  taxRate: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  totalPrice: number;
  paidNow: number;
  remainingAmount: number;
  customer: {
    name: string;
    phone: string;
    email: string | null;
    passportOrCIN: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    plate: string;
  };
  agency: {
    name: string;
    city: string;
    address: string | null;
    rcNumber: string | null;
    logoUrl: string | null;
  };
  addons: Array<{
    id: string;
    label: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    type: PaymentType;
    status: "PENDING" | "PAID" | "REFUNDED";
    category: "RENTAL" | "DEPOSIT" | "REFUND";
    paidAt: Date | null;
    createdAt: Date;
  }>;
};

export type BookingInvoiceData = {
  reference: string;
  invoiceDate: Date;
  bookingDate: Date;
  rentalPeriod: {
    startDate: Date;
    endDate: Date;
    durationText: string;
    pricePerDay: number;
  };
  pickupLocation: string | null;
  returnLocation: string | null;
  agency: BookingInvoiceSource["agency"];
  customer: BookingInvoiceSource["customer"];
  vehicle: BookingInvoiceSource["vehicle"];
  totals: {
    rentalBase: number;
    addonsTotal: number;
    discountAmount: number;
    totalHt: number;
    taxRate: number;
    totalTva: number;
    totalTtc: number;
    paidAmount: number;
    remainingAmount: number;
  };
  addons: BookingInvoiceSource["addons"];
  payments: Array<{
    id: string;
    amount: number;
    type: PaymentType;
    typeLabel: string;
    paidAt: Date | null;
  }>;
};

const paymentTypeLabels: Record<PaymentType, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  TRANSFER: "Virement",
  CMI: "CMI",
  OTHER: "Autre",
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveInvoiceTotal(input: Pick<BookingInvoiceSource, "totalTtc" | "totalPrice">): number {
  return input.totalTtc > 0 ? input.totalTtc : input.totalPrice;
}

function resolveTotalHt(
  input: Pick<BookingInvoiceSource, "totalHt" | "taxEnabled" | "totalTtc" | "totalPrice">
): number {
  if (input.totalHt > 0 || input.taxEnabled) {
    return input.totalHt;
  }

  return resolveInvoiceTotal(input);
}

function buildDurationText(pricingDays: number, pricingHours: number): string {
  const dayPart = pricingDays > 0 ? `${pricingDays} jour${pricingDays > 1 ? "s" : ""}` : null;
  const hourPart = pricingHours > 0 ? `${pricingHours} heure${pricingHours > 1 ? "s" : ""}` : null;

  if (dayPart && hourPart) {
    return `${dayPart} et ${hourPart}`;
  }

  if (dayPart) {
    return dayPart;
  }

  if (hourPart) {
    return hourPart;
  }

  return "Durée non renseignée";
}

export function buildBookingInvoiceData(input: BookingInvoiceSource): BookingInvoiceData {
  const totalTtc = roundCurrency(resolveInvoiceTotal(input));
  const totalHt = roundCurrency(resolveTotalHt(input));
  const addonsTotal = roundCurrency(input.addonsTotal ?? 0);
  const discountAmount = roundCurrency(input.discountAmount ?? 0);
  const rentalBase = roundCurrency(Math.max(0, totalHt - addonsTotal + discountAmount));
  const paidAmount = roundCurrency(input.paidNow ?? 0);
  const remainingAmount = roundCurrency(Math.max(0, input.remainingAmount ?? totalTtc - paidAmount));

  return {
    reference: input.id.slice(0, 8).toUpperCase(),
    invoiceDate: input.createdAt,
    bookingDate: input.createdAt,
    rentalPeriod: {
      startDate: input.startDate,
      endDate: input.endDate,
      durationText: buildDurationText(input.pricingDays, input.pricingHours),
      pricePerDay: roundCurrency(input.pricePerDay),
    },
    pickupLocation: input.pickupLocation,
    returnLocation: input.returnLocation,
    agency: input.agency,
    customer: input.customer,
    vehicle: input.vehicle,
    totals: {
      rentalBase,
      addonsTotal,
      discountAmount,
      totalHt,
      taxRate: input.taxEnabled ? input.taxRate : 0,
      totalTva: roundCurrency(input.taxEnabled ? input.totalTva : 0),
      totalTtc,
      paidAmount,
      remainingAmount,
    },
    addons: input.addons.map((addon) => ({
      ...addon,
      unitAmount: roundCurrency(addon.unitAmount),
      totalAmount: roundCurrency(addon.totalAmount),
    })),
    payments: input.payments
      .filter((payment) => payment.category === "RENTAL" && payment.status === "PAID")
      .sort((left, right) => {
        const leftTime = left.paidAt?.getTime() ?? left.createdAt.getTime();
        const rightTime = right.paidAt?.getTime() ?? right.createdAt.getTime();
        return leftTime - rightTime;
      })
      .map((payment) => ({
        id: payment.id,
        amount: roundCurrency(payment.amount),
        type: payment.type,
        typeLabel: paymentTypeLabels[payment.type] ?? payment.type,
        paidAt: payment.paidAt,
      })),
  };
}

export async function getBookingInvoiceData(bookingId: string, agencyId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      agencyId,
    },
    select: {
      id: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      pickupLocation: true,
      returnLocation: true,
      pricePerDay: true,
      pricingDays: true,
      pricingHours: true,
      addonsTotal: true,
      discountAmount: true,
      taxEnabled: true,
      taxRate: true,
      totalHt: true,
      totalTva: true,
      totalTtc: true,
      totalPrice: true,
      paidNow: true,
      remainingAmount: true,
      customer: {
        select: {
          name: true,
          phone: true,
          email: true,
          passportOrCIN: true,
        },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
          plate: true,
        },
      },
      agency: {
        select: {
          name: true,
          city: true,
          address: true,
          rcNumber: true,
          logoUrl: true,
        },
      },
      addons: {
        select: {
          id: true,
          label: true,
          quantity: true,
          unitAmount: true,
          totalAmount: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          category: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  return buildBookingInvoiceData(booking);
}
