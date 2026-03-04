export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vehicles/:path*",
    "/customers/:path*",
    "/clients/:path*",
    "/bookings/:path*",
    "/reservations/:path*",
    "/users/:path*",
    "/finance/:path*",
    "/payments/:path*",
    "/paiements/:path*",
    "/damage-reports/:path*",
    "/infractions/:path*",
    "/catalogue/:path*",
    "/calendrier/:path*",
    "/caisse/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};
