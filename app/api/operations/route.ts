import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const agencyId = session.user.agencyId;

  const selectedDate = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      OR: [
        { startDate: { gte: dayStart, lte: dayEnd } },
        { endDate: { gte: dayStart, lte: dayEnd } },
      ],
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, plate: true, color: true } },
      contract: { select: { id: true } },
      damageReport: { select: { id: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ bookings });
}
