import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Development only: Reset owner@automaroc.ma password to "password123".
 * GET or POST /api/dev/reset-owner
 * Only works when NODE_ENV=development.
 */
export async function GET() {
  return handleReset();
}
export async function POST() {
  return handleReset();
}

async function handleReset() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const hashedPassword = await hash("password123", 10);

    const agency = await prisma.agency.upsert({
      where: { id: "agency-1" },
      update: {},
      create: {
        id: "agency-1",
        name: "Auto Maroc Location",
        address: "123 Boulevard Mohammed V, Casablanca",
        phone: "+212520123456",
        email: "contact@automaroc.ma",
        city: "Casablanca",
        country: "Morocco",
        currency: "MAD",
      },
    });

    const user = await prisma.user.upsert({
      where: { email: "owner@automaroc.ma" },
      update: {
        password: hashedPassword,
        isActive: true,
        agencyId: agency.id,
        approvalStatus: "APPROVED",
        emailVerifiedAt: new Date(),
      },
      create: {
        email: "owner@automaroc.ma",
        password: hashedPassword,
        name: "Hassan Alami",
        role: "OWNER",
        agencyId: agency.id,
        approvalStatus: "APPROVED",
        emailVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Owner account reset. You can now login with owner@automaroc.ma / password123",
      email: user.email,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
