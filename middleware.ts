export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/customers/:path*",
    "/bookings/:path*",
    "/contracts/:path*",
    "/payments/:path*",
    "/damage-reports/:path*",
  ],
};
