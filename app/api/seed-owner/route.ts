import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-off: ensure owner user exists with password123 (for production when SQL seed can't run).
 * POST /api/seed-owner
 * Header: x-seed-secret: <SEED_OWNER_SECRET from env>
 * Remove this file after production login works.
 */
const OWNER_EMAIL = "owner@automaroc.ma";
const OWNER_PASSWORD = "password123";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-seed-secret")?.trim();
  const envSecret = process.env.SEED_OWNER_SECRET?.trim();
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const hashedPassword = await hash(OWNER_PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: OWNER_EMAIL },
      update: { password: hashedPassword, isActive: true, agencyId: agency.id },
      create: {
        email: OWNER_EMAIL,
        password: hashedPassword,
        name: "Hassan Alami",
        role: "OWNER",
        agencyId: agency.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Owner user created/updated. You can now login.",
      email: user.email,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
