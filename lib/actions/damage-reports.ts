"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { InspectionFormData } from "@/lib/validations/damage-report";

function mapDepositRecordStatusToBookingStatus(
  status: "HELD" | "RETURNED" | "PARTIAL_RETURNED" | "FORFEITED"
): "RECEIVED" | "RETURNED" {
  if (status === "HELD") {
    return "RECEIVED";
  }

  return "RETURNED";
}

export async function createInspection(data: InspectionFormData) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  try {
    // Verify booking belongs to agency
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { deposit: true },
    });

    if (!booking || booking.agencyId !== session.user.agencyId) {
      return { error: "Réservation non trouvée" };
    }

    // Calculate total damage cost
    const totalDamageCost = data.sections.reduce(
      (sum, s) => sum + (s.status === "DAMAGE" ? (s.damageCost || 0) : 0),
      0
    );

    const deductedAmount = data.deductFromDeposit ? data.deductedAmount : 0;

    // Create inspection in a transaction
    const report = await prisma.$transaction(async (tx) => {
      // Create the damage report
      const damageReport = await tx.damageReport.create({
        data: {
          bookingId: data.bookingId,
          inspectionType: data.inspectionType,
          fuelLevel: data.fuelLevel,
          cleanliness: data.cleanliness || null,
          notes: data.notes || null,
          depositAction: data.depositAction,
          totalDamageCost,
          deductFromDeposit: data.deductFromDeposit,
          deductedAmount,
        },
      });

      // Create inspection sections
      for (const section of data.sections) {
        const createdSection = await tx.inspectionSection.create({
          data: {
            damageReportId: damageReport.id,
            sectionType: section.sectionType,
            status: section.status,
            notes: section.notes || null,
            damageCost: section.status === "DAMAGE" ? (section.damageCost || 0) : 0,
          },
        });

        // Create photos for this section
        if (section.photos && section.photos.length > 0) {
          for (const photoUrl of section.photos) {
            await tx.damagePhoto.create({
              data: {
                damageReportId: damageReport.id,
                sectionId: createdSection.id,
                photoUrl,
              },
            });
          }
        }
      }

      // Update deposit status if deducting
      if (data.deductFromDeposit && booking.deposit && deductedAmount > 0) {
        let depositStatus: "PARTIAL_RETURNED" | "FORFEITED" | "RETURNED" = "PARTIAL_RETURNED";
        if (deductedAmount >= booking.deposit.amount) {
          depositStatus = "FORFEITED";
        }

        await tx.deposit.update({
          where: { id: booking.deposit.id },
          data: {
            status: depositStatus,
            notes: `Déduction inspection: ${deductedAmount} MAD`,
            returnedAt: new Date(),
          },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            depositStatus: mapDepositRecordStatusToBookingStatus(depositStatus),
          },
        });
      } else if (data.depositAction === "RELEASE" && booking.deposit) {
        await tx.deposit.update({
          where: { id: booking.deposit.id },
          data: {
            status: "RETURNED",
            returnedAt: new Date(),
            notes: "Caution libérée après inspection",
          },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            depositStatus: "RETURNED",
          },
        });
      } else if (data.depositAction === "HOLD" && booking.deposit) {
        await tx.deposit.update({
          where: { id: booking.deposit.id },
          data: {
            status: "HELD",
            notes: "Caution retenue après inspection",
          },
        });
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            depositStatus: "RECEIVED",
          },
        });
      }

      return damageReport;
    });

    revalidatePath("/damage-reports");
    revalidatePath(`/bookings/${data.bookingId}`);
    revalidatePath("/dashboard");

    return { success: true, id: report.id };
  } catch (error) {
    console.error("createInspection error:", error);
    return { error: "Erreur lors de la création de l'inspection" };
  }
}

export async function getInspection(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const report = await prisma.damageReport.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          customer: true,
          vehicle: true,
          deposit: true,
        },
      },
      sections: {
        include: {
          photos: true,
        },
        orderBy: { sectionType: "asc" },
      },
      damagePhotos: true,
    },
  });

  if (!report || report.booking.agencyId !== session.user.agencyId) {
    return null;
  }

  return report;
}

export async function getInspections(
  page: number = 1,
  pageSize: number = 20
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  const agencyId = session.user.agencyId;

  const [inspections, total] = await Promise.all([
    prisma.damageReport.findMany({
      where: {
        booking: { agencyId },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
            vehicle: { select: { make: true, model: true, plate: true } },
          },
        },
        sections: true,
      },
      orderBy: { reportedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.damageReport.count({
      where: {
        booking: { agencyId },
      },
    }),
  ]);

  return { inspections, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getInspectionsForBooking(bookingId: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  return prisma.damageReport.findMany({
    where: { bookingId },
    include: {
      sections: {
        include: { photos: true },
      },
      damagePhotos: true,
    },
    orderBy: { reportedAt: "desc" },
  });
}

export async function getBookingsForInspection() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Non autorisé");
  }

  return prisma.booking.findMany({
    where: {
      agencyId: session.user.agencyId,
      status: { in: ["ACTIVE", "COMPLETED", "CONFIRMED"] },
    },
    include: {
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
      deposit: true,
    },
    orderBy: { startDate: "desc" },
    take: 100,
  });
}
