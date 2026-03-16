import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin, getPublicUrl } from "@/lib/supabase";
import { enforceUploadRateLimit } from "@/lib/security/upload-rate-limit";
import { randomUUID } from "crypto";
import { matchesFileSignature } from "@/lib/security/request-signatures";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPEG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 5 Mo." },
        { status: 400 }
      );
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
        {
          status: rateLimit.status,
          headers: { "Retry-After": String(rateLimit.retryAfterSec) },
        }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "webp"].includes(ext) ? ext : "jpg";
    const filePath = `${session.user.agencyId}/vehicle-${randomUUID()}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!matchesFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas au format déclaré." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.storage
      .from("vehicles")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const photoUrl = getPublicUrl("vehicles", filePath);
    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
