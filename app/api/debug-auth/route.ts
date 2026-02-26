import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-off debug: check if owner@automaroc.ma exists in DB and can be used for login.
 * GET /api/debug-auth
 * Remove this file after fixing production login.
 */
export async function GET() {
  try {
    const email = "owner@automaroc.ma";
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { agency: true },
    });
    if (!user) {
      return NextResponse.json({
        ok: false,
        message: "User not found in database",
        email,
        hint: "Run scripts/seed-owner-production.sql in Supabase SQL Editor",
      });
    }
    return NextResponse.json({
      ok: true,
      exists: true,
      email: user.email,
      isActive: user.isActive,
      hasAgency: !!user.agency,
      agencyId: user.agencyId,
      role: user.role,
      hint: user.isActive && user.agency
        ? "If login still fails, password hash may be wrong. Try resetting password via API or re-run seed SQL with a fresh bcrypt hash."
        : "User exists but isActive=false or no agency - fix in DB or SQL.",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e), message: "Database error" },
      { status: 500 }
    );
  }
}
