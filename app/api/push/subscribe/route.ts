import { NextRequest, NextResponse } from "next/server";
import { AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getPushAuthorizedUserOrThrow } from "@/lib/push/access";
import { pushSubscribeRequestSchema } from "@/lib/push/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getPushAuthorizedUserOrThrow();
    const payload = pushSubscribeRequestSchema.parse(await request.json());

    const subscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint: payload.subscription.endpoint,
      },
      update: {
        agencyId: currentUser.agencyId,
        userId: currentUser.id,
        p256dh: payload.subscription.keys.p256dh,
        auth: payload.subscription.keys.auth,
        userAgent: request.headers.get("user-agent"),
        deviceLabel: payload.deviceLabel?.trim() || null,
        platform: payload.platform?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        agencyId: currentUser.agencyId,
        userId: currentUser.id,
        endpoint: payload.subscription.endpoint,
        p256dh: payload.subscription.keys.p256dh,
        auth: payload.subscription.keys.auth,
        userAgent: request.headers.get("user-agent"),
        deviceLabel: payload.deviceLabel?.trim() || null,
        platform: payload.platform?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        endpoint: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      subscription,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
