# Locaryx - Repo Guide

## Shared Project Memory

Read [PROJECT_MEMORY.md](PROJECT_MEMORY.md) at the start of every new conversation. It is the canonical running memory for current state, recent major changes, decisions, and open follow-up items. Use it for orientation, then verify details in code before making changes.

## Product Overview

**Locaryx** is a multi-tenant car rental SaaS for Moroccan agencies. The app is operations-first and combines internal agency workflows with a growing public/storefront surface.

Current product areas in the live codebase include:

- dashboard operations and onboarding
- vehicles, customers, bookings, and payments
- booking requests coming from a public storefront flow
- inspections / damage reports and infractions
- finance and cash register views
- user management with permission overrides
- reminders, notifications, and web push infrastructure
- website/storefront settings per agency
- print/PDF booking output and PWA support

## Source-of-Truth Facts

### Stack

- Next.js `15.1.4` with App Router
- React `19`
- TypeScript `5`
- Prisma `6`
- NextAuth `4`
- Tailwind CSS `3` + shadcn/ui + Radix UI
- PostgreSQL datasource in `prisma/schema.prisma`
- Optional web push via `web-push`
- Optional email delivery via Resend-related onboarding flows

### Auth and Access

- Credentials auth is defined in [lib/auth.ts](lib/auth.ts).
- Owner signup happens through a verification + approval flow in [lib/actions/auth.ts](lib/actions/auth.ts) and [lib/owner-verification.ts](lib/owner-verification.ts).
- Roles are `OWNER`, `MANAGER`, and `EMPLOYEE`.
- Effective access often comes from permissions, not just the base role. See [lib/permissions.ts](lib/permissions.ts).

### Localization and Routing

- Supported locales are `fr` and `ar`. See [lib/i18n/config.ts](lib/i18n/config.ts).
- Dashboard routes live under `/[locale]/...`.
- Middleware handles locale redirects and auth checks. See [middleware.ts](middleware.ts).
- Public auth routes like `/login`, `/signup`, and `/setup` remain unprefixed.

### Multi-Tenancy

- Tenant safety is critical: operational data must stay scoped by `agencyId`.
- Dashboard layout resolves the current membership, permissions, onboarding state, and notification summary per agency. See [app/[locale]/(dashboard)/layout.tsx](app/%5Blocale%5D/%28dashboard%29/layout.tsx).

## Current Data Model Shape

The Prisma schema currently includes core operational models plus newer system models:

- agency and users
- vehicles, customers, bookings, booking addons, and booking comments
- website settings and booking requests
- payments, deposits, and expenses
- damage reports, damage photos, and inspection sections
- reminder rules, notifications, notification events, and push subscriptions
- vehicle documents and infractions
- security audit logs, email verification tokens, and rate-limit buckets

Do not rely on old model counts in legacy docs. Use [prisma/schema.prisma](prisma/schema.prisma) as the source of truth.

## Important Working Rules

### Database and Queries

- Prisma is configured for PostgreSQL, not SQLite.
- Prefer existing server actions in `lib/actions/` for mutations.
- When changing schema, update Prisma, migrate, and verify downstream forms/actions.

### Permissions

- Owners retain broad access.
- Managers and employees depend on default permissions plus optional overrides.
- Many pages gate access with helpers like `getEffectivePermissions`, `canManageVehicles`, and `canManageCustomers`.

### Product Surface

- The sidebar and mobile nav expose the current information architecture. Check [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) and [components/shared/mobile-nav-drawer.tsx](components/shared/mobile-nav-drawer.tsx).
- The app includes a public agency storefront/API surface under `app/storefront` and `app/api/public`.
- Web push routes live under `app/api/push` and internal push processing under `app/api/internal/push`.

### UX and Copy

- UI is French-first, with Arabic locale support present in the app.
- Root metadata and manifest use the `Locaryx` brand and PWA settings. See [app/layout.tsx](app/layout.tsx) and [app/manifest.ts](app/manifest.ts).
- Prefer existing app patterns over adding new visual systems casually.

## High-Value Files

- [package.json](package.json) - scripts and dependency truth
- [prisma/schema.prisma](prisma/schema.prisma) - current schema truth
- [lib/auth.ts](lib/auth.ts) - login/session behavior
- [lib/actions/auth.ts](lib/actions/auth.ts) - owner signup flow
- [lib/permissions.ts](lib/permissions.ts) - permission model
- [middleware.ts](middleware.ts) - locale + auth routing behavior
- [lib/i18n/config.ts](lib/i18n/config.ts) - locale rules
- [app/[locale]/(dashboard)/layout.tsx](app/%5Blocale%5D/%28dashboard%29/layout.tsx) - dashboard shell behavior
- [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) - live product navigation
- [README.md](README.md) - setup and architecture overview

## Common Commands

```bash
npm run dev
npm run build
npm run deploy:check
npm run test
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio
npm run i18n:audit
npm run i18n:parity
```

## Practical Reminders

1. Check `git status` before editing. This repo often has unrelated in-progress work.
2. Verify current behavior in code before trusting older docs.
3. For dashboard changes, consider locale, permissions, and agency scoping together.
4. For auth changes, consider signup, verification, approval, and session shape together.
5. Update `PROJECT_MEMORY.md` after major changes or major doc corrections.
