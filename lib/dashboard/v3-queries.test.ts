import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { DashboardLiveBookingRow, DashboardLiveData } from "./v3-queries";
import {
  buildActiveBookingsDTOFromLiveData,
  buildCollectionsSheetDTO,
  buildDueDepositsSheetDTO,
  buildLateReturnsSheetDTO,
} from "./v3-queries";

function buildLiveBooking(
  input: Partial<DashboardLiveBookingRow> & Pick<DashboardLiveBookingRow, "id" | "vehicleId" | "status">
): DashboardLiveBookingRow {
  return {
    id: input.id,
    vehicleId: input.vehicleId,
    startDate: input.startDate ?? new Date("2026-03-01T09:00:00Z"),
    endDate: input.endDate ?? new Date("2026-03-02T09:00:00Z"),
    actualReturnDate: input.actualReturnDate ?? null,
    status: input.status,
    totalPrice: input.totalPrice ?? 1000,
    totalTtc: input.totalTtc ?? 1000,
    taxEnabled: input.taxEnabled ?? false,
    discountAmount: input.discountAmount ?? 0,
    addonsTotal: input.addonsTotal ?? 0,
    remainingAmount: input.remainingAmount ?? null,
    paidNow: input.paidNow ?? 0,
    customer: input.customer ?? { name: `Client ${input.id}` },
    vehicle: input.vehicle ?? { make: "Dacia", model: input.id, plate: `PLT-${input.id}` },
    payments: input.payments ?? [],
  };
}

function buildLiveDeposit(
  input: Partial<DashboardLiveData["deposits"][number]> &
    Pick<DashboardLiveData["deposits"][number], "id" | "amount" | "status" | "bookingId">
): DashboardLiveData["deposits"][number] {
  return {
    id: input.id,
    amount: input.amount,
    status: input.status,
    heldAt: input.heldAt ?? new Date("2026-03-01T08:00:00Z"),
    returnedAt: input.returnedAt ?? null,
    bookingId: input.bookingId,
    booking: input.booking ?? {
      id: input.bookingId,
      status: "ACTIVE",
      endDate: new Date("2026-03-01T16:00:00Z"),
      actualReturnDate: null,
      customer: { name: `Client ${input.id}` },
      vehicle: { make: "Renault", model: input.id, plate: `DEP-${input.id}` },
      damageReports: [],
    },
  };
}

