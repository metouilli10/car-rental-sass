# Project Memory

This is the canonical shared memory for the repository.

- Read this file at the start of every new conversation after `AGENTS.md`.
- Keep it short and current.
- Treat it as context, then verify important details in code.

## Project Snapshot

- Product: `Locaryx`, a multi-tenant car rental SaaS for Moroccan rental agencies.
- Stack: Next.js `15`, React `19`, TypeScript, Prisma, NextAuth, Tailwind, shadcn/ui.
- Database: Prisma is currently configured for `PostgreSQL` in `prisma/schema.prisma`.
- App shape: App Router dashboard product with operations, fleet, bookings, payments, onboarding, notifications, and a live storefront/booking-request flow.
- Localization: UI copy is expected to stay French-first, with brand tone focused on clarity, control, and calm urgency.
- Safety rule: tenant-scoped data must always be filtered by `agencyId`.

## Current Priorities

- Keep multi-tenant safety intact while storefront, booking-request, and notification work continues to evolve.
- Keep long-lived docs aligned with the live codebase.
- Preserve a clean handoff path for future agents by updating this file after major work.

## Major Decisions

- `PROJECT_MEMORY.md` is the only running project memory file.
- `AGENTS.md` is the repo bootstrap file for future agents.
- `README.md` stays setup-oriented, not session-history-oriented.
- `claude.md` stays instruction-oriented and points here for live project context.
- Major updates go here only when they matter for future work; do not log every tiny task.

## Recent Changes Log

### 2026-04-22 - Storefront settings now render on public site

- `Change:` Wired public storefront hero, footer, contact, city/address, WhatsApp, and pickup-location copy to saved WebsiteSettings values instead of hard-coded demo text; revalidates the previous public slug when the slug changes.
- `Impact:` Changes made in the dashboard Site web form now visibly update the public storefront while keeping the fixed Touareg hero image treatment.
- `Touched:` `components/storefront/agency-storefront-page.tsx`, `lib/actions/website.ts`
- `Follow-up:` none

### 2026-04-22 - Storefront settings form aligned to public design

- `Change:` Reorganized the dashboard Site web form into publication, identity, welcome message, contact, pickup/return, and public-info preview sections; removed the visible hero image field while preserving its stored value.
- `Impact:` Agencies now configure coherent storefront information that matches the current Touareg-led public design without being prompted for unused hero imagery.
- `Touched:` `components/settings/website-settings-form.tsx`
- `Follow-up:` none

### 2026-04-22 - Storefront hero car rendering stabilized

- `Change:` Marked the static Touareg hero image as unoptimized so it is served directly instead of through the Next image optimizer.
- `Impact:` The public storefront hero reliably shows the car visual alongside the blue blob instead of rendering an empty optimized image response.
- `Touched:` `components/storefront/agency-storefront-page.tsx`
- `Follow-up:` none

### 2026-04-20 - Storefront hero rebuilt to match Stitch split layout

- `Change:` Replaced the storefront’s dark full-bleed hero with a bright Stitch-style 2-column composition using the detached Touareg visual, organic blue blob backdrop, pill CTAs, compact trust row, and a softer header-to-hero transition.
- `Impact:` The storefront opening now tracks the approved premium agency reference much more closely on desktop while staying responsive on tablet and mobile.
- `Touched:` `components/storefront/agency-storefront-page.tsx`, `public/assets/touaareg.png`
- `Follow-up:` Compare against the Stitch screenshot in-browser and fine-tune spacing only if a pixel-level pass is still needed.

### 2026-04-20 - Storefront hero switched to Touareg full-background treatment

- `Change:` Reworked the storefront hero to use the local `public/assets/touareg hero.webp` asset as a full-background automotive visual with left-aligned content, pill CTAs, and compact stats inspired by the latest reference shared in chat.
- `Impact:` The hero now feels much closer to a modern car-rental landing page, with one dominant visual instead of a split text-plus-card composition.
- `Touched:` `public/assets/touareg hero.webp`, `components/storefront/agency-storefront-page.tsx`
- `Follow-up:` Consolidate the same-day hero history later so the memory log stays easier to scan.

### 2026-04-20 - Storefront hero aligned to Stitch screen edb3087054dd4cf39eaedb9609d49cb5

- `Change:` Downloaded the newer Stitch screenshot into `.stitch/locaryx-premium-redesign/locaryx-premium-casablanca-v2.png` and shifted the live storefront hero toward its darker cinematic automotive direction with large Casablanca copy, stronger image presence, rounded CTA pills, and compact credibility stats.
- `Impact:` The storefront opening now matches the latest premium website concept more closely while keeping the rest of the public page intact.
- `Touched:` `.stitch/locaryx-premium-redesign/locaryx-premium-casablanca-v2.png`, `components/storefront/agency-storefront-page.tsx`
- `Follow-up:` Consolidate the same-day storefront memory entries later if they become too noisy.

### 2026-04-20 - Storefront hero premium polish pass

