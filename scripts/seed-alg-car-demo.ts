import { PrismaClient, ReminderType, VehicleDocumentType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const OWNER_EMAIL = "owner@automaroc.ma";
const DEMO_EMPLOYEE_EMAIL = "demo.agent@algcar.ma";

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
    include: {
      agency: true,
    },
  });

  if (!owner) {
    throw new Error(`Owner account not found for ${OWNER_EMAIL}`);
  }

  const agencyId = owner.agencyId;
  const today = startOfDay(new Date());
  const passwordHash = await hash("password123", 10);

  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId },
    orderBy: { createdAt: "asc" },
  });

  const vehicleByPlate = new Map(vehicles.map((vehicle) => [vehicle.plate.toLowerCase(), vehicle]));
  const pickVehicle = (plate: string, fallbackIndex: number) => {
    const vehicle = vehicleByPlate.get(plate.toLowerCase()) ?? vehicles[fallbackIndex];
    if (!vehicle) {
      throw new Error(`Not enough vehicles found in agency ${agencyId}`);
    }
    return vehicle;
  };

  const mercedes = pickVehicle("B-67890-20", 0);
  const seatLeon = pickVehicle("A-77833-33", 1);
  const duster = pickVehicle("2262-a-11", 2);
  const yaris = pickVehicle("D-44556-20", 3);
  const i10 = pickVehicle("C-11223-20", 4);
  const ibiza = pickVehicle("a-6330-23", 5);
  const corolla = pickVehicle("E-77889-20", 6);

  await prisma.user.upsert({
    where: { email: DEMO_EMPLOYEE_EMAIL },
    update: {
      name: "Nadia Benyoussef",
      password: passwordHash,
      role: "EMPLOYEE",
      isActive: true,
      agencyId,
    },
    create: {
      email: DEMO_EMPLOYEE_EMAIL,
      password: passwordHash,
      name: "Nadia Benyoussef",
      role: "EMPLOYEE",
      agencyId,
    },
  });

  const demoCustomers = [
    {
      id: "demo-alg-customer-vip",
      customerType: "PERSONNE_PHYSIQUE" as const,
      name: "Salma Rami",
      email: "salma.rami@demo.algcar.ma",
      phone: "+212661445577",
      passportOrCIN: "BK563201",
      address: "Maarif, Casablanca",
      nationality: "Marocaine",
      licenseNumber: "MA-993214",
      licenseExpiry: addDays(today, 420),
    },
    {
      id: "demo-alg-customer-corp",
      customerType: "PERSONNE_MORALE" as const,
      name: "Atlas Events SARL",
      email: "fleet@atlasevents.ma",
      phone: "+212522778899",
      passportOrCIN: "IF998877",
      address: "Sidi Maarouf, Casablanca",
      nationality: "Marocaine",
      ice: "002345678000099",
      rc: "456789",
      representativeName: "Omar El Fassi",
    },
    {
      id: "demo-alg-customer-family",
      customerType: "PERSONNE_PHYSIQUE" as const,
      name: "Mehdi Chraibi",
      email: "mehdi.chraibi@demo.algcar.ma",
      phone: "+212663880044",
      passportOrCIN: "CN772145",
      address: "Gueliz, Marrakech",
      nationality: "Marocaine",
      licenseNumber: "MA-110245",
      licenseExpiry: addDays(today, 180),
    },
  ];

  for (const customer of demoCustomers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        ...customer,
        agencyId,
      },
      create: {
        ...customer,
        agencyId,
      },
    });
  }

  await prisma.vehicle.update({
    where: { id: mercedes.id },
    data: {
      status: "RENTED",
      currentKm: 58240,
      nextMaintenanceKm: 60000,
      lastOilChangeMileageKm: 52000,
      lastOilChangeDate: addDays(today, -70),
      oilChangeIntervalKm: 8000,
      oilChangeIntervalMonths: 6,
      nextOilChangeMileageKm: 60000,
      insuranceProvider: "Wafa Assurance",
      insurancePolicyNumber: "ALG-MB-2026-001",
      insuranceStartDate: addDays(today, -120),
      insuranceExpiryDate: addDays(today, 12),
      insuranceReminderDays: [30, 15, 7],
      lastTechnicalInspectionDate: addDays(today, -330),
      nextTechnicalInspectionDate: addDays(today, 18),
      technicalInspectionReminderDays: [30, 14, 7],
      vignetteExpiryDate: addDays(today, 8),
      vignetteReminderDays: [30, 7, 3],
      maintenanceNotes: "Vehicule premium prepare pour demos commerciales.",
    },
  });

  await prisma.vehicle.update({
    where: { id: duster.id },
    data: {
      status: "AVAILABLE",
      currentKm: 34780,
      nextMaintenanceKm: 36000,
      lastOilChangeMileageKm: 30000,
      lastOilChangeDate: addDays(today, -90),
      oilChangeIntervalKm: 6000,
      oilChangeIntervalMonths: 6,
      nextOilChangeMileageKm: 36000,
      insuranceProvider: "AtlantaSanad",
      insurancePolicyNumber: "ALG-DD-2026-017",
      insuranceStartDate: addDays(today, -160),
      insuranceExpiryDate: addDays(today, 40),
      insuranceReminderDays: [30, 15, 7],
      lastTechnicalInspectionDate: addDays(today, -350),
      nextTechnicalInspectionDate: addDays(today, -2),
      technicalInspectionReminderDays: [30, 15, 7],
      vignetteExpiryDate: addDays(today, 5),
      vignetteReminderDays: [30, 10, 5],
    },
  });

  await prisma.vehicle.update({
    where: { id: seatLeon.id },
    data: {
      status: "AVAILABLE",
      currentKm: 22890,
      insuranceProvider: "RMA",
      insurancePolicyNumber: "ALG-SL-2026-002",
      insuranceStartDate: addDays(today, -140),
      insuranceExpiryDate: addDays(today, 55),
      lastTechnicalInspectionDate: addDays(today, -200),
      nextTechnicalInspectionDate: addDays(today, 45),
      vignetteExpiryDate: addDays(today, 60),
    },
  });

  const demoBookings = [
    {
      id: "demo-alg-booking-active",
      vehicleId: mercedes.id,
      customerId: "demo-alg-customer-vip",
      startDate: addDays(today, -1),
      endDate: addDays(today, 3),
      actualReturnDate: null,
      pricePerDay: 950,
      totalPrice: 3800,
      depositAmount: 5000,
      status: "ACTIVE" as const,
      paymentStatus: "PARTIAL" as const,
      depositStatus: "RECEIVED" as const,
      notes: "Cliente VIP. Livraison aeroport Mohammed V.",
      pickupLocation: "Aeroport Mohammed V",
      returnLocation: "Agence Maarif",
      hasFullInsurance: true,
      pricingDays: 4,
      pricingHours: 0,
      addonsTotal: 350,
      totalHt: 3450,
      totalTva: 350,
      totalTtc: 3800,
      paidNow: 2000,
      remainingAmount: 1800,
      flowVersion: "demo-v2",
    },
    {
      id: "demo-alg-booking-confirmed",
      vehicleId: duster.id,
      customerId: "demo-alg-customer-corp",
      startDate: addDays(today, 4),
      endDate: addDays(today, 9),
      actualReturnDate: null,
      pricePerDay: 420,
      totalPrice: 2100,
      depositAmount: 2500,
      status: "CONFIRMED" as const,
      paymentStatus: "PARTIAL" as const,
      depositStatus: "PENDING" as const,
      notes: "Mission corporate a Rabat. Facturation mensuelle demandee.",
      pickupLocation: "Agence Centre Ville",
      returnLocation: "Agence Centre Ville",
      hasFullInsurance: false,
      pricingDays: 5,
      pricingHours: 0,
      addonsTotal: 120,
      totalHt: 1980,
      totalTva: 120,
      totalTtc: 2100,
      paidNow: 1000,
      remainingAmount: 1100,
      flowVersion: "demo-v2",
    },
    {
      id: "demo-alg-booking-completed",
      vehicleId: seatLeon.id,
      customerId: "demo-alg-customer-family",
      startDate: addDays(today, -10),
      endDate: addDays(today, -6),
      actualReturnDate: addDays(today, -6),
      pricePerDay: 430,
      totalPrice: 1720,
      depositAmount: 3000,
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      depositStatus: "RETURNED" as const,
      notes: "Retour avec petit impact sur pare-chocs arriere.",
      pickupLocation: "Marrakech Gare",
      returnLocation: "Agence Centre Ville",
      hasFullInsurance: false,
      pricingDays: 4,
      pricingHours: 0,
      addonsTotal: 0,
      totalHt: 1560,
      totalTva: 160,
      totalTtc: 1720,
      paidNow: 1720,
      remainingAmount: 0,
      flowVersion: "demo-v2",
    },
    {
      id: "demo-alg-booking-draft",
      vehicleId: yaris.id,
      customerId: "demo-alg-customer-vip",
      startDate: addDays(today, 11),
      endDate: addDays(today, 14),
      actualReturnDate: null,
      pricePerDay: 360,
      totalPrice: 1080,
      depositAmount: 2000,
      status: "DRAFT" as const,
      paymentStatus: "PENDING" as const,
      depositStatus: "PENDING" as const,
      notes: "Demande en attente de validation WhatsApp.",
      pickupLocation: "Agence Maarif",
      returnLocation: "Aeroport Mohammed V",
      hasFullInsurance: true,
      pricingDays: 3,
      pricingHours: 0,
      addonsTotal: 90,
      totalHt: 990,
      totalTva: 90,
      totalTtc: 1080,
      paidNow: 0,
      remainingAmount: 1080,
      flowVersion: "demo-v2",
    },
    {
      id: "demo-alg-calendar-week-completed-yaris",
      vehicleId: yaris.id,
      customerId: "demo-alg-customer-family",
      startDate: addDays(today, -5),
      endDate: addDays(today, -3),
      actualReturnDate: addDays(today, -3),
      pricePerDay: 360,
      totalPrice: 1080,
      depositAmount: 2000,
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      depositStatus: "RETURNED" as const,
      notes: "Reservation courte pour remplir le calendrier semaine en cours.",
      pickupLocation: "Agence Maarif",
      returnLocation: "Agence Maarif",
      hasFullInsurance: false,
      pricingDays: 3,
      pricingHours: 0,
      addonsTotal: 0,
      totalHt: 980,
      totalTva: 100,
      totalTtc: 1080,
      paidNow: 1080,
      remainingAmount: 0,
      flowVersion: "demo-calendar",
    },
    {
      id: "demo-alg-calendar-week-active-i10",
      vehicleId: i10.id,
      customerId: "demo-alg-customer-vip",
      startDate: addDays(today, -2),
      endDate: addDays(today, 1),
      actualReturnDate: null,
      pricePerDay: 240,
      totalPrice: 960,
      depositAmount: 1200,
      status: "ACTIVE" as const,
      paymentStatus: "PAID" as const,
      depositStatus: "RECEIVED" as const,
      notes: "Location week-end encore en cours.",
      pickupLocation: "Centre Ville",
      returnLocation: "Aeroport Mohammed V",
      hasFullInsurance: false,
      pricingDays: 4,
      pricingHours: 0,
      addonsTotal: 0,
      totalHt: 880,
      totalTva: 80,
      totalTtc: 960,
      paidNow: 960,
      remainingAmount: 0,
      flowVersion: "demo-calendar",
    },
    {
      id: "demo-alg-calendar-week-confirmed-ibiza",
      vehicleId: ibiza.id,
      customerId: "demo-alg-customer-corp",
      startDate: today,
      endDate: addDays(today, 3),
      actualReturnDate: null,
      pricePerDay: 410,
      totalPrice: 1640,
      depositAmount: 1800,
      status: "CONFIRMED" as const,
      paymentStatus: "PARTIAL" as const,
      depositStatus: "PENDING" as const,
      notes: "Depart le week-end pour un besoin corporate visible au calendrier.",
      pickupLocation: "Agence Centre Ville",
      returnLocation: "Agence Centre Ville",
      hasFullInsurance: true,
      pricingDays: 4,
      pricingHours: 0,
      addonsTotal: 140,
      totalHt: 1500,
      totalTva: 140,
      totalTtc: 1640,
      paidNow: 700,
      remainingAmount: 940,
      flowVersion: "demo-calendar",
    },
    {
      id: "demo-alg-calendar-week-draft-corolla",
      vehicleId: corolla.id,
      customerId: "demo-alg-customer-family",
      startDate: addDays(today, 1),
      endDate: addDays(today, 2),
      actualReturnDate: null,
      pricePerDay: 350,
      totalPrice: 700,
      depositAmount: 1500,
      status: "DRAFT" as const,
      paymentStatus: "PENDING" as const,
      depositStatus: "PENDING" as const,
      notes: "Option client a confirmer, utile pour le filtre brouillon.",
      pickupLocation: "Agence Maarif",
      returnLocation: "Agence Maarif",
      hasFullInsurance: false,
      pricingDays: 2,
      pricingHours: 0,
      addonsTotal: 0,
      totalHt: 640,
      totalTva: 60,
      totalTtc: 700,
      paidNow: 0,
      remainingAmount: 700,
      flowVersion: "demo-calendar",
    },
  ];

  for (const booking of demoBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        ...booking,
        agencyId,
      },
      create: {
        ...booking,
        agencyId,
      },
    });
  }

  const demoPayments = [
    {
      id: "demo-alg-payment-active-1",
      bookingId: "demo-alg-booking-active",
      amount: 2000,
      type: "CARD" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: addDays(today, -1),
    },
    {
      id: "demo-alg-payment-confirmed-1",
      bookingId: "demo-alg-booking-confirmed",
      amount: 1000,
      type: "TRANSFER" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: today,
    },
    {
      id: "demo-alg-payment-completed-1",
      bookingId: "demo-alg-booking-completed",
      amount: 1720,
      type: "CMI" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: addDays(today, -10),
    },
    {
      id: "demo-alg-payment-calendar-yaris",
      bookingId: "demo-alg-calendar-week-completed-yaris",
      amount: 1080,
      type: "CARD" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: addDays(today, -5),
    },
    {
      id: "demo-alg-payment-calendar-i10",
      bookingId: "demo-alg-calendar-week-active-i10",
      amount: 960,
      type: "CASH" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: addDays(today, -2),
    },
    {
      id: "demo-alg-payment-calendar-ibiza",
      bookingId: "demo-alg-calendar-week-confirmed-ibiza",
      amount: 700,
      type: "TRANSFER" as const,
      category: "RENTAL" as const,
      status: "PAID" as const,
      paidAt: today,
    },
  ];

  for (const payment of demoPayments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: payment,
      create: payment,
    });
  }

  const demoDeposits = [
    {
      bookingId: "demo-alg-booking-active",
      amount: 5000,
      status: "HELD" as const,
      heldAt: addDays(today, -1),
      returnedAt: null,
      notes: "Caution recue en empreinte TPE.",
    },
    {
      bookingId: "demo-alg-booking-confirmed",
      amount: 2500,
      status: "HELD" as const,
      heldAt: today,
      returnedAt: null,
      notes: "Caution bloquee avant depart mission corporate.",
    },
    {
      bookingId: "demo-alg-booking-completed",
      amount: 3000,
      status: "PARTIAL_RETURNED" as const,
      heldAt: addDays(today, -10),
      returnedAt: addDays(today, -6),
      notes: "Retenue de 600 MAD pour peinture pare-chocs.",
    },
    {
      bookingId: "demo-alg-calendar-week-completed-yaris",
      amount: 2000,
      status: "RETURNED" as const,
      heldAt: addDays(today, -5),
      returnedAt: addDays(today, -3),
      notes: "Caution rendue apres retour standard.",
    },
    {
      bookingId: "demo-alg-calendar-week-active-i10",
      amount: 1200,
      status: "HELD" as const,
      heldAt: addDays(today, -2),
      returnedAt: null,
      notes: "Caution bloquee jusqu'au retour demain.",
    },
    {
      bookingId: "demo-alg-calendar-week-confirmed-ibiza",
      amount: 1800,
      status: "HELD" as const,
      heldAt: today,
      returnedAt: null,
      notes: "Caution deja enregistree avant le depart.",
    },
  ];

  for (const deposit of demoDeposits) {
    await prisma.deposit.upsert({
      where: { bookingId: deposit.bookingId },
      update: deposit,
      create: deposit,
    });
  }

  await prisma.damageReport.upsert({
    where: { id: "demo-alg-damage-report-completed" },
    update: {
      bookingId: "demo-alg-booking-completed",
      inspectionType: "RETOUR",
      fuelLevel: "3/4",
      cleanliness: "Correct",
      notes: "Rayure et leger enfoncement sur pare-chocs arriere.",
      depositAction: "PARTIAL",
      totalDamageCost: 600,
      deductFromDeposit: true,
      deductedAmount: 600,
      reportedAt: addDays(today, -6),
    },
    create: {
      id: "demo-alg-damage-report-completed",
      bookingId: "demo-alg-booking-completed",
      inspectionType: "RETOUR",
      fuelLevel: "3/4",
      cleanliness: "Correct",
      notes: "Rayure et leger enfoncement sur pare-chocs arriere.",
      depositAction: "PARTIAL",
      totalDamageCost: 600,
      deductFromDeposit: true,
      deductedAmount: 600,
      reportedAt: addDays(today, -6),
      sections: {
        create: [
          {
            id: "demo-alg-damage-section-body",
            sectionType: "CARROSSERIE",
            status: "DAMAGE",
            notes: "Pare-chocs arriere a reprendre.",
            damageCost: 600,
          },
          {
            id: "demo-alg-damage-section-tires",
            sectionType: "PNEUS",
            status: "OK",
            damageCost: 0,
          },
          {
            id: "demo-alg-damage-section-interior",
            sectionType: "INTERIEUR",
            status: "OK",
            damageCost: 0,
          },
        ],
      },
    },
  });

  const demoExpenses = [
    {
      id: "demo-alg-expense-maintenance",
      agencyId,
      date: addDays(today, -8),
      category: "MAINTENANCE" as const,
      amount: "980.00",
      method: "CASH" as const,
      vehicleId: seatLeon.id,
      note: "Polissage et retouche peinture apres retour client.",
    },
    {
      id: "demo-alg-expense-fuel",
      agencyId,
      date: addDays(today, -3),
      category: "CARBURANT" as const,
      amount: "420.00",
      method: "CARD" as const,
      vehicleId: mercedes.id,
      note: "Plein avant livraison VIP aeroport.",
    },
    {
      id: "demo-alg-expense-insurance",
      agencyId,
      date: addDays(today, -1),
      category: "ASSURANCE" as const,
      amount: "1850.00",
      method: "TRANSFER" as const,
      vehicleId: null,
      note: "Acompte portefeuille assurance flotte trimestriel.",
    },
    {
      id: "demo-alg-expense-marketing",
      agencyId,
      date: today,
      category: "MARKETING" as const,
      amount: "650.00",
      method: "CARD" as const,
      vehicleId: null,
      note: "Campagne lead gen pour location aeroport.",
    },
  ];

  for (const expense of demoExpenses) {
    await (prisma as typeof prisma & {
      expense: typeof prisma.expense;
    }).expense.upsert({
      where: { id: expense.id },
      update: expense,
      create: expense,
    });
  }

  const demoInfractions = [
    {
      id: "demo-alg-infraction-pending",
      agencyId,
      vehicleId: duster.id,
      bookingId: "demo-alg-booking-confirmed",
      customerId: "demo-alg-customer-corp",
      date: addDays(today, -2),
      time: "14:20",
      type: "PARKING" as const,
      status: "PENDING" as const,
      amount: 300,
      notes: "Stationnement en zone livraison.",
      clientName: "Atlas Events SARL",
      clientCin: "IF998877",
      clientPhone: "+212522778899",
    },
    {
      id: "demo-alg-infraction-contested",
      agencyId,
      vehicleId: seatLeon.id,
      bookingId: "demo-alg-booking-completed",
      customerId: "demo-alg-customer-family",
      date: addDays(today, -7),
      time: "09:10",
      type: "TOLL" as const,
      status: "CONTESTED" as const,
      amount: 120,
      notes: "Client conteste le passage peage, dossier en cours.",
      clientName: "Mehdi Chraibi",
      clientCin: "CN772145",
      clientPhone: "+212663880044",
    },
  ];

  let skippedInfractions = false;
  for (const infraction of demoInfractions) {
    try {
      await prisma.infraction.upsert({
        where: { id: infraction.id },
        update: infraction,
        create: infraction,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("permission denied for table infractions")) {
        skippedInfractions = true;
        break;
      }
      throw error;
    }
  }

  for (const type of [
    ReminderType.OIL_CHANGE,
    ReminderType.INSURANCE_EXPIRY,
    ReminderType.TECH_INSPECTION,
    ReminderType.VIGNETTE,
  ]) {
    const defaults =
      type === ReminderType.OIL_CHANGE
        ? { leadDays: [], leadKm: [1000, 500, 100] }
        : type === ReminderType.VIGNETTE
          ? { leadDays: [30, 10, 5], leadKm: [] }
          : { leadDays: [30, 15, 7], leadKm: [] };

    await prisma.reminderRule.upsert({
      where: {
        agencyId_type: {
          agencyId,
          type,
        },
      },
      update: {
        enabled: true,
        channelInApp: true,
        channelEmail: type !== ReminderType.OIL_CHANGE,
        channelWhatsApp: type === ReminderType.VIGNETTE || type === ReminderType.INSURANCE_EXPIRY,
        ...defaults,
      },
      create: {
        agencyId,
        type,
        enabled: true,
        channelInApp: true,
        channelEmail: type !== ReminderType.OIL_CHANGE,
        channelWhatsApp: type === ReminderType.VIGNETTE || type === ReminderType.INSURANCE_EXPIRY,
        ...defaults,
      },
    });
  }

  const vehicleDocuments = [
    {
      vehicleId: mercedes.id,
      type: VehicleDocumentType.INSURANCE,
      reference: "ALG-MB-2026-001",
      startDate: addDays(today, -120),
      expiryDate: addDays(today, 12),
      fileUrl: "/assets/contrat-location-vehicule.pdf",
    },
    {
      vehicleId: mercedes.id,
      type: VehicleDocumentType.TECHNICAL_INSPECTION,
      reference: "VT-MB-2026-018",
      startDate: addDays(today, -330),
      expiryDate: addDays(today, 18),
      fileUrl: "/assets/contrat-location-vehicule.pdf",
    },
    {
      vehicleId: mercedes.id,
      type: VehicleDocumentType.VIGNETTE,
      reference: "VIG-MB-2026",
      startDate: addDays(today, -70),
      expiryDate: addDays(today, 8),
      fileUrl: "/assets/contrat-location-vehicule.pdf",
    },
    {
      vehicleId: seatLeon.id,
      type: VehicleDocumentType.REGISTRATION,
      reference: "CG-SL-77833",
      startDate: addDays(today, -400),
      expiryDate: null,
      fileUrl: "/assets/contrat-location-vehicule.pdf",
    },
    {
      vehicleId: duster.id,
      type: VehicleDocumentType.INSURANCE,
      reference: "ALG-DD-2026-017",
      startDate: addDays(today, -160),
      expiryDate: addDays(today, 40),
      fileUrl: "/assets/contrat-location-vehicule.pdf",
    },
  ];

  for (const document of vehicleDocuments) {
    await prisma.vehicleDocument.upsert({
      where: {
        agencyId_vehicleId_type: {
          agencyId,
          vehicleId: document.vehicleId,
          type: document.type,
        },
      },
      update: document,
      create: {
        agencyId,
        ...document,
      },
    });
  }

  const notifications = [
    {
      agencyId,
      vehicleId: mercedes.id,
      type: ReminderType.OIL_CHANGE,
      title: "Vidange a prevoir",
      body: "La Mercedes depasse bientot le prochain seuil de vidange.",
      severity: "DUE" as const,
      dueAt: null,
      dueMileageKm: 60000,
      status: "OPEN" as const,
      snoozedUntil: null,
    },
    {
      agencyId,
      vehicleId: mercedes.id,
      type: ReminderType.INSURANCE_EXPIRY,
      title: "Assurance a renouveler",
      body: "Le contrat premium arrive a echeance dans 12 jours.",
      severity: "WARNING" as const,
      dueAt: addDays(today, 12),
      dueMileageKm: null,
      status: "OPEN" as const,
      snoozedUntil: null,
    },
    {
      agencyId,
      vehicleId: mercedes.id,
      type: ReminderType.TECH_INSPECTION,
      title: "Visite technique planifiee",
      body: "Controle technique deja programme, rappel differe pour les captures.",
      severity: "INFO" as const,
      dueAt: addDays(today, 18),
      dueMileageKm: null,
      status: "SNOOZED" as const,
      snoozedUntil: addDays(today, 5),
    },
    {
      agencyId,
      vehicleId: duster.id,
      type: ReminderType.VIGNETTE,
      title: "Vignette a payer",
      body: "La vignette du Duster est quasiment echue.",
      severity: "DUE" as const,
      dueAt: addDays(today, 5),
      dueMileageKm: null,
      status: "OPEN" as const,
      snoozedUntil: null,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: {
        agencyId_vehicleId_type: {
          agencyId,
          vehicleId: notification.vehicleId,
          type: notification.type,
        },
      },
      update: notification,
      create: notification,
    });
  }

  const [
    userCount,
    customerCount,
    bookingCount,
    expenseCount,
    infractionCount,
    reminderRuleCount,
    documentCount,
  ] = await Promise.all([
    prisma.user.count({ where: { agencyId } }),
    prisma.customer.count({ where: { agencyId } }),
    prisma.booking.count({ where: { agencyId } }),
    (prisma as typeof prisma & { expense: typeof prisma.expense }).expense.count({ where: { agencyId } }),
    prisma.infraction.count({ where: { agencyId } }),
    prisma.reminderRule.count({ where: { agencyId } }),
    prisma.vehicleDocument.count({ where: { agencyId } }),
  ]);

  console.log(`Demo data refreshed for ${owner.agency.name} (${OWNER_EMAIL})`);
  console.log(
    JSON.stringify(
      {
        users: userCount,
        customers: customerCount,
        bookings: bookingCount,
        expenses: expenseCount,
        infractions: infractionCount,
        reminderRules: reminderRuleCount,
        vehicleDocuments: documentCount,
        infractionsSkipped: skippedInfractions,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