describe("dashboard v3 derived DTOs", () => {
  const now = new Date("2026-03-01T10:00:00Z");

  it("builds active booking tabs from live data and computes remaining amount fallback", () => {
    const dto = buildActiveBookingsDTOFromLiveData({
      now,
      liveBookings: [
        buildLiveBooking({
          id: "active",
          vehicleId: "veh-1",
          status: "ACTIVE",
          startDate: new Date("2026-02-28T09:00:00Z"),
          endDate: new Date("2026-03-01T18:00:00Z"),
          totalPrice: 1000,
          paidNow: 300,
        }),
        buildLiveBooking({
          id: "start-today",
          vehicleId: "veh-2",
          status: "CONFIRMED",
          startDate: new Date("2026-03-01T12:00:00Z"),
          endDate: new Date("2026-03-03T12:00:00Z"),
          remainingAmount: 250,
        }),
      ],
    });

    const activeTab = dto.tabs.find((tab) => tab.key === "active");
    const startTodayTab = dto.tabs.find((tab) => tab.key === "start_today");
    const endTodayTab = dto.tabs.find((tab) => tab.key === "end_today");

    assert.equal(activeTab?.items.some((item) => item.bookingId === "active"), true);
    assert.equal(startTodayTab?.items.some((item) => item.bookingId === "start-today"), true);
    assert.equal(endTodayTab?.items.some((item) => item.bookingId === "active"), true);
    assert.equal(activeTab?.items.find((item) => item.bookingId === "active")?.remainingAmount, 700);
  });

  it("builds collections sheet entries only for outstanding bookings and flags overdue items", () => {
    const dto = buildCollectionsSheetDTO({
      now,
      liveBookings: [
        buildLiveBooking({
          id: "late",
          vehicleId: "veh-1",
          status: "ACTIVE",
          startDate: new Date("2026-02-28T08:00:00Z"),
          endDate: new Date("2026-03-02T09:00:00Z"),
          totalPrice: 1000,
          payments: [{ amount: 400 }],
        }),
        buildLiveBooking({
          id: "future",
          vehicleId: "veh-2",
          status: "CONFIRMED",
          startDate: new Date("2026-03-02T09:00:00Z"),
          endDate: new Date("2026-03-04T09:00:00Z"),
          remainingAmount: 250,
        }),
        buildLiveBooking({
          id: "settled",
          vehicleId: "veh-3",
          status: "ACTIVE",
          remainingAmount: 0,
        }),
      ],
    });

    assert.equal(dto.count, 2);
    assert.equal(dto.overdueCount, 1);
    assert.equal(dto.totalAmount, 850);
    assert.equal(dto.items[0]?.bookingId, "late");
    assert.match(dto.items[0]?.dueLabel ?? "", /En retard depuis/);
  });

  it("builds due deposits sheet entries only for held deposits ready to release", () => {
    const dto = buildDueDepositsSheetDTO({
      now,
      deposits: [
        buildLiveDeposit({
          id: "due",
          bookingId: "b1",
          amount: 1200,
          status: "HELD",
          booking: {
            id: "b1",
            status: "ACTIVE",
            endDate: new Date("2026-03-01T08:00:00Z"),
            actualReturnDate: null,
            customer: { name: "Salma" },
            vehicle: { make: "Peugeot", model: "208", plate: "123-A-1" },
            damageReports: [],
          },
        }),
        buildLiveDeposit({
          id: "not-due",
          bookingId: "b2",
          amount: 900,
          status: "HELD",
          booking: {
            id: "b2",
            status: "ACTIVE",
            endDate: new Date("2026-03-02T08:00:00Z"),
            actualReturnDate: null,
            customer: { name: "Amine" },
            vehicle: { make: "Hyundai", model: "i10", plate: "456-B-2" },
            damageReports: [],
          },
        }),
      ],
    });

    assert.equal(dto.count, 1);
    assert.equal(dto.totalAmount, 1200);
    assert.equal(dto.items[0]?.depositId, "due");
    assert.equal(dto.items[0]?.isOverdue, true);
    assert.match(dto.items[0]?.dueLabel ?? "", /En retard depuis/);
  });

  it("builds late return sheet entries sorted by exposure then customer name", () => {
    const dto = buildLateReturnsSheetDTO({
      now,
      liveBookings: [
        buildLiveBooking({
          id: "highest",
          vehicleId: "veh-1",
          status: "ACTIVE",
          endDate: new Date("2026-02-28T10:00:00Z"),
          remainingAmount: 500,
          customer: { name: "Zineb" },
        }),
        buildLiveBooking({
          id: "alpha",
          vehicleId: "veh-2",
          status: "ACTIVE",
          endDate: new Date("2026-02-28T08:00:00Z"),
          remainingAmount: 0,
          customer: { name: "Adam" },
        }),
        buildLiveBooking({
          id: "beta",
          vehicleId: "veh-3",
          status: "ACTIVE",
          endDate: new Date("2026-02-28T09:00:00Z"),
          remainingAmount: 0,
          customer: { name: "Brahim" },
        }),
        buildLiveBooking({
          id: "not-late",
          vehicleId: "veh-4",
          status: "ACTIVE",
          endDate: new Date("2026-03-01T18:00:00Z"),
          remainingAmount: 300,
        }),
      ],
    });

    assert.equal(dto.count, 3);
    assert.equal(dto.exposedCount, 1);
    assert.equal(dto.totalAmount, 500);
    assert.deepEqual(
      dto.items.map((item) => item.bookingId),
      ["highest", "alpha", "beta"]
    );
  });
});