- `Change:` Refined the existing storefront hero without changing its layout by softening the background depth, reducing the car-image card feel, upgrading CTA hover states, replacing trust-row dots with icons, and tightening spacing/microcopy.
- `Impact:` The hero now feels calmer, more premium, and more automotive without introducing new sections or structural changes.
- `Touched:` `components/storefront/agency-storefront-page.tsx`
- `Follow-up:` Reconcile the same-day hero entries later if the memory log needs consolidation.

### 2026-04-20 - Storefront hero simplified to premium local-agency layout

- `Change:` Reworked only the storefront hero into a cleaner 2-column Casablanca-focused layout with fixed copy, simplified trust row, direct contact CTA fallback logic, and one dominant vehicle visual without floating cards.
- `Impact:` The public storefront now opens with a more credible premium-agency first impression while leaving the rest of the page and booking flow unchanged.
- `Touched:` `components/storefront/agency-storefront-page.tsx`
- `Follow-up:` If the new hero direction is kept, consider reconciling the older broader premium-redesign memory entry so it no longer implies a full-page refresh.

### 2026-04-20 - Stitch-driven premium storefront redesign

- `Change:` Pulled the Stitch screen assets for `Locaryx Premium Website Redesign` into `.stitch/locaryx-premium-redesign/` and rebuilt the live public storefront around that direction with a glass nav, editorial hero, premium fleet cards, and a restyled booking-request dialog.
- `Impact:` The public `/{agencySlug}` storefront now feels materially more premium while keeping the existing data-driven vehicle catalog and manual booking-request workflow intact.
- `Touched:` `.stitch/locaryx-premium-redesign/`, `components/storefront/agency-storefront-page.tsx`, `components/storefront/vehicle-card.tsx`, `components/storefront/booking-request-dialog.tsx`
- `Follow-up:` If this visual direction is approved, align any remaining public landing pages and shared brand tokens to the same automotive premium system.

### 2026-04-19 - Storefront launch-ready public routing and SEO

- `Change:` Promoted the public storefront to the canonical root-slug URL `/{agencySlug}` via middleware rewrite, kept `/storefront/{agencySlug}` as a redirect-only compatibility path, refreshed the public storefront presentation, and added storefront metadata plus sitemap/robots support.
- `Impact:` Agencies now have a launch-ready public URL with cleaner sharing/indexing behavior while avoiding the Next.js root dynamic-segment conflict with locale routes.
- `Touched:` `middleware.ts`, `app/storefront/[agencySlug]/`, `components/storefront/`, `lib/storefront/`, `app/sitemap.ts`, `app/robots.ts`
- `Follow-up:` Once storefront tables exist in every environment, the sitemap no longer needs the current missing-table fallback during builds.

### 2026-04-19 - Storefront booking form returns clean validation errors

- `Change:` Normalized public booking-request validation failures to user-facing messages instead of raw Zod issue arrays, and improved the storefront phone input semantics.
- `Impact:` Demo and real storefront submissions now show actionable validation feedback such as `Téléphone requis` instead of leaking technical payloads into the modal.
- `Touched:` `app/api/public/[agencySlug]/booking-requests/route.ts`, `components/storefront/booking-request-dialog.tsx`
- `Follow-up:` If the public form later needs per-field inline validation, build on the returned `fieldErrors` shape instead of parsing server strings again.

### 2026-04-16 - Shared project memory bootstrap

- `Change:` Added `AGENTS.md`, created this `PROJECT_MEMORY.md`, and linked `claude.md` to this file.
- `Impact:` New agents now have one obvious repo-level context source and one consistent place to record major changes.
- `Touched:` `AGENTS.md`, `PROJECT_MEMORY.md`, `claude.md`
- `Follow-up:` Use this log for future major changes and keep the snapshot concise.

### 2026-04-16 - Brand name updated to Locaryx

- `Change:` Replaced remaining `Locapro` references with `Locaryx` across shared docs, brand docs, scripts, and local storage keys used by the UI.
- `Impact:` The repo now uses one consistent product name; browser-persisted sidebar and draft keys will reset once under the new prefix.
- `Touched:` `claude.md`, `TODO.md`, `COPY_INSTRUCTIONS.md`, `BRAND_GUIDELINES.md`, `brand/BRAND_GUIDELINES.md`, `APP_REVIEW_REPORT.md`, `supabase/README.md`, `scripts/i18n-audit.sh`, selected component storage keys
- `Follow-up:` If any external environments or analytics still use the old name, rename them separately.

### 2026-04-16 - Tenant storefront and booking-request workflow shipped

