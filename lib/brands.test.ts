import test from "node:test";
import assert from "node:assert/strict";
import { brandKeyFromMake, brandLogoSrc, normalizeMake } from "./brands";

test("normalizeMake removes accents and collapses separators", () => {
  assert.equal(normalizeMake(" Citroën "), "citroen");
  assert.equal(normalizeMake("Škoda"), "skoda");
  assert.equal(normalizeMake("Mercedes-Benz"), "mercedes benz");
  assert.equal(normalizeMake("Land__Rover"), "land rover");
});

test("brandKeyFromMake maps aliases and falls back to other", () => {
  assert.equal(brandKeyFromMake("Renault"), "renault");
  assert.equal(brandKeyFromMake("Citroën"), "citroen");
  assert.equal(brandKeyFromMake("VW"), "volkswagen");
  assert.equal(brandKeyFromMake("mercedes-benz"), "mercedes");
  assert.equal(brandKeyFromMake("MercedesBenz"), "mercedes");
  assert.equal(brandKeyFromMake("Unknown Brand"), "other");
  assert.equal(brandKeyFromMake("Porsche"), "porsche");
  assert.equal(brandKeyFromMake("porshe"), "porsche");
});

test("brandLogoSrc resolves known and fallback assets", () => {
  assert.equal(brandLogoSrc("renault"), "/brands/renault.svg");
  assert.equal(brandLogoSrc("porsche"), "/brands/porsche.svg");
  assert.equal(brandLogoSrc("other"), "/brands/generic-car.svg");
  assert.equal(brandLogoSrc("unknown"), "/brands/generic-car.svg");
});
