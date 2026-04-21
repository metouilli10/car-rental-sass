export function getPublicSiteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function toAbsoluteStorefrontUrl(path: string) {
  return `${getPublicSiteBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
