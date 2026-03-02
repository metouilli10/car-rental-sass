import test from "node:test";
import assert from "node:assert/strict";
import type { BookingRiskRowInput, BookingOverlapCandidate } from "./risk";
import {
  buildBookingRiskSummary,
  summarizeCustomerRiskHistory,
} from "./risk";

function createBooking(overrides: Partial<BookingRiskRowInput> = {}): BookingRiskRowInput {
  return {
    id: "book_1",
    customerId: "cust_1",
    vehicleId: "veh_1",
    startDate: new Date("2026-03-02T09:00:00Z"),
    endDate: new Date("2026-03-03T09:00:00Z"),
    status: "ACTIVE",
    depositStatus: "RECEIVED",
    ...overrides,
  };
}

function createOverlapCandidate(
  overrides: Partial<BookingOverlapCandidate> = {}
): BookingOverlapCandidate {
  return {
    id: "other_1",
    vehicleId: "veh_1",
    startDate: new Date("2026-03-02T12:00:00Z"),
    endDate: new Date("2026-03-04T09:00:00Z"),
    status: "CONFIRMED",
    ...overrides,
  };
}

test("deposit risk is true only when depositStatus is PENDING", () => {
  const pending = buildBookingRiskSummary({
    booking: createBooking({ depositStatus: "PENDING" }),
    overlapCandidates: [],
    today: new Date("2026-03-02T08:00:00Z"),
  });
  const received = buildBookingRiskSummary({
    booking: createBooking({ depositStatus: "RECEIVED" }),
    overlapCandidates: [],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(pending.hasUnpaidDeposit, true);
  assert.equal(received.hasUnpaidDeposit, false);
});

test("deposit risk is suppressed when a held deposit record exists", () => {
  const summary = buildBookingRiskSummary({
    booking: createBooking({
      depositStatus: "PENDING",
      depositRecordStatus: "HELD",
    }),
    overlapCandidates: [],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.hasUnpaidDeposit, false);
});

test("overlap detection catches intersecting bookings and ignores self", () => {
  const summary = buildBookingRiskSummary({
    booking: createBooking(),
    overlapCandidates: [
      createOverlapCandidate(),
      createOverlapCandidate({ id: "book_1" }),
    ],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.hasOverlapConflict, true);
  assert.equal(summary.overlapCount, 1);
  assert.equal(summary.signals[0]?.kind, "overlap");
});

test("overlap detection ignores canceled and completed bookings", () => {
  const summary = buildBookingRiskSummary({
    booking: createBooking(),
    overlapCandidates: [
      createOverlapCandidate({ status: "CANCELED" }),
      createOverlapCandidate({ id: "other_2", status: "COMPLETED" }),
    ],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.hasOverlapConflict, false);
  assert.equal(summary.overlapCount, 0);
});

test("late risk scores overdue bookings as critical", () => {
  const summary = buildBookingRiskSummary({
    booking: createBooking({
      endDate: new Date("2026-03-01T09:00:00Z"),
    }),
    overlapCandidates: [],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.lateReturnRiskLevel, "critical");
  assert.equal(summary.lateReturnRiskScore, 100);
  assert.equal(summary.lateReturnRiskLabel, "Retour en retard");
});

test("late risk scores tomorrow returns as watch without history", () => {
  const summary = buildBookingRiskSummary({
    booking: createBooking({
      endDate: new Date("2026-03-03T09:00:00Z"),
    }),
    overlapCandidates: [],
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.lateReturnRiskLevel, "watch");
  assert.equal(summary.lateReturnRiskScore, 45);
});

test("history modifiers raise late risk and signal ordering keeps overlap first", () => {
  const customerHistory = summarizeCustomerRiskHistory({
    bookings: [
      {
        status: "COMPLETED",
        infractionCount: 1,
        returnDepositAction: "HOLD",
        hasReturnInspection: true,
      },
      {
        status: "COMPLETED",
        infractionCount: 0,
        returnDepositAction: null,
        hasReturnInspection: false,
      },
    ],
  });

  const summary = buildBookingRiskSummary({
    booking: createBooking({
      endDate: new Date("2026-03-03T09:00:00Z"),
      depositStatus: "PENDING",
    }),
    overlapCandidates: [createOverlapCandidate()],
    customerHistory,
    today: new Date("2026-03-02T08:00:00Z"),
  });

  assert.equal(summary.lateReturnRiskScore, 85);
  assert.equal(summary.lateReturnRiskLevel, "warning");
  assert.deepEqual(summary.signals.map((signal) => signal.kind), ["overlap", "late"]);
});
