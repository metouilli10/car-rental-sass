import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { BookingStatus } from "@prisma/client";
import { buildActiveBookingTabs } from "./v3-rules";

function buildBooking(input: {
  id: string;
  status: BookingStatus;
  startDate: string | null;
  endDate: string | null;
  remainingAmount?: number;
}) {
  return {
    id: input.id,
    bookingId: input.id,
    customerName: `Client ${input.id}`,
    vehicleLabel: `Vehicule ${input.id}`,
    plate: `PLT-${input.id}`,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    status: input.status,
    remainingAmount: input.remainingAmount ?? 0,
  };
}

function getTabCount(
  dto: ReturnType<typeof buildActiveBookingTabs>,
  key: "active" | "start_today" | "end_today" | "overdue"
) {
  return dto.tabs.find((tab) => tab.key === key)?.count ?? 0;
}

function hasBooking(
  dto: ReturnType<typeof buildActiveBookingTabs>,
  key: "active" | "start_today" | "end_today" | "overdue",
  bookingId: string
) {
  return dto.tabs.find((tab) => tab.key === key)?.items.some((item) => item.bookingId === bookingId);
}

describe("buildActiveBookingTabs", () => {
  const now = new Date("2026-03-01T10:00:00Z");

  it("puts ACTIVE bookings in En cours", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b1",
          status: "ACTIVE",
          startDate: "2026-03-01T08:00:00Z",
          endDate: "2026-03-03T10:00:00Z",
        }),
      ],
      now,
    });

    assert.equal(getTabCount(dto, "active"), 1);
    assert.equal(hasBooking(dto, "active", "b1"), true);
  });

  it("puts CONFIRMED bookings starting today in Departs aujourd'hui", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b2",
          status: "CONFIRMED",
          startDate: "2026-03-01T12:00:00Z",
          endDate: "2026-03-05T10:00:00Z",
        }),
      ],
      now,
    });

    assert.equal(hasBooking(dto, "start_today", "b2"), true);
  });

  it("puts ACTIVE bookings ending today in Retours aujourd'hui", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b3",
          status: "ACTIVE",
          startDate: "2026-02-28T09:00:00Z",
          endDate: "2026-03-01T18:00:00Z",
        }),
      ],
      now,
    });

    assert.equal(hasBooking(dto, "end_today", "b3"), true);
  });

  it("puts overdue ACTIVE bookings in En retard", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b4",
          status: "ACTIVE",
          startDate: "2026-02-26T09:00:00Z",
          endDate: "2026-02-28T18:00:00Z",
        }),
      ],
      now,
    });

    assert.equal(hasBooking(dto, "overdue", "b4"), true);
  });

  it("allows the same booking to appear in multiple tabs", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b5",
          status: "ACTIVE",
          startDate: "2026-03-01T07:00:00Z",
          endDate: "2026-03-01T09:00:00Z",
          remainingAmount: 250,
        }),
      ],
      now,
    });

    assert.equal(hasBooking(dto, "active", "b5"), true);
    assert.equal(hasBooking(dto, "start_today", "b5"), true);
    assert.equal(hasBooking(dto, "end_today", "b5"), true);
  });

  it("returns empty tabs when there are no matching bookings", () => {
    const dto = buildActiveBookingTabs({
      bookings: [],
      now,
    });

    assert.deepEqual(dto.tabs.map((tab) => tab.count), [0, 0, 0, 0]);
  });

  it("keeps tab counts aligned with rendered items", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b6",
          status: "ACTIVE",
          startDate: "2026-03-01T08:00:00Z",
          endDate: "2026-03-02T08:00:00Z",
        }),
        buildBooking({
          id: "bad",
          status: "CONFIRMED",
          startDate: null,
          endDate: "2026-03-01T12:00:00Z",
        }),
      ],
      now,
    });

    for (const tab of dto.tabs) {
      assert.equal(tab.count, tab.items.length);
    }
  });

  it("keeps ACTIVE bookings without valid dates in En cours but out of date-specific tabs", () => {
    const dto = buildActiveBookingTabs({
      bookings: [
        buildBooking({
          id: "b7",
          status: "ACTIVE",
          startDate: null,
          endDate: null,
        }),
      ],
      now,
    });

    assert.equal(hasBooking(dto, "active", "b7"), true);
    assert.equal(hasBooking(dto, "start_today", "b7"), false);
    assert.equal(hasBooking(dto, "end_today", "b7"), false);
    assert.equal(hasBooking(dto, "overdue", "b7"), false);
  });
});
