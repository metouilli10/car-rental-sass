import Image from "next/image";
import { heroData } from "../data";

const TRUSTED_LOGOS = [
  { name: "Avis", src: "/trusted companies/Avis-Logo.png", width: 170, height: 56 },
  { name: "Budget", src: "/trusted companies/Budget-Logo.png", width: 180, height: 54 },
  { name: "Enterprise", src: "/trusted companies/Enterprise-Rent-A-Car-Logo.png", width: 218, height: 50 },
  { name: "Hertz", src: "/trusted companies/Hertz-logo.png", width: 156, height: 56 },
  { name: "National", src: "/trusted companies/National-Car-Rental-Logo.png", width: 208, height: 52 },
  { name: "Ronart", src: "/trusted companies/Ronart-Logo.png", width: 170, height: 56 },
];

const MARQUEE_LOGOS = [...TRUSTED_LOGOS, ...TRUSTED_LOGOS];

export function LogosRow() {
  return (
    <section className="logo-marquee-section">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <p className="logo-marquee-label">{heroData.trustText}</p>
        <div className="logo-marquee-viewport">
          <div className="logo-marquee-track">
            {MARQUEE_LOGOS.map((logo, index) => (
              <div key={`${logo.name}-${index}`} className="logo-marquee-item">
                <Image
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  width={logo.width}
                  height={logo.height}
                  className="h-auto w-auto max-h-14 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
