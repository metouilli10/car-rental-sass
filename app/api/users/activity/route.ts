import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toUserActivityItem } from "@/lib/users/serializers";
import {
  AuthzError,
  canManageUsers,
  getCurrentUserOrThrow,
  requireRole,
} from "@/lib/authz";

const ALLOWED_ACTIONS = [
  "USER_CREATED",
  "USER_ROLE_UPDATE",
  "USER_STATUS_UPDATE",
  "USER_PASSWORD_RESET",
  "USER_PERMISSIONS_UPDATE",
] as const;

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserOrThrow();
    requireRole(currentUser.role, ["OWNER"]);

    if (!canManageUsers(currentUser.role)) {
      return NextResponse.json({ error: "Acces interdit" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId")?.trim() || undefined;
    const action = searchParams.get("action")?.trim() || undefined;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 25, 1), 100);

    const items = await prisma.securityAuditLog.findMany({
      where: {
        agencyId: currentUser.agencyId,
        action: {
          in: action && ALLOWED_ACTIONS.includes(action as (typeof ALLOWED_ACTIONS)[number])
            ? [action as (typeof ALLOWED_ACTIONS)[number]]
            : [...ALLOWED_ACTIONS],
        },
        entityType: "USER",
        ...(userId ? { entityId: userId } : {}),
      },
      orderBy: {
        id: "desc",
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: {
              id: BigInt(cursor),
            },
            skip: 1,
          }
        : {}),
    });

    const hasNextPage = items.length > limit;
    const pageItems = hasNextPage ? items.slice(0, limit) : items;

    return NextResponse.json({
      items: pageItems.map((item) => toUserActivityItem(item)),
      nextCursor: hasNextPage ? pageItems[pageItems.length - 1]?.id.toString() ?? null : null,
    });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/users/activity error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
