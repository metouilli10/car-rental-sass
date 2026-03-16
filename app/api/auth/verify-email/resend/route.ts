import { NextRequest, NextResponse } from "next/server";
import { normalizeClientIp, normalizeEmail } from "@/lib/auth-utils";
import { assertPublicAuthRateLimit } from "@/lib/public-auth-rate-limit";
import { resendOwnerVerificationEmailByEmail } from "@/lib/owner-verification";

type Payload = {
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const rawEmail = body.email?.trim();

    if (!rawEmail) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    const clientIp = normalizeClientIp(request.headers);

    assertPublicAuthRateLimit("resend", email, clientIp);

    const result = await resendOwnerVerificationEmailByEmail({
      email,
      ip: clientIp,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/auth/verify-email/resend error:", error);

    if (error instanceof Error && error.message === "Trop de tentatives. Réessayez plus tard.") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (
      error instanceof Error &&
      ["RESEND_API_KEY must be configured", "RESEND_FROM_EMAIL must be configured"].includes(
        error.message,
      )
    ) {
      return NextResponse.json(
        { error: "Le service d'email n'est pas disponible pour le moment." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Impossible de renvoyer l'email de vérification." },
      { status: 500 },
    );
  }
}
