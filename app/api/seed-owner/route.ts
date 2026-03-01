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
  const headerSecret = request.headers.get("x-seed-secret")?.trim();
  let bodySecret: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.secret === "string") bodySecret = body.secret.trim();
  } catch {
    /* no body */
  }
  const secret = headerSecret || bodySecret;
  const envSecret = process.env.SEED_OWNER_SECRET?.trim();
  if (!envSecret) {
    return NextResponse.json(
      { error: "SEED_OWNER_SECRET is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 503 }
    );
  }
  if (!secret || secret !== envSecret) {
    return NextResponse.json(
      { error: "Invalid code. Check that you entered the exact value set in Vercel for SEED_OWNER_SECRET (no extra spaces)." },
      { status: 401 }
    );
  }

  try {
    const agency = await prisma.agency.upsert({
      where: { id: "agency-1" },
      update: {
        setupCompletedAt: new Date(),
      },
      create: {
        id: "agency-1",
        name: "Auto Maroc Location",
        address: "123 Boulevard Mohammed V, Casablanca",
        phone: "+212520123456",
        email: "contact@automaroc.ma",
        city: "Casablanca",
        country: "Morocco",
        currency: "MAD",
        setupCompletedAt: new Date(),
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
