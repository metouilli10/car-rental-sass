import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVehicleImportPreview,
  buildVehicleUpdatePayload,
  inferVehicleImportMapping,
  normalizeImportedPlate,
  normalizeVehicleImportRow,
} from "@/lib/vehicles/import";

describe("inferVehicleImportMapping", () => {
  it("matches common spreadsheet headers", () => {
    const mapping = inferVehicleImportMapping([
      "Marque",
      "Modele",
      "Immatriculation",
      "Annee",
      "Prix / jour",
      "Couleur",
      "Boite",
    ]);

    assert.equal(mapping.make, "Marque");
    assert.equal(mapping.model, "Modele");
    assert.equal(mapping.plate, "Immatriculation");
    assert.equal(mapping.year, "Annee");
    assert.equal(mapping.pricePerDay, "Prix / jour");
    assert.equal(mapping.color, "Couleur");
    assert.equal(mapping.gearbox, "Boite");
  });
});

describe("normalizeImportedPlate", () => {
  it("uppercases and strips separators", () => {
    assert.equal(normalizeImportedPlate(" 123-a-45 "), "123A45");
    assert.equal(normalizeImportedPlate("ww 9876"), "WW9876");
  });
});

describe("normalizeVehicleImportRow", () => {
  it("coerces spreadsheet values into a valid import row", () => {
    const result = normalizeVehicleImportRow(
      {
        Marque: "Dacia",
        Modele: "Logan",
        Annee: "2024",
        Immatriculation: "123-a-45",
        Couleur: "Blanc",
        "Prix / jour": "350",
        Statut: "Disponible",
        Boite: "Automatique",
        Clim: "Oui",
      },
      {
        make: "Marque",
        model: "Modele",
        year: "Annee",
        plate: "Immatriculation",
        color: "Couleur",
        pricePerDay: "Prix / jour",
        status: "Statut",
        gearbox: "Boite",
        hasAC: "Clim",
      },
    );

    assert.deepEqual(result.errors, []);
    assert.equal(result.normalized?.plate, "123A45");
    assert.equal(result.normalized?.status, "AVAILABLE");
    assert.equal(result.normalized?.gearbox, "AUTO");
    assert.equal(result.normalized?.hasAC, true);
  });

  it("reports invalid status values", () => {
    const result = normalizeVehicleImportRow(
      {
        Marque: "Renault",
        Modele: "Clio",
        Annee: "2024",
        Immatriculation: "456-b-78",
        Couleur: "Gris",
        Prix: "400",
        Statut: "En attente",
      },
      {
        make: "Marque",
        model: "Modele",
        year: "Annee",
        plate: "Immatriculation",
        color: "Couleur",
        pricePerDay: "Prix",
        status: "Statut",
      },
    );

    assert.notEqual(result.normalized, null);
    assert.match(result.errors.join(", "), /Statut invalide/);
  });
});

describe("buildVehicleImportPreview", () => {
  it("classifies create, update and duplicate skip rows deterministically", () => {
    const preview = buildVehicleImportPreview({
      rows: [
        {
          Marque: "Dacia",
          Modele: "Logan",
          Annee: "2024",
          Plaque: "123-A-45",
          Couleur: "Blanc",
          Prix: "300",
        },
        {
          Marque: "Renault",
          Modele: "Clio",
          Annee: "2025",
          Plaque: "999-B-88",
          Couleur: "Noir",
          Prix: "420",
        },
        {
          Marque: "Peugeot",
          Modele: "208",
          Annee: "2024",
          Plaque: "999 B 88",
          Couleur: "Rouge",
          Prix: "430",
        },
      ],
      mapping: {
        make: "Marque",
        model: "Modele",
        year: "Annee",
        plate: "Plaque",
        color: "Couleur",
        pricePerDay: "Prix",
      },
      existingVehicles: [{ id: "veh_1", plate: "123A45" }],
    });

    assert.deepEqual(preview.counts, { create: 1, update: 1, skip: 1 });
    assert.equal(preview.rows[0].action, "update");
    assert.equal(preview.rows[1].action, "create");
    assert.equal(preview.rows[2].action, "skip");
    assert.match(preview.rows[2].errors.join(", "), /Plaque dupliquee/);
  });
});

describe("buildVehicleUpdatePayload", () => {
  it("does not overwrite optional fields when they are absent from the import", () => {
    const payload = buildVehicleUpdatePayload({
      make: "Dacia",
      model: "Logan",
      year: 2024,
      plate: "123A45",
      color: "Blanc",
      pricePerDay: 350,
    });

    assert.equal("depositAmount" in payload, false);
    assert.equal("gearbox" in payload, false);
    assert.equal(payload.brandKey, "dacia");
  });
});
