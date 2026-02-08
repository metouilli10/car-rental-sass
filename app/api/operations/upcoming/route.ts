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
  const days = Math.min(Number(searchParams.get("days") || "7"), 14);
  const agencyId = session.user.agencyId;

  const now = new Date();
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const endOfRange = new Date(startOfTomorrow);
  endOfRange.setDate(endOfRange.getDate() + days);
  endOfRange.setHours(23, 59, 59, 999);

  // Single query for the entire range
  const bookings = await prisma.booking.findMany({
    where: {
      agencyId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      OR: [
        { startDate: { gte: startOfTomorrow, lte: endOfRange } },
        { endDate: { gte: startOfTomorrow, lte: endOfRange } },
      ],
    },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  // Group by day
  const dayMap: Record<string, { departures: number; returns: number }> = {};

  for (const booking of bookings) {
    const startKey = booking.startDate.toISOString().split("T")[0];
    const endKey = booking.endDate.toISOString().split("T")[0];

    if (startKey >= startOfTomorrow.toISOString().split("T")[0]) {
      if (!dayMap[startKey]) dayMap[startKey] = { departures: 0, returns: 0 };
      dayMap[startKey].departures++;
    }

    if (endKey >= startOfTomorrow.toISOString().split("T")[0]) {
      if (!dayMap[endKey]) dayMap[endKey] = { departures: 0, returns: 0 };
      dayMap[endKey].returns++;
    }
  }

  const upcoming = Object.entries(dayMap)
    .map(([date, counts]) => ({
      date,
      departures: counts.departures,
      returns: counts.returns,
      total: counts.departures + counts.returns,
    }))
    .filter((d) => d.total > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ upcoming });
}
