"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContractHTML } from "@/lib/contract-template";
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

export async function generateContractPDF(bookingId: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  // Fetch booking with all related data
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      vehicle: true,
      agency: true,
      payments: true,
      damageReport: { include: { damagePhotos: true } },
    },
  });

  if (!booking || booking.agencyId !== session.user.agencyId) {
    throw new Error("Réservation non trouvée");
  }

  // Calculate number of days
  const numberOfDays = Math.ceil(
    (new Date(booking.endDate).getTime() -
      new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Compute amount paid (sum of PAID rental payments)
  const amountPaid = booking.payments
    .filter((p) => p.category === "RENTAL" && p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const restToPay = booking.totalPrice - amountPaid;

  const vehicleKm =
    booking.vehicle.currentKm ?? booking.vehicle.mileage ?? 0;

  // Map payment type to French labels
  const paymentType = booking.payments[0]?.type || "CASH";

  // Base URL for resolving relative image paths in PDF
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";

  // Generate HTML
  const html = generateContractHTML({
    bookingId: booking.id,
    customerName: booking.customer.name,
    passportOrCIN: booking.customer.passportOrCIN,
    phone: booking.customer.phone,
    vehicleMake: booking.vehicle.make,
    vehicleModel: booking.vehicle.model,
    vehiclePlate: booking.vehicle.plate,
    vehicleColor: booking.vehicle.color,
    startDate: booking.startDate,
    endDate: booking.endDate,
    pricePerDay: booking.pricePerDay,
    numberOfDays,
    totalPrice: booking.totalPrice,
    depositAmount: booking.depositAmount,
    paymentType,
    agencyName: booking.agency.name,
    agencyAddress: booking.agency.address,
    agencyPhone: booking.agency.phone,
    agencyEmail: booking.agency.email,
    amountPaid,
    restToPay,
    vehicleKm,
    damagePhotos: booking.damageReport?.damagePhotos ?? [],
    baseUrl,
  });

  // Generate PDF with Playwright (baseURL for resolving relative image paths)
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });

  // Create directory if it doesn't exist
  const contractsDir = path.join(process.cwd(), "public", "uploads", "contracts");
  await mkdir(contractsDir, { recursive: true });

  // Generate PDF
  const fileName = `contract-${bookingId}.pdf`;
  const filePath = path.join(contractsDir, fileName);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();

  // Save contract record in database
  const pdfUrl = `/uploads/contracts/${fileName}`;

  await prisma.contract.upsert({
    where: { bookingId },
    update: {
      pdfUrl,
      generatedAt: new Date(),
    },
    create: {
      bookingId,
      pdfUrl,
      generatedAt: new Date(),
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/contracts/${bookingId}`);

  return pdfUrl;
}
