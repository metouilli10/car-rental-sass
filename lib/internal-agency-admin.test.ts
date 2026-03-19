import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDateInputValue,
  getAgencySubscriptionState,
  parseDateInputValue,
} from "@/lib/internal-agency-admin";

describe("getAgencySubscriptionState", () => {
  it("returns unpaid when subscription is not paid", () => {
    const state = getAgencySubscriptionState({
      subscriptionPaid: false,
      subscriptionEndsAt: null,
      now: new Date("2026-03-18T09:00:00.000Z"),
    });

    assert.equal(state.tone, "unpaid");
    assert.equal(state.label, "Unpaid");
  });

  it("returns active when paid and end date is in the future", () => {
    const state = getAgencySubscriptionState({
      subscriptionPaid: true,
      subscriptionEndsAt: new Date("2026-03-25T00:00:00.000Z"),
      now: new Date("2026-03-18T09:00:00.000Z"),
    });

    assert.equal(state.tone, "active");
    assert.match(state.description, /Paid until/);
  });

  it("returns expired when paid end date is in the past", () => {
    const state = getAgencySubscriptionState({
      subscriptionPaid: true,
      subscriptionEndsAt: new Date("2026-03-10T00:00:00.000Z"),
      now: new Date("2026-03-18T09:00:00.000Z"),
    });

    assert.equal(state.tone, "expired");
    assert.match(state.description, /Ended on/);
  });
});

describe("date input helpers", () => {
  it("formats date values for HTML date inputs", () => {
    assert.equal(
      formatDateInputValue(new Date("2026-03-18T12:34:56.000Z")),
      "2026-03-18",
    );
    assert.equal(formatDateInputValue(null), "");
  });

  it("parses valid date input values", () => {
    const parsed = parseDateInputValue("2026-04-01");
    assert.equal(parsed?.toISOString(), "2026-04-01T00:00:00.000Z");
  });

  it("treats empty input as null", () => {
    assert.equal(parseDateInputValue(""), null);
  });
});
