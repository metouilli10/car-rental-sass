"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContractHTML } from "@/lib/contract-template";
import { chromium } from "playwright";
import { writeFile, mkdir } from "fs/promises";
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
    paymentType: booking.payments[0]?.type || "CASH",
    agencyName: booking.agency.name,
    agencyAddress: booking.agency.address,
    agencyPhone: booking.agency.phone,
    agencyEmail: booking.agency.email,
  });

  // Generate PDF with Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);

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
