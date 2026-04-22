import { NextResponse } from "next/server";
import { AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getPushAuthorizedUserOrThrow } from "@/lib/push/access";
import { buildTestPushPayload } from "@/lib/push/payloads";
import { isWebPushConfigured, sendPushToMany } from "@/lib/push/webpush";

export const runtime = "nodejs";

export async function POST() {
  try {
    const currentUser = await getPushAuthorizedUserOrThrow();

    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Le push web n'est pas configuré sur cet environnement." },
        { status: 503 },
      );
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        agencyId: currentUser.agencyId,
        userId: currentUser.id,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "Aucun appareil actif pour cet utilisateur." },
        { status: 400 },
      );
    }

    const delivery = await sendPushToMany(
      subscriptions,
      buildTestPushPayload(currentUser.agencyId),
    );

    return NextResponse.json({
      success: delivery.successCount > 0,
      sent: delivery.successCount,
      failed: delivery.failureCount,
      deactivatedSubscriptions: delivery.deactivatedCount,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/push/test error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
