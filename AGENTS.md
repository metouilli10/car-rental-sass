# Agent Startup Guide

Start every new conversation by reading [PROJECT_MEMORY.md](PROJECT_MEMORY.md).

## Required Startup Flow

1. Read `AGENTS.md`.
2. Read `PROJECT_MEMORY.md` before planning, coding, or reviewing.
3. Run a quick reality check in code for the area you are touching.
4. Check `git status` before editing because this repo often has ongoing parallel work.

## Repo Reality Check

Verify these facts in code before making decisions:

- Product name: `Locaryx`
- Framework: Next.js App Router on `next@15`
- Database: Prisma is configured for `PostgreSQL`, typically via Supabase
- Auth: NextAuth credentials login with owner verification and approval flow
- Roles: `OWNER`, `MANAGER`, `EMPLOYEE`
- Locales: dashboard supports `fr` and `ar`
- Multi-tenancy: agency-scoped data must be filtered by `agencyId`
- Permissions: many dashboard routes and actions are permission-gated, not role-only

## Documentation Roles

- `PROJECT_MEMORY.md` is the only running memory file.
- `README.md` is for setup, architecture, and operator-facing project docs.
- `claude.md` is the coding/bootstrap guide for agent work in this repo.
- Avoid duplicating long-running history across multiple files.

## Update Rule

Update `PROJECT_MEMORY.md` before finishing when work includes:

- major feature work
- schema or architecture changes
- behavior-impacting bug fixes
- important product or technical decisions
- repo-documentation corrections that future agents should know

## Repo-Specific Guardrails

- Do not assume docs are current; prefer `package.json`, `prisma/schema.prisma`, `lib/auth.ts`, `lib/permissions.ts`, and the relevant route files.
- For database access, preserve tenant isolation with `agencyId`.
- For dashboard work, account for locale-prefixed routes such as `/fr/...` and `/ar/...`.
- For auth or onboarding work, remember owners can be blocked until email verification and approval are complete.
- For UI changes, preserve the existing French-first product tone and current app patterns before introducing new abstractions.

## Memory Writing Style

Keep updates short and operational.

Recommended entry format:

`YYYY-MM-DD - Title`

- `Change:` what changed
- `Impact:` why it matters
- `Touched:` files or subsystems affected
- `Follow-up:` next action, cleanup, or `none`
