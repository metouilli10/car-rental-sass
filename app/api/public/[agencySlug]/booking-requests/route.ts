import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { normalizeClientIp } from "@/lib/auth-utils";
import { assertPublicStorefrontRateLimit } from "@/lib/storefront/rate-limit";
import { normalizeAgencySlug } from "@/lib/storefront/constants";
import { createBookingRequestFromPublicForm } from "@/lib/storefront/public";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agencySlug: string }> },
) {
  const { agencySlug: rawSlug } = await context.params;
  const agencySlug = normalizeAgencySlug(rawSlug);

  try {
    const payload = await request.json();
    await assertPublicStorefrontRateLimit(agencySlug, normalizeClientIp(request.headers));
    await createBookingRequestFromPublicForm(agencySlug, payload);

    return NextResponse.json({
      success: true,
      message:
        "Votre demande a bien été envoyée. Notre équipe vérifiera la disponibilité et vous contactera rapidement.",
    });
  } catch (error) {
    console.error("POST /api/public/[agencySlug]/booking-requests error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || "Veuillez corriger les informations du formulaire.",
          fieldErrors: error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "Trop de tentatives. Réessayez plus tard.") {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      if (["SITE_NOT_AVAILABLE", "VEHICLE_NOT_FOUND"].includes(error.message)) {
        return NextResponse.json({ error: "Cette vitrine n'est pas disponible." }, { status: 404 });
      }
      if (
        error.message.includes("invalide") ||
        error.message.includes("requis") ||
        error.message.includes("retour") ||
        error.message.includes("Soumission invalide")
      ) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
    }

    return NextResponse.json(
      { error: "Impossible d'envoyer la demande pour le moment." },
      { status: 500 },
    );
  }
}
