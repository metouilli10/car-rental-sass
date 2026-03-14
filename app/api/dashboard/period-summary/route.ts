import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-cache";
import { getDashboardPeriodSummary } from "@/lib/dashboard/v3-queries";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!session.user.agencyId) {
      return NextResponse.json({ error: "Agence introuvable" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? undefined;
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const summary = await getDashboardPeriodSummary({
      agencyId: session.user.agencyId,
      periodInput: { period, start, end },
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/dashboard/period-summary error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
