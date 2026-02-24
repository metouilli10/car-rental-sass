/**
 * Tests for caisse happenedAt rules and refund date behaviour.
 * Run with: node --import tsx --test lib/dashboard/caisse.test.ts
 */

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { getMovementHappenedAt } from "./caisse";

describe("getMovementHappenedAt", () => {
  const base = {
    createdAt: new Date("2026-02-24T10:00:00Z"),
    updatedAt: new Date("2026-02-24T12:00:00Z"),
  };

  it("payment: uses paidAt when set", () => {
    const paidAt = new Date("2026-02-24T09:00:00Z");
    const out = getMovementHappenedAt(
      { ...base, paidAt },
      "payment"
    );
    assert.equal(out.getTime(), paidAt.getTime());
  });

  it("payment: fallback to createdAt when paidAt is null (legacy)", () => {
    const out = getMovementHappenedAt(
      { ...base, paidAt: null },
      "payment"
    );
    assert.equal(out.getTime(), base.createdAt.getTime());
  });

  it("deposit_received: uses heldAt when set", () => {
    const heldAt = new Date("2026-02-24T08:00:00Z");
    const out = getMovementHappenedAt(
      { ...base, heldAt },
      "deposit_received"
    );
    assert.equal(out.getTime(), heldAt.getTime());
  });

  it("deposit_returned: uses returnedAt when set", () => {
    const returnedAt = new Date("2026-02-24T18:00:00Z");
    const out = getMovementHappenedAt(
      { ...base, returnedAt },
      "deposit_returned"
    );
    assert.equal(out.getTime(), returnedAt.getTime());
  });

  it("deposit_returned: fallback to createdAt when returnedAt is null (legacy)", () => {
    const out = getMovementHappenedAt(
      { ...base, returnedAt: null },
      "deposit_returned"
    );
    assert.equal(out.getTime(), base.createdAt.getTime());
  });

  it("refund: uses updatedAt (REFUNDED; until refundedAt exists)", () => {
    const out = getMovementHappenedAt(
      { ...base },
      "refund"
    );
    assert.equal(out.getTime(), base.updatedAt.getTime());
  });
});
