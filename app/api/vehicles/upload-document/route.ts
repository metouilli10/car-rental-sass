import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enforceUploadRateLimit } from "@/lib/security/upload-rate-limit";
import { getPublicUrl, supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 8 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("document");
    const vehicleId = formData.get("vehicleId");
    const documentType = formData.get("documentType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (typeof vehicleId !== "string" || typeof documentType !== "string") {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez PDF, JPG ou PNG." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 8 Mo." }, { status: 400 });
    }

    const rateLimit = enforceUploadRateLimit({
      request,
      agencyId: session.user.agencyId,
      scope: "vehicles",
      incomingBytes: file.size,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: rateLimit.status, headers: { "Retry-After": String(rateLimit.retryAfterSec) } },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeExt = ["jpeg", "jpg", "png", "pdf"].includes(ext) ? ext : "pdf";
    const rawBaseName = file.name.replace(/\.[^.]+$/, "");
    const safeBaseName = sanitizeSegment(rawBaseName || documentType) || documentType.toLowerCase();
    const filePath = `${session.user.agencyId}/${vehicleId}/${sanitizeSegment(documentType)}/${safeBaseName}-${randomUUID()}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage.from("vehicle-documents").upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;

    return NextResponse.json({
      fileUrl: getPublicUrl("vehicle-documents", filePath),
      fileName: file.name,
    });
  } catch (error) {
    console.error("Vehicle document upload error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Erreur lors de l'upload";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
