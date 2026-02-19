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
    "/payments/:path*",
    "/damage-reports/:path*",
  ],
};