- `Change:` Implemented tenant-scoped storefront foundations: `Vehicle.publishedToWebsite`, `WebsiteSettings`, `BookingRequest`, public storefront APIs, dashboard website settings, dashboard booking-requests workspace, reservation linking, and storefront booking-request submission.
- `Impact:` Agencies can now publish vehicles, expose a public storefront, receive website booking requests into the dashboard, review them safely, and convert approved requests into reservations without auto-confirming publicly.
- `Touched:` `prisma/schema.prisma`, `prisma/migrations/20260413120000_tenant_storefront_v1/`, `prisma/migrations/20260416123000_link_booking_request_to_booking/`, `app/[locale]/(dashboard)/booking-requests/`, `app/[locale]/(dashboard)/settings/website/`, `app/api/public/`, `components/booking-requests/`, `components/storefront/`, `lib/storefront/`, `lib/actions/booking-requests.ts`, `lib/actions/website.ts`, `lib/actions/bookings.ts`
- `Follow-up:` If routing is finalized later, align the storefront path from the current `/storefront/[agencySlug]` implementation to the intended root-slug public route.

### 2026-04-16 - Storefront availability logic aligned to Moroccan agency workflow

- `Change:` Updated storefront booking requests so internal availability conflicts are warnings only, not public submission blockers. Added internal operational states on booking requests (`AVAILABLE`, `INTERNAL_CONFLICT`, `TO_CONFIRM`, `PARTNER_AGENCY`) plus richer dashboard guidance and CTA-driven handling.
- `Impact:` The public site now behaves like a lead-capture workflow: agencies can still fulfill requests by reallocating internal vehicles or sourcing through partners, while the dashboard keeps conflict detection as an operational aid.
- `Touched:` `lib/storefront/public.ts`, `lib/storefront/queries.ts`, `app/api/public/[agencySlug]/booking-requests/route.ts`, `components/storefront/booking-request-dialog.tsx`, `components/booking-requests/booking-requests-table.tsx`, `components/booking-requests/booking-request-detail-card.tsx`, `lib/actions/booking-requests.ts`, `lib/actions/bookings.ts`, `app/storefront/[agencySlug]/page.tsx`
- `Follow-up:` A future extension can add structured fulfillment fields such as `fulfillmentSource`, `partnerAgencyName`, and `partnerCost` without changing the current public request model.

### 2026-04-16 - Expenses action typing fixed

- `Change:` Reworked `lib/actions/expenses.ts` to use `getCurrentUserAccessOrThrow()` instead of the raw NextAuth session when resolving permission overrides.
- `Impact:` `npx tsc --noEmit` now passes cleanly; the previous TypeScript errors around `session.user.permissions` are resolved.
- `Touched:` `lib/actions/expenses.ts`
- `Follow-up:` Keep server actions on the authz helper path whenever they rely on permission overrides instead of plain session fields.

### 2026-04-16 - Booking-request unread state and in-app demand visibility

- `Change:` Added unread tracking on `BookingRequest`, created tenant-scoped `BOOKING_REQUEST_CREATED` notifications on storefront submission, cleared unread state when a targeted request is opened or handled, and surfaced demand in the booking-requests UI, sidebar badge, and top-nav bell.
- `Impact:` Website booking leads now feel operationally live in the dashboard without introducing a new notification platform or realtime layer.
- `Touched:` `prisma/schema.prisma`, `prisma/migrations/20260416153000_booking_request_notifications_v1/`, `lib/notifications/booking-requests.ts`, `lib/notifications/queries.ts`, `lib/storefront/public.ts`, `lib/actions/booking-requests.ts`, `lib/actions/bookings.ts`, booking-request dashboard components, shell layout/top-nav/sidebar
- `Follow-up:` If the full `/notifications` workspace later needs booking-request items, widen that page deliberately instead of relying on the current reminder-only vehicle assumptions.

### 2026-04-16 - Core repo docs reconciled with live app

- `Change:` Rewrote `AGENTS.md`, `claude.md`, and `README.md` to match the real app shape, including PostgreSQL/Supabase setup, current roles, locale-aware dashboard routing, permission-based access, PWA/push support, storefront/booking-request work, and the current deployment flow.
- `Impact:` New agents and humans now have far more reliable setup and architecture guidance, with much less drift from the codebase.
- `Touched:` `AGENTS.md`, `claude.md`, `README.md`
- `Follow-up:` Keep these docs in sync as storefront, push, and onboarding flows continue to evolve.

### 2026-04-16 - Reservations list shows website-origin badge

- `Change:` Standardized the reservations list and mobile reservation card badge copy from `Web` to `Site web` for reservations linked to a website booking request.
- `Impact:` Agencies can now identify storefront-origin reservations consistently across the list and detail views.
- `Touched:` `components/reservations/ReservationsTable.tsx`, `components/reservations/ReservationCard.tsx`
- `Follow-up:` Source-based filtering can be added later on top of the existing `bookingRequest` relation.

## Known Risks / Open Issues

- The repo currently has many uncommitted changes, so every new task should check `git status` before editing.
- This bootstrap is best-effort only. Agents still need to respect repo instructions and verify code instead of trusting memory blindly.

## Next Recommended Tasks

- Update this file after each major feature, schema change, or important decision.
- Reconcile outdated setup and architecture docs so they match the live codebase.
- Keep the snapshot short by moving old detail out of the top sections and leaving only durable context.
