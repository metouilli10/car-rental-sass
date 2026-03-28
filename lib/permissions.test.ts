import test from "node:test";
import assert from "node:assert/strict";
import {
  getEffectivePermissions,
  getRoleDefaultPermissions,
  normalizeUserPermissions,
  sanitizePermissionPatch,
} from "@/lib/permissions";

test("owner resolves every permission to true", () => {
  const permissions = getEffectivePermissions("OWNER", null);

  for (const value of Object.values(permissions)) {
    assert.equal(value, true);
  }
});

test("manager default matrix matches expected scope", () => {
  const permissions = getRoleDefaultPermissions("MANAGER");

  assert.equal(permissions["finance.view"], false);
  assert.equal(permissions["caisse.view"], false);
  assert.equal(permissions["users.manage"], false);
  assert.equal(permissions["vehicles.manage"], true);
  assert.equal(permissions["vehicles.delete"], false);
  assert.equal(permissions["customers.delete"], true);
  assert.equal(permissions["bookings.delete"], false);
});

test("employee default matrix matches expected scope", () => {
  const permissions = getRoleDefaultPermissions("EMPLOYEE");

  assert.equal(permissions["finance.view"], false);
  assert.equal(permissions["caisse.view"], false);
  assert.equal(permissions["users.manage"], false);
  assert.equal(permissions["vehicles.manage"], false);
  assert.equal(permissions["vehicles.delete"], false);
  assert.equal(permissions["customers.manage"], true);
  assert.equal(permissions["bookings.delete"], false);
});

test("overrides can allow a denied role default", () => {
  const permissions = getEffectivePermissions("EMPLOYEE", {
    "finance.view": true,
  });

  assert.equal(permissions["finance.view"], true);
});

test("overrides can deny an allowed role default", () => {
  const permissions = getEffectivePermissions("MANAGER", {
    "customers.delete": false,
  });

  assert.equal(permissions["customers.delete"], false);
});

test("missing overrides fall back to role default", () => {
  const permissions = getEffectivePermissions("EMPLOYEE", null);

  assert.equal(permissions["customers.delete"], false);
  assert.equal(permissions["bookings.view"], true);
});

test("unknown override keys are ignored by normalization", () => {
  const normalized = normalizeUserPermissions({
    "finance.view": true,
    "unknown.permission": true,
  });

  assert.equal(normalized?.["finance.view"], true);
  assert.equal(normalized?.["dashboard.view"], false);
});

test("invalid keys are rejected by patch sanitization", () => {
  const result = sanitizePermissionPatch({
    "finance.view": true,
    "invalid.key": false,
  });

  assert.equal(result.normalized?.["finance.view"], true);
  assert.equal(result.normalized?.["dashboard.view"], false);
  assert.deepEqual(result.invalidKeys, ["invalid.key"]);
});
