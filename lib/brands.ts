const KNOWN_BRAND_KEYS = new Set([
  "audi",
  "bmw",
  "citroen",
  "dacia",
  "fiat",
  "ford",
  "hyundai",
  "jeep",
  "kia",
  "landrover",
  "mercedes",
  "mg",
  "nissan",
  "opel",
  "peugeot",
  "renault",
  "seat",
  "skoda",
  "suzuki",
  "toyota",
  "volkswagen",
]);

const BRAND_ALIASES: Record<string, string> = {
  vw: "volkswagen",
  "volks wagen": "volkswagen",
  "mercedes benz": "mercedes",
  mercedesbenz: "mercedes",
  "land rover": "landrover",
};

export function normalizeMake(make: string): string {
  return make
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-_]+/g, " ")
    .trim();
}

export function brandKeyFromMake(make: string): string {
  const normalizedMake = normalizeMake(make);

  if (!normalizedMake) {
    return "other";
  }

  const aliasMatch = BRAND_ALIASES[normalizedMake];

  if (aliasMatch) {
    return aliasMatch;
  }

  return KNOWN_BRAND_KEYS.has(normalizedMake) ? normalizedMake : "other";
}

export function brandLogoSrc(brandKey: string): string {
  if (brandKey === "other" || !KNOWN_BRAND_KEYS.has(brandKey)) {
    return "/brands/generic-car.svg";
  }

  return `/brands/${brandKey}.svg`;
}
