import { NextRequest, NextResponse } from "next/server";
import { processPushNotifications } from "@/lib/push/processor";
import { safeEqual } from "@/lib/auth-utils";
import { isWebPushConfigured } from "@/lib/push/webpush";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.PUSH_PROCESSOR_CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!configuredSecret) {
    return { ok: false, status: 503, error: "PUSH_PROCESSOR_CRON_SECRET manquant" };
  }

  if (!bearerToken) {
    return { ok: false, status: 401, error: "Authorization requise" };
  }

  return safeEqual(configuredSecret, bearerToken)
    ? { ok: true as const }
    : { ok: false, status: 401, error: "Accès interdit" };
}

export async function POST(request: NextRequest) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Le push web n'est pas configuré sur cet environnement." },
      { status: 503 },
    );
  }

  try {
    const result = await processPushNotifications();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("POST /api/internal/push/process error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
