import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveVehicleWorkspace,
  normalizeVehicleProfileTab,
  type VehicleComplianceItem,
  type VehicleInfractionItem,
  type VehicleInspectionHistoryItem,
  type VehicleProfileData,
  type VehicleReminderItem,
  type VehicleReservationHistoryItem,
} from "@/lib/vehicles/profile";

function createVehicle(
  overrides: Partial<VehicleProfileData["vehicle"]> = {},
): VehicleProfileData["vehicle"] {
  return {
    id: "veh_1",
    make: "Renault",
    model: "Clio",
    brandKey: "renault",
    year: 2024,
    plate: "123-A-45",
    color: "Gris",
    status: "AVAILABLE",
    pricePerDay: 420,
    depositAmount: 3000,
    gearbox: "AUTO",
    fuelType: "ESSENCE",
    seats: 5,
    hasAC: true,
    category: "Citadine",
    photoUrl: null,
    publishedToWebsite: false,
    mileage: 12000,
    currentKm: 12950,
    maintenanceNotes: null,
    insuranceProvider: "AXA",
    insurancePolicyNumber: "INS-123",
    insuranceStartDate: new Date("2026-01-01"),
    insuranceExpiryDate: new Date("2027-01-01"),
    lastTechnicalInspectionDate: new Date("2026-01-15"),
    nextTechnicalInspectionDate: new Date("2027-01-15"),
    vignetteExpiryDate: new Date("2027-02-01"),
    lastOilChangeMileageKm: 10000,
    lastOilChangeDate: new Date("2026-02-01"),
    nextOilChangeMileageKm: 15000,
    nextOilChangeDate: new Date("2026-12-01"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-04-01"),
    ...overrides,
  };
}

function createComplianceItem(
  id: VehicleComplianceItem["id"],
  label: string,
  status: VehicleComplianceItem["status"],
): VehicleComplianceItem {
  return {
    id,
    type:
      id === "insurance"
        ? "INSURANCE"
        : id === "technical-inspection"
        ? "TECHNICAL_INSPECTION"
        : id === "vignette"
        ? "VIGNETTE"
        : "REGISTRATION",
    label,
    documentId: null,
    reference: null,
    startDate: null,
    expiryDate: new Date("2026-12-31"),
    fileUrl: null,
    status,
    statusLabel:
      status === "ok"
        ? "Conforme"
        : status === "soon"
        ? "Expire bientôt"
        : status === "overdue"
        ? "Expiré"
        : "À renseigner",
    helperText:
      status === "ok"
        ? "Aucune action immédiate"
        : status === "soon"
        ? "À surveiller prochainement"
        : status === "overdue"
        ? "Action requise"
        : "Information manquante",
  };
}

function createReservation(overrides: Partial<VehicleReservationHistoryItem> = {}): VehicleReservationHistoryItem {
  return {
    id: "booking_1",
    customerName: "Client Test",
    customerId: "customer_1",
    startDate: new Date("2026-04-10"),
    endDate: new Date("2026-04-13"),
    totalPrice: 1260,
    paymentStatus: "PAID",
    depositStatus: "RECEIVED",
    status: "CONFIRMED",
    pickupLocation: "Casablanca",
    returnLocation: "Casablanca",
    ...overrides,
  };
}

function createInspection(
  overrides: Partial<VehicleInspectionHistoryItem> = {},
): VehicleInspectionHistoryItem {
  return {
    id: "insp_1",
    reportedAt: new Date("2026-04-02"),
    inspectionType: "DEPART",
    bookingId: "booking_1",
    bookingStatus: "COMPLETED",
    customerName: "Client Test",
    customerId: "customer_1",
    fuelLevel: "3/4",
    cleanliness: "Propre",
    totalDamageCost: 0,
    damageCount: 0,
    photosCount: 4,
    ...overrides,
  };
}

function createReminder(overrides: Partial<VehicleReminderItem> = {}): VehicleReminderItem {
  return {
    id: "rem_1",
    type: "OIL_CHANGE",
    title: "Vidange à faire",
    body: "Planifier l’entretien",
    dueAt: new Date("2026-04-05"),
    dueMileageKm: null,
    severity: "due",
    status: "OPEN",
    updatedAt: new Date("2026-04-05"),
    ...overrides,
  };
}

function createInfraction(overrides: Partial<VehicleInfractionItem> = {}): VehicleInfractionItem {
  return {
    id: "inf_1",
    date: new Date("2026-04-01"),
    type: "PARKING",
    status: "PENDING",
    amount: 150,
    notes: null,
    bookingId: null,
    assignedClientName: null,
    customerId: null,
    ...overrides,
  };
}

function createWorkspaceInput(overrides: {
  vehicle?: Partial<VehicleProfileData["vehicle"]>;
  currentReservation?: VehicleReservationHistoryItem | null;
  nextReservation?: VehicleReservationHistoryItem | null;
  latestInspection?: VehicleInspectionHistoryItem | null;
  reminders?: Partial<VehicleProfileData["reminders"]>;
  compliance?: VehicleComplianceItem[];
  infractions?: VehicleInfractionItem[];
} = {}) {
  return {
    vehicle: createVehicle(overrides.vehicle),
    currentReservation: overrides.currentReservation ?? null,
    nextReservation: overrides.nextReservation ?? null,
    latestInspection:
      Object.prototype.hasOwnProperty.call(overrides, "latestInspection")
        ? overrides.latestInspection ?? null
        : createInspection(),
    reminders: {
      overdue: [],
      open: [],
      done: [],
      nextOilChange: createComplianceItem("technical-inspection", "Prochaine vidange", "ok"),
      ...overrides.reminders,
    },
    compliance:
      overrides.compliance ??
      [
        createComplianceItem("insurance", "Assurance", "ok"),
        createComplianceItem("technical-inspection", "Visite technique", "ok"),
        createComplianceItem("vignette", "Vignette", "ok"),
        createComplianceItem("registration", "Carte grise", "ok"),
      ],
    infractions: overrides.infractions ?? [],
  };
}

test("deriveVehicleWorkspace returns a healthy workspace when everything is valid", () => {
  const workspace = deriveVehicleWorkspace(createWorkspaceInput());

  assert.equal(workspace.canGoOutToday.value, true);
  assert.equal(workspace.complianceSummary.status, "ok");
  assert.equal(workspace.complianceSummary.summaryText, "Tous les éléments sont conformes");
  assert.equal(workspace.actionRequiredItems.length, 0);
  assert.equal(workspace.actionStrip, null);
  assert.equal(workspace.currentKilometrageKnown, true);
});

test("deriveVehicleWorkspace surfaces missing insurance and unknown kilometrage as blockers", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      vehicle: { currentKm: null },
      compliance: [
        createComplianceItem("insurance", "Assurance", "missing"),
        createComplianceItem("technical-inspection", "Visite technique", "ok"),
        createComplianceItem("vignette", "Vignette", "ok"),
        createComplianceItem("registration", "Carte grise", "ok"),
      ],
    }),
  );

  assert.equal(workspace.canGoOutToday.value, false);
  assert.match(workspace.missingCriticalItems.join(", "), /Assurance à renseigner/);
  assert.match(workspace.missingCriticalItems.join(", "), /Kilométrage non mis à jour/);
  assert.equal(workspace.actionRequiredItems[0]?.actionLabel, "Ajouter assurance");
  assert.equal(workspace.complianceSummary.summaryText, "1 élément à compléter");
  assert.equal(workspace.actionStrip?.primaryAction.href, "/vehicles/veh_1/edit");
  assert.equal(workspace.actionStrip?.secondaryAction?.href, "/vehicles/veh_1?tab=documents");
});

