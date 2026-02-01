import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create Agency
  const agency = await prisma.agency.upsert({
    where: { id: "agency-1" },
    update: {},
    create: {
      id: "agency-1",
      name: "Auto Maroc Location",
      address: "123 Boulevard Mohammed V, Casablanca",
      phone: "+212520123456",
      email: "contact@automaroc.ma",
      city: "Casablanca",
      country: "Morocco",
      currency: "MAD",
    },
  });
  console.log("✅ Agency created:", agency.name);

  // Create Owner User
  const hashedPassword = await hash("password123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@automaroc.ma" },
    update: {},
    create: {
      email: "owner@automaroc.ma",
      password: hashedPassword,
      name: "Hassan Alami",
      role: "OWNER",
      agencyId: agency.id,
    },
  });
  console.log("✅ Owner user created:", owner.email);

  // Create Vehicles
  const vehicles = [
    {
      id: "vehicle-1",
      make: "Dacia",
      model: "Logan",
      year: 2022,
      plate: "A-12345-20",
      color: "Blanc",
      status: "AVAILABLE" as const,
      pricePerDay: 250,
      mileage: 15000,
      photoUrl: "/assets/dacia-logan.png",
      category: "Citadine",
      gearbox: "MANUAL" as const,
      seats: 5,
      hasAC: true,
      depositAmount: 1500,
    },
    {
      id: "vehicle-2",
      make: "Mercedes Benz",
      model: "C-Class",
      year: 2023,
      plate: "B-67890-20",
      color: "Argent",
      status: "RENTED" as const,
      pricePerDay: 850,
      mileage: 8000,
      photoUrl: "/assets/mercedes-benz.png",
      category: "Luxe",
      gearbox: "AUTO" as const,
      seats: 5,
      hasAC: true,
      depositAmount: 5000,
    },
    {
      id: "vehicle-3",
      make: "Hyundai",
      model: "i10",
      year: 2021,
      plate: "C-11223-20",
      color: "Orange",
      status: "AVAILABLE" as const,
      pricePerDay: 220,
      mileage: 25000,
      photoUrl: "/assets/daihatsu-ayla.png",
      category: "Citadine",
      gearbox: "MANUAL" as const,
      seats: 4,
      hasAC: true,
      depositAmount: 1000,
    },
    {
      id: "vehicle-4",
      make: "Toyota",
      model: "New Yaris",
      year: 2023,
      plate: "D-44556-20",
      color: "Blanc",
      status: "AVAILABLE" as const,
      pricePerDay: 350,
      mileage: 5000,
      photoUrl: "/assets/toyota-yaris.png",
      category: "Citadine",
      gearbox: "AUTO" as const,
      seats: 5,
      hasAC: true,
      depositAmount: 2000,
    },
    {
      id: "vehicle-5",
      make: "Toyota",
      model: "Corolla",
      year: 2022,
      plate: "E-77889-20",
      color: "Noir",
      status: "MAINTENANCE" as const,
      pricePerDay: 350,
      mileage: 30000,
      category: "Citadine",
      gearbox: "MANUAL" as const,
      seats: 5,
      hasAC: true,
      depositAmount: 2000,
      photoUrl: null,
    },
  ];

  for (const vehicle of vehicles) {
    const { id, ...vehicleData } = vehicle;
    await prisma.vehicle.upsert({
      where: { id },
      update: vehicleData,
      create: {
        ...vehicle,
        agencyId: agency.id,
      },
    });
  }
  // Ensure photoUrl is set by plate (covers any vehicles that might have been created with different ids)
  const plateToPhoto: Record<string, string> = {
    "A-12345-20": "/assets/dacia-logan.png",
    "B-67890-20": "/assets/mercedes-benz.png",
    "C-11223-20": "/assets/daihatsu-ayla.png",
    "D-44556-20": "/assets/toyota-yaris.png",
    "a-373-21": "/assets/dacia-logan.png",
    "E-77889-20": "/assets/toyota-yaris.png",
  };
  for (const [plate, photoUrl] of Object.entries(plateToPhoto)) {
    await prisma.vehicle.updateMany({
      where: { agencyId: agency.id, plate },
      data: { photoUrl },
    });
  }
  console.log(`✅ ${vehicles.length} vehicles created`);

  // Create Customers
  const customers = [
    {
      id: "customer-1",
      name: "Mohammed Alami",
      email: "m.alami@gmail.com",
      phone: "+212661234567",
      passportOrCIN: "AB123456",
    },
    {
      id: "customer-2",
      name: "Fatima Benani",
      email: "f.benani@gmail.com",
      phone: "+212662345678",
      passportOrCIN: "CD789012",
    },
    {
      id: "customer-3",
      name: "Youssef Tazi",
      email: "y.tazi@gmail.com",
      phone: "+212663456789",
      passportOrCIN: "EF345678",
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: {
        ...customer,
        agencyId: agency.id,
      },
    });
  }
  console.log(`✅ ${customers.length} customers created`);

  // Create Bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Booking 1: ACTIVE (started 2 days ago, Renault Clio)
  const booking1 = await prisma.booking.upsert({
    where: { id: "booking-1" },
    update: {},
    create: {
      id: "booking-1",
      agencyId: agency.id,
      vehicleId: "vehicle-2",
      customerId: "customer-1",
      startDate: twoDaysAgo,
      endDate: fiveDaysFromNow,
      pricePerDay: 300,
      totalPrice: 2100, // 7 days * 300
      depositAmount: 1000,
      status: "ACTIVE",
      notes: "Client régulier",
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-1" },
    update: {},
    create: {
      id: "payment-1",
      bookingId: booking1.id,
      amount: 2100,
      type: "CASH",
      status: "PAID",
      paidAt: twoDaysAgo,
    },
  });

  await prisma.deposit.upsert({
    where: { bookingId: booking1.id },
    update: {},
    create: {
      bookingId: booking1.id,
      amount: 1000,
      status: "HELD",
      heldAt: twoDaysAgo,
    },
  });

  console.log("✅ Booking 1 created (ACTIVE)");

  // Booking 2: Returning today
  const booking2 = await prisma.booking.upsert({
    where: { id: "booking-2" },
    update: {},
    create: {
      id: "booking-2",
      agencyId: agency.id,
      vehicleId: "vehicle-1",
      customerId: "customer-2",
      startDate: threeDaysAgo,
      endDate: today,
      pricePerDay: 250,
      totalPrice: 750, // 3 days * 250
      depositAmount: 500,
      status: "ACTIVE",
      notes: "Retour prévu aujourd'hui",
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-2" },
    update: {},
    create: {
      id: "payment-2",
      bookingId: booking2.id,
      amount: 750,
      type: "CARD",
      status: "PAID",
      paidAt: threeDaysAgo,
    },
  });

  await prisma.deposit.upsert({
    where: { bookingId: booking2.id },
    update: {},
    create: {
      bookingId: booking2.id,
      amount: 500,
      status: "HELD",
      heldAt: threeDaysAgo,
    },
  });

  console.log("✅ Booking 2 created (Returning today)");

  // Booking 3: Starting today
  const booking3 = await prisma.booking.upsert({
    where: { id: "booking-3" },
    update: {},
    create: {
      id: "booking-3",
      agencyId: agency.id,
      vehicleId: "vehicle-3",
      customerId: "customer-3",
      startDate: today,
      endDate: tomorrow,
      pricePerDay: 280,
      totalPrice: 560, // 2 days * 280
      depositAmount: 600,
      status: "CONFIRMED",
      notes: "Départ aujourd'hui",
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-3" },
    update: {},
    create: {
      id: "payment-3",
      bookingId: booking3.id,
      amount: 560,
      type: "CASH",
      status: "PENDING",
    },
  });

  await prisma.deposit.upsert({
    where: { bookingId: booking3.id },
    update: {},
    create: {
      bookingId: booking3.id,
      amount: 600,
      status: "HELD",
    },
  });

  console.log("✅ Booking 3 created (Starting today)");

  // Booking 4: COMPLETED with damage report
  const booking4 = await prisma.booking.upsert({
    where: { id: "booking-4" },
    update: {},
    create: {
      id: "booking-4",
      agencyId: agency.id,
      vehicleId: "vehicle-4",
      customerId: "customer-1",
      startDate: sevenDaysAgo,
      endDate: threeDaysAgo,
      pricePerDay: 220,
      totalPrice: 880, // 4 days * 220
      depositAmount: 500,
      status: "COMPLETED",
      notes: "Location terminée",
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-4" },
    update: {},
    create: {
      id: "payment-4",
      bookingId: booking4.id,
      amount: 880,
      type: "TRANSFER",
      status: "PAID",
      paidAt: sevenDaysAgo,
    },
  });

  const deposit4 = await prisma.deposit.upsert({
    where: { bookingId: booking4.id },
    update: {},
    create: {
      bookingId: booking4.id,
      amount: 500,
      status: "RETURNED",
      heldAt: sevenDaysAgo,
      returnedAt: threeDaysAgo,
      notes: "Véhicule en bon état, caution retournée",
    },
  });

  await prisma.damageReport.upsert({
    where: { id: "damage-report-1" },
    update: {},
    create: {
      id: "damage-report-1",
      bookingId: booking4.id,
      fuelLevel: "Full",
      cleanliness: "Clean",
      notes: "Aucun dommage constaté",
      depositAction: "RELEASE",
      reportedAt: threeDaysAgo,
    },
  });

  console.log("✅ Booking 4 created (COMPLETED with damage report)");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("   Email: owner@automaroc.ma");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
