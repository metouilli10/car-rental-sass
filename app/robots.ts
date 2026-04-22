import type { MetadataRoute } from "next";
import { toAbsoluteStorefrontUrl } from "@/lib/storefront/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: toAbsoluteStorefrontUrl("/sitemap.xml"),
  };
}
