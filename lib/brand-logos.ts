import { brandKeyFromMake, brandLogoSrc } from "@/lib/brands";

export function getBrandLogoPath(make: string): string {
  return brandLogoSrc(brandKeyFromMake(make));
}
