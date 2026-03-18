export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function compactSearchToken(query: string): string {
  return normalizeSearchQuery(query).replace(/[\s#-]+/g, "");
}

export function getBookingReference(bookingId: string): string {
  return `#${bookingId.slice(-6).toUpperCase()}`;
}
