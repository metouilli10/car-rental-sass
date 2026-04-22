# Locaryx - Performance TODO

## 1. Add pagination to data-heavy pages
- **Pages:** Vehicles, Bookings, Customers, Payments
- **Problem:** All pages use `prisma.findMany()` without `take`/`skip`, fetching every record on each navigation
- **Fix:** Add server-side pagination with `take(20)` / `skip(offset)` and a pagination UI component
- **Impact:** High — directly reduces query time and payload size as data grows

## 2. Cache heavy dashboard queries with `unstable_cache`
- **Components:** `MetricsCards`, `ActionRequise`, `VueDensemble`
- **Problem:** The dashboard runs 13+ parallel DB queries on every visit with no caching
- **Fix:** Wrap queries with Next.js `unstable_cache()` using a short revalidation window (30-60s)
- **Impact:** High — dashboard loads instantly on repeat visits within the cache window

## 3. Batch catalogue availability checks
- **Page:** `/catalogue`
- **Problem:** For each vehicle, `getVehicleAvailabilityStatus()` runs a separate DB query (N+1 pattern). 20 vehicles = 20+ queries
- **Fix:** Write a single query that checks availability for all vehicles at once, or pre-compute availability status
- **Impact:** Medium-High — catalogue page is the slowest page due to this
