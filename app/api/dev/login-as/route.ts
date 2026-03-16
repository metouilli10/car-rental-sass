import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { agency: true },
  });

  if (!user?.agencyId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEXTAUTH_SECRET is missing" }, { status: 500 });
  }

  const token = await encode({
    secret,
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
      agencyName: user.agency.name,
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const isSecure = url.protocol === "https:";

  response.cookies.set(isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set("next-auth.callback-url", `${url.origin}/dashboard`, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
