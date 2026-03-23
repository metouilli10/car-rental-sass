import test from "node:test";
import assert from "node:assert/strict";
import type { BookingInvoiceSource } from "./invoice";
import { buildBookingInvoiceData } from "./invoice";

function createInvoiceSource(
  overrides: Partial<BookingInvoiceSource> = {}
): BookingInvoiceSource {
  return {
    id: "book_12345678",
    createdAt: new Date("2026-03-24T09:00:00Z"),
    startDate: new Date("2026-03-25T09:00:00Z"),
    endDate: new Date("2026-03-28T09:00:00Z"),
    pickupLocation: "Aéroport Mohammed V",
    returnLocation: "Casablanca Centre",
    pricePerDay: 400,
    pricingDays: 3,
    pricingHours: 0,
    addonsTotal: 150,
    discountAmount: 50,
    taxEnabled: true,
    taxRate: 20,
    totalHt: 1300,
    totalTva: 260,
    totalTtc: 1560,
    totalPrice: 1560,
    paidNow: 600,
    remainingAmount: 960,
    customer: {
      name: "Sara El Idrissi",
      phone: "0612345678",
      email: "sara@example.com",
      passportOrCIN: "AB123456",
    },
    vehicle: {
      make: "Dacia",
      model: "Logan",
      plate: "12345-A-6",
    },
    agency: {
      name: "Locaryx Casa",
      city: "Casablanca",
      address: "Maarif",
      rcNumber: "RC12345",
      logoUrl: null,
    },
    addons: [
      {
        id: "addon_1",
        label: "Siège bébé",
        quantity: 1,
        unitAmount: 150,
        totalAmount: 150,
      },
    ],
    payments: [
      {
        id: "pay_1",
        amount: 600,
        type: "CARD",
        status: "PAID",
        category: "RENTAL",
        paidAt: new Date("2026-03-24T10:00:00Z"),
        createdAt: new Date("2026-03-24T10:00:00Z"),
      },
      {
        id: "pay_2",
        amount: 1000,
        type: "CASH",
        status: "PAID",
        category: "DEPOSIT",
        paidAt: new Date("2026-03-24T10:05:00Z"),
        createdAt: new Date("2026-03-24T10:05:00Z"),
      },
    ],
    ...overrides,
  };
}

test("uses totalTtc as invoice total when available", () => {
  const invoice = buildBookingInvoiceData(createInvoiceSource());

  assert.equal(invoice.reference, "BOOK_123");
  assert.equal(invoice.totals.totalTtc, 1560);
  assert.equal(invoice.totals.totalHt, 1300);
  assert.equal(invoice.totals.totalTva, 260);
  assert.equal(invoice.totals.rentalBase, 1200);
});

test("falls back to legacy totalPrice when totalTtc is zero", () => {
  const invoice = buildBookingInvoiceData(
    createInvoiceSource({
      taxEnabled: false,
      totalHt: 0,
      totalTva: 120,
      totalTtc: 0,
      totalPrice: 900,
      addonsTotal: 0,
      discountAmount: 0,
      paidNow: 0,
      remainingAmount: 900,
    })
  );

  assert.equal(invoice.totals.totalTtc, 900);
  assert.equal(invoice.totals.totalHt, 900);
  assert.equal(invoice.totals.totalTva, 0);
  assert.equal(invoice.totals.taxRate, 0);
  assert.equal(invoice.totals.remainingAmount, 900);
});

test("includes only paid rental payments in the invoice payment list", () => {
  const invoice = buildBookingInvoiceData(
    createInvoiceSource({
      payments: [
        {
          id: "pay_pending",
          amount: 200,
          type: "CASH",
          status: "PENDING",
          category: "RENTAL",
          paidAt: null,
          createdAt: new Date("2026-03-24T08:00:00Z"),
        },
        {
          id: "pay_rental_paid",
          amount: 600,
          type: "TRANSFER",
          status: "PAID",
          category: "RENTAL",
          paidAt: new Date("2026-03-24T11:00:00Z"),
          createdAt: new Date("2026-03-24T11:00:00Z"),
        },
        {
          id: "pay_deposit_paid",
          amount: 1200,
          type: "CASH",
          status: "PAID",
          category: "DEPOSIT",
          paidAt: new Date("2026-03-24T12:00:00Z"),
          createdAt: new Date("2026-03-24T12:00:00Z"),
        },
      ],
    })
  );

  assert.equal(invoice.payments.length, 1);
  assert.equal(invoice.payments[0]?.id, "pay_rental_paid");
  assert.equal(invoice.payments[0]?.typeLabel, "Virement");
});

test("keeps optional customer and agency fields nullable without breaking totals", () => {
  const invoice = buildBookingInvoiceData(
    createInvoiceSource({
      customer: {
        name: "Youssef",
        phone: "0600000000",
        email: null,
        passportOrCIN: null,
      },
      agency: {
        name: "Locaryx",
        city: "Rabat",
        address: null,
        rcNumber: null,
        logoUrl: null,
      },
    })
  );

  assert.equal(invoice.customer.email, null);
  assert.equal(invoice.customer.passportOrCIN, null);
  assert.equal(invoice.agency.address, null);
  assert.equal(invoice.agency.rcNumber, null);
  assert.equal(invoice.totals.paidAmount, 600);
});
