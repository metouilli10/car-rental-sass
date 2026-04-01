import test from "node:test";
import assert from "node:assert/strict";
import {
  isPrintInvoicePath,
  requiresAuthForPath,
} from "./middleware-utils";

test("isPrintInvoicePath recognizes invoice routes at app root", () => {
  assert.equal(isPrintInvoicePath("/bookings/abc/invoice"), true);
  assert.equal(isPrintInvoicePath("/reservations/xyz/invoice"), true);
  assert.equal(isPrintInvoicePath("/bookings/abc/invoice/"), true);
  assert.equal(isPrintInvoicePath("/bookings/abc"), false);
});

test("requiresAuthForPath for locale-prefixed dashboard roots", () => {
  assert.equal(requiresAuthForPath("/fr/dashboard"), true);
  assert.equal(requiresAuthForPath("/ar/vehicles/add"), true);
  assert.equal(requiresAuthForPath("/fr"), false);
  assert.equal(requiresAuthForPath("/login"), false);
});

test("requiresAuthForPath for print invoices without locale", () => {
  assert.equal(requiresAuthForPath("/bookings/x/invoice"), true);
});
