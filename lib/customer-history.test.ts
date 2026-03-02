import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerHistoryRows,
  computeCustomerMetrics,
  getLatestReturnInspection,
  getReturnCondition,
  type CustomerHistoryBooking,
  type CustomerHistoryInfraction,
} from "./customer-history";

function createInfraction(overrides: Partial<CustomerHistoryInfraction> = {}): CustomerHistoryInfraction {
  return {
    id: "inf_1",
    date: new Date("2026-01-15T10:00:00Z"),
    status: "ASSIGNED",
    type: "OTHER",
    amount: 400,
    bookingId: "book_1",
    notes: null,
    ...overrides,
  };
}

function createBooking(overrides: Partial<CustomerHistoryBooking> = {}): CustomerHistoryBooking {
  return {
    id: "book_1",
    startDate: new Date("2026-01-10T09:00:00Z"),
    endDate: new Date("2026-01-12T09:00:00Z"),
    actualReturnDate: null,
    createdAt: new Date("2026-01-01T09:00:00Z"),
    totalPrice: 1200,
    remainingAmount: 0,
    status: "COMPLETED",
    notes: null,
    vehicle: {
      make: "Dacia",
      model: "Logan",
      plate: "123-A-45",
    },
    infractions: [],
    damageReports: [],
    ...overrides,
  };
}

test("getLatestReturnInspection selects the newest RETOUR report", () => {
  const booking = createBooking({
    damageReports: [
      {
        id: "dep_1",
        inspectionType: "DEPART",
        reportedAt: new Date("2026-01-10T08:00:00Z"),
        depositAction: "RELEASE",
        deductFromDeposit: false,
        deductedAmount: 0,
        cleanliness: "Propre",
        totalDamageCost: 0,
      },
      {
        id: "ret_1",
        inspectionType: "RETOUR",
        reportedAt: new Date("2026-01-12T09:00:00Z"),
        depositAction: "PARTIAL",
        deductFromDeposit: true,
        deductedAmount: 100,
        cleanliness: "Sale",
        totalDamageCost: 100,
      },
      {
        id: "ret_2",
        inspectionType: "RETOUR",
        reportedAt: new Date("2026-01-12T11:00:00Z"),
        depositAction: "RELEASE",
        deductFromDeposit: false,
        deductedAmount: 0,
        cleanliness: "Propre",
        totalDamageCost: 0,
      },
    ],
  });

  assert.equal(getLatestReturnInspection(booking)?.id, "ret_2");
});

test("getReturnCondition maps deposit action to good, bad, or missing", () => {
  assert.equal(getReturnCondition({ depositAction: "RELEASE" }), "GOOD");
  assert.equal(getReturnCondition({ depositAction: "PARTIAL" }), "BAD");
  assert.equal(getReturnCondition({ depositAction: "HOLD" }), "BAD");
  assert.equal(getReturnCondition(null), "MISSING");
});

test("buildCustomerHistoryRows includes return condition and infraction count", () => {
  const booking = createBooking({
    infractions: [createInfraction(), createInfraction({ id: "inf_2" })],
    damageReports: [
      {
        id: "ret_1",
        inspectionType: "RETOUR",
        reportedAt: new Date("2026-01-12T09:00:00Z"),
        depositAction: "PARTIAL",
        deductFromDeposit: true,
        deductedAmount: 100,
        cleanliness: "Sale",
        totalDamageCost: 100,
      },
    ],
  });

  const [row] = buildCustomerHistoryRows([booking]);

  assert.equal(row.returnCondition, "BAD");
  assert.equal(row.bookingInfractionCount, 2);
  assert.equal(row.returnInspectionId, "ret_1");
});

test("computeCustomerMetrics ignores canceled bookings for reservation totals", () => {
  const completed = createBooking({
    damageReports: [
      {
        id: "ret_good",
        inspectionType: "RETOUR",
        reportedAt: new Date("2026-01-12T09:00:00Z"),
        depositAction: "RELEASE",
        deductFromDeposit: false,
        deductedAmount: 0,
        cleanliness: "Propre",
        totalDamageCost: 0,
      },
    ],
  });

  const canceled = createBooking({
    id: "book_2",
    status: "CANCELED",
    totalPrice: 500,
    damageReports: [
      {
        id: "ret_bad",
        inspectionType: "RETOUR",
        reportedAt: new Date("2026-01-13T09:00:00Z"),
        depositAction: "HOLD",
        deductFromDeposit: true,
        deductedAmount: 500,
        cleanliness: "Sale",
        totalDamageCost: 500,
      },
    ],
  });

  const pendingInspection = createBooking({
    id: "book_3",
    totalPrice: 900,
  });

  const metrics = computeCustomerMetrics(
    [completed, canceled, pendingInspection],
    [createInfraction(), createInfraction({ id: "inf_2", bookingId: null })]
  );

  assert.deepEqual(metrics, {
    totalReservations: 2,
    totalRevenue: 2100,
    totalInfractions: 2,
    goodReturns: 1,
    badReturns: 1,
  });
});
