# i18n-related cache / API review

## `lib/dashboard/v3-queries.ts`

- `getDashboardDataV3Cached` — **includes `locale`** in cache arguments; user-facing strings are localized in uncached builder.

## `lib/dashboard/queries.ts`

- `getDashboardDataCached` / `getDashboardDataUncached` — builds `monthPerformance.caHintText` as a **French sentence** (`depenses`, `/vehicule`). **Not used** by current `[locale]/dashboard` (dashboard uses v3). If `getDashboardData` is called again from a localized page, pass **`locale`** and build the hint with `getMessages` + templates, and add `locale` to `unstable_cache` args.
- `getDashboardTopVehiclesCached` — **numeric / names only**; no locale in cache required.

## `lib/notifications/queries.ts`

- `getNotificationsSummaryCached` — returns DB **`title` / `body`**; not app i18n strings. **No locale** in cache key needed unless you later translate notification templates server-side.

## Client `fetch('/api/...')`

- **`/api/dashboard/period-summary`** — must send **`locale`** (see `DashboardPeriodShell`); response includes localized pulse/period labels.
