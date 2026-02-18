const BRAND_LOGOS: Record<string, string> = {
  dacia: "/assets/brands/dacia.png",
  hyundai: "/assets/brands/hyundai.png",
  toyota: "/assets/brands/toyota.png",
  peugeot: "/assets/brands/peugeot.png",
  renault: "/assets/brands/renault.png",
  "renault group": "/assets/brands/renault.png",
  mercedes: "/assets/brands/mercedes-benz.png",
  mercedesbenz: "/assets/brands/mercedes-benz.png",
  "mercedes benz": "/assets/brands/mercedes-benz.png",
  "mercedes-benz": "/assets/brands/mercedes-benz.png",
};

function normalizeBrandName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

export function getBrandLogoPath(make: string): string | null {
  const normalized = normalizeBrandName(make);
  return BRAND_LOGOS[normalized] ?? null;
}
