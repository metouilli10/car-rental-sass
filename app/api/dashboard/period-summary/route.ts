import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-cache";
import { getDashboardPeriodSummary } from "@/lib/dashboard/v3-queries";
import { createPerfLogger } from "@/lib/perf";
import { isValidLocale, type AppLocale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

export async function GET(request: NextRequest) {
  const perf = createPerfLogger("dashboard-period-summary");
  try {
    const session = await getSession();
    perf.step("session-loaded", { hasSession: Boolean(session?.user) });

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
    const localeParam = searchParams.get("locale") ?? undefined;
    const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";

    const summary = await getDashboardPeriodSummary({
      agencyId: session.user.agencyId,
      periodInput: { period, start, end },
      locale,
    });
    perf.end({ hasSummary: true });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/dashboard/period-summary error:", error);
    perf.end({ failed: true });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
