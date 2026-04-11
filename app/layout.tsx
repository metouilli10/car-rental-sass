import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleHtmlAttributes } from "@/components/locale/LocaleHtmlAttributes";
import { PwaBootstrap } from "@/components/pwa/PwaBootstrap";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  localeDirection,
  isValidLocale,
} from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Locaryx — Votre agence, sous contrôle",
  description: "Système de gestion professionnel pour agences de location de voitures",
  applicationName: "Locaryx",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Locaryx",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/pwa/icon-192.png",
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#002e5d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={locale === "ar" ? "ar" : "fr"}
      dir={localeDirection(locale)}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <LocaleHtmlAttributes />
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
