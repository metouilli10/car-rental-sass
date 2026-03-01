#!/usr/bin/env node
/**
 * Fetches car brand logos in SVG format.
 * Uses simple-icons for most brands; missing ones (Mercedes-Benz, Land Rover)
 * are downloaded as PNG from car-logos-dataset and we note them in README.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRANDS_DIR = path.join(__dirname, "..", "public", "brands");

// Brand slug (for filename) -> simple-icons slug (may differ)
const SIMPLE_ICONS_SLUGS = {
  dacia: "dacia",
  renault: "renault",
  peugeot: "peugeot",
  hyundai: "hyundai",
  kia: "kia",
  fiat: "fiat",
  volkswagen: "volkswagen",
  toyota: "toyota",
  skoda: "skoda",
  seat: "seat",
  citroen: "citroen",
  nissan: "nissan",
  ford: "ford",
  opel: "opel",
  suzuki: "suzuki",
  mg: "mg",
  bmw: "bmw",
  audi: "audi",
  jeep: "jeep",
  mercedes: "mercedes",
  landrover: "landrover",
};

const CDN_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons";

async function fetchSvg(slug) {
  const url = `${CDN_BASE}/${slug}.svg`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

async function main() {
  if (!fs.existsSync(BRANDS_DIR)) {
    fs.mkdirSync(BRANDS_DIR, { recursive: true });
  }

  const results = { svg: [], failed: [] };

  for (const [brandSlug, siSlug] of Object.entries(SIMPLE_ICONS_SLUGS)) {
    const svgText = await fetchSvg(siSlug);
    if (svgText && svgText.includes("<svg")) {
      fs.writeFileSync(
        path.join(BRANDS_DIR, `${brandSlug}.svg`),
        svgText,
        "utf8"
      );
      results.svg.push(brandSlug);
    } else {
      results.failed.push(brandSlug);
    }
  }

  console.log("Downloaded", results.svg.length, "SVG logos to public/brands/");
  if (results.failed.length) console.log("Failed:", results.failed.join(", "));
}

main().catch(console.error);