test("deriveVehicleWorkspace marks an expired technical inspection as blocked", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      compliance: [
        createComplianceItem("insurance", "Assurance", "ok"),
        createComplianceItem("technical-inspection", "Visite technique", "overdue"),
        createComplianceItem("vignette", "Vignette", "ok"),
        createComplianceItem("registration", "Carte grise", "ok"),
      ],
    }),
  );

  assert.equal(workspace.complianceSummary.status, "overdue");
  assert.equal(workspace.complianceSummary.summaryText, "1 élément à compléter");
  assert.match(workspace.actionRequiredItems.map((item) => item.label).join(", "), /Visite technique/);
});

test("deriveVehicleWorkspace exposes expiring soon items as warnings when there is no blocker", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      compliance: [
        createComplianceItem("insurance", "Assurance", "ok"),
        createComplianceItem("technical-inspection", "Visite technique", "ok"),
        createComplianceItem("vignette", "Vignette", "soon"),
        createComplianceItem("registration", "Carte grise", "ok"),
      ],
    }),
  );

  assert.equal(workspace.canGoOutToday.value, true);
  assert.equal(workspace.complianceSummary.summaryText, "1 élément expire bientôt");
  assert.match(workspace.expiringSoonItems.join(", "), /Vignette expire bientôt/);
  assert.equal(workspace.actionRequiredItems[0]?.tone, "warning");
  assert.equal(workspace.actionStrip?.primaryAction.href, "/vehicles/veh_1?tab=documents");
  assert.equal(workspace.actionStrip?.secondaryAction, null);
});

