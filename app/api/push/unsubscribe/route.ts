import { NextRequest, NextResponse } from "next/server";
import { AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getPushAuthorizedUserOrThrow } from "@/lib/push/access";
import { pushUnsubscribeRequestSchema } from "@/lib/push/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getPushAuthorizedUserOrThrow();
    const payload = pushUnsubscribeRequestSchema.parse(await request.json());

    const result = await prisma.pushSubscription.updateMany({
      where: {
        agencyId: currentUser.agencyId,
        userId: currentUser.id,
        endpoint: payload.endpoint,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      deactivatedCount: result.count,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    console.error("POST /api/push/unsubscribe error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
