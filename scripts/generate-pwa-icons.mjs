import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const sourcePng = path.join(repoRoot, "public/assets/locaryx icon.png");
const pwaDir = path.join(repoRoot, "public/pwa");
const faviconPath = path.join(repoRoot, "public/assets/locaryx-favicon.png");

mkdirSync(pwaDir, { recursive: true });

const iconBase64 = readFileSync(sourcePng).toString("base64");
const iconDataUri = `data:image/png;base64,${iconBase64}`;

const launcherSvg = `\
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="32" y="48" width="960" height="960" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="22"/>
      <feGaussianBlur stdDeviation="24"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.0588235 0 0 0 0 0.109804 0 0 0 0 0.184314 0 0 0 0.16 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_1"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_1" result="shape"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="transparent"/>
  <g filter="url(#shadow)">
    <rect x="104" y="88" width="816" height="816" rx="184" fill="white"/>
  </g>
  <image href="${iconDataUri}" x="196" y="180" width="632" height="632" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

const maskableSvg = `\
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="240" fill="white"/>
  <image href="${iconDataUri}" x="202" y="202" width="620" height="620" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

const launcherSvgPath = path.join(pwaDir, "icon-launcher.svg");
const maskableSvgPath = path.join(pwaDir, "icon-maskable.svg");
const launcherPngPath = path.join(pwaDir, "icon-launcher-source.png");
const maskablePngPath = path.join(pwaDir, "icon-maskable-source.png");

writeFileSync(launcherSvgPath, launcherSvg);
writeFileSync(maskableSvgPath, maskableSvg);

execFileSync("sips", ["-s", "format", "png", launcherSvgPath, "--out", launcherPngPath], {
  stdio: "inherit",
});
execFileSync("sips", ["-s", "format", "png", maskableSvgPath, "--out", maskablePngPath], {
  stdio: "inherit",
});

execFileSync("sips", ["-z", "512", "512", launcherPngPath, "--out", path.join(pwaDir, "icon-512.png")], {
  stdio: "inherit",
});
execFileSync("sips", ["-z", "192", "192", launcherPngPath, "--out", path.join(pwaDir, "icon-192.png")], {
  stdio: "inherit",
});
execFileSync("sips", ["-z", "180", "180", launcherPngPath, "--out", path.join(pwaDir, "apple-touch-icon.png")], {
  stdio: "inherit",
});
execFileSync("sips", ["-z", "512", "512", maskablePngPath, "--out", path.join(pwaDir, "icon-512-maskable.png")], {
  stdio: "inherit",
});

copyFileSync(launcherPngPath, faviconPath);

console.log("Generated Locaryx PWA icons.");