test("deriveVehicleWorkspace keeps rented vehicles unavailable even when compliance is healthy", () => {
  const currentReservation = createReservation({
    status: "ACTIVE",
    startDate: new Date("2026-04-08"),
    endDate: new Date("2026-04-12"),
  });

  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      vehicle: { status: "RENTED" },
      currentReservation,
    }),
  );

  assert.equal(workspace.vehicleAvailabilityStatus.label, "Loué");
  assert.equal(workspace.canGoOutToday.value, false);
  assert.match(workspace.vehicleAvailabilityStatus.detail, /En location jusqu’au/);
});

test("deriveVehicleWorkspace keeps operational context for missing bookings, inspections, and open infractions", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      latestInspection: null,
      infractions: [createInfraction(), createInfraction({ id: "inf_2", status: "ASSIGNED" })],
    }),
  );

  assert.equal(workspace.nextBooking, null);
  assert.equal(workspace.lastInspection, null);
  assert.equal(workspace.openInfractionsCount, 2);
});

test("deriveVehicleWorkspace includes overdue reminders as action items", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      reminders: {
        overdue: [createReminder({ type: "TECH_INSPECTION" })],
        open: [createReminder()],
      },
    }),
  );

  assert.match(workspace.actionRequiredItems.map((item) => item.label).join(", "), /Vidange à faire/);
  assert.equal(
    workspace.actionRequiredItems.find((item) => item.id === "reminder-rem_1")?.href,
    "/vehicles/veh_1?tab=tracking&sheet=1&reminder=inspection",
  );
});

test("deriveVehicleWorkspace points oil-change actions to the preselected reminder sheet", () => {
  const workspace = deriveVehicleWorkspace(
    createWorkspaceInput({
      reminders: {
        overdue: [],
        open: [],
        done: [],
        nextOilChange: createComplianceItem("technical-inspection", "Prochaine vidange", "overdue"),
      },
    }),
  );

  assert.equal(
    workspace.actionRequiredItems.find((item) => item.id === "overdue-oil-change")?.href,
    "/vehicles/veh_1?tab=tracking&sheet=1&reminder=oil",
  );
  assert.equal(workspace.actionStrip?.primaryAction.href, "/vehicles/veh_1?tab=tracking&sheet=1&reminder=oil");
});

test("normalizeVehicleProfileTab maps legacy tabs to the new workspace tabs", () => {
  assert.equal(normalizeVehicleProfileTab("overview"), "overview");
  assert.equal(normalizeVehicleProfileTab("inspections"), "tracking");
  assert.equal(normalizeVehicleProfileTab("maintenance"), "tracking");
  assert.equal(normalizeVehicleProfileTab("infractions"), "tracking");
  assert.equal(normalizeVehicleProfileTab("compliance"), "documents");
  assert.equal(normalizeVehicleProfileTab("unknown"), undefined);
});
