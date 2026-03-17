import Image from "next/image";
import { Mail } from "lucide-react";

import { Footer as AnimatedFooter } from "@/components/ui/modem-animated-footer";
import { navLinks as landingNavLinks } from "../data";

const navLinks = [
  ...landingNavLinks.map(({ label, href }) => ({ label, href })),
  { label: "Contact", href: "mailto:contact@locaryx.ma" },
];

const socialLinks = [
  {
    icon: <Mail className="h-6 w-6" />,
    href: "mailto:contact@locaryx.ma",
    label: "Email",
  },
];

export function Footer() {
  return (
    <AnimatedFooter
      brandName="Locaryx"
      brandDescription="Le logiciel simple pour centraliser les réservations, la flotte, les paiements et les cautions de votre agence."
      socialLinks={socialLinks}
      navLinks={navLinks}
      brandIcon={
        <Image
          src="/assets/locaryx-icon-white.png"
          alt="Locaryx"
          width={96}
          height={96}
          className="h-8 w-8 object-contain sm:h-10 sm:w-10 md:h-14 md:w-14"
        />
      }
      className="bg-white"
    />
  );
}
