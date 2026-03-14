import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  calculateFinanceTotals,
  getDepositReleaseBreakdown,
  resolveRetainedDepositAmount,
} from "./finance";

describe("calculateFinanceTotals", () => {
  it("counts rental payment as earned profit", () => {
    const totals = calculateFinanceTotals({
      rentalPayments: [{ amount: 500 }],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [],
    });

    assert.equal(totals.earnedNet, 500);
    assert.equal(totals.cashBalance, 500);
  });

  it("keeps caution receive and return neutral for earned profit", () => {
    const totals = calculateFinanceTotals({
      rentalPayments: [{ amount: 500 }],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [{ amount: 1000 }],
      releasedDeposits: [{ amount: 1000, status: "RETURNED", retainedAmount: 0 }],
    });

    assert.equal(totals.cashIn, 1500);
    assert.equal(totals.cashOut, 1000);
    assert.equal(totals.cashBalance, 500);
    assert.equal(totals.earnedNet, 500);
  });

  it("subtracts refunds from earned profit", () => {
    const totals = calculateFinanceTotals({
      rentalPayments: [{ amount: 900 }],
      refunds: [{ amount: 250 }],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [],
    });

    assert.equal(totals.earnedNet, 650);
  });

  it("treats only retained part of a partial return as earned", () => {
    const totals = calculateFinanceTotals({
      rentalPayments: [],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [{ amount: 1000, status: "PARTIAL_RETURNED", retainedAmount: 300 }],
    });

    assert.equal(totals.cashOut, 700);
    assert.equal(totals.earnedIn, 300);
    assert.equal(totals.earnedNet, 300);
  });

  it("treats forfeited caution as earned with no cash outflow", () => {
    const totals = calculateFinanceTotals({
      rentalPayments: [],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [{ amount: 1000, status: "FORFEITED", retainedAmount: 1000 }],
    });

    assert.equal(totals.cashOut, 0);
    assert.equal(totals.earnedIn, 1000);
    assert.equal(totals.earnedNet, 1000);
  });

  it("defaults legacy manual partial or forfeited deposits to zero retained profit", () => {
    const partial = calculateFinanceTotals({
      rentalPayments: [],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [{ amount: 1000, status: "PARTIAL_RETURNED" }],
    });
    const forfeited = calculateFinanceTotals({
      rentalPayments: [],
      refunds: [],
      cashExpenses: [],
      heldDeposits: [],
      releasedDeposits: [{ amount: 1000, status: "FORFEITED" }],
    });

    assert.equal(partial.cashOut, 1000);
    assert.equal(partial.earnedNet, 0);
    assert.equal(forfeited.cashOut, 0);
    assert.equal(forfeited.earnedNet, 0);
  });
});

describe("deposit retention helpers", () => {
  it("reads retained amount from structured damage reports", () => {
    const retained = resolveRetainedDepositAmount(1000, [
      { deductFromDeposit: true, deductedAmount: 300 },
    ]);

    assert.equal(retained, 300);
  });

  it("returns partial release cash outflow based on retained amount", () => {
    const breakdown = getDepositReleaseBreakdown({
      amount: 1000,
      status: "PARTIAL_RETURNED",
      retainedAmount: 300,
    });

    assert.equal(breakdown.cashOut, 700);
    assert.equal(breakdown.earnedIn, 300);
  });
});
