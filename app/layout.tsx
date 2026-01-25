import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentCar SaaS - Gestion de Location",
  description: "Système de gestion pour agences de location de voitures au Maroc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
