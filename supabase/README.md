# Supabase – Locapro

## What’s in this folder

- **`migrations/20250221000000_enable_rls_agency_policies.sql`**  
  Enables RLS on all public tables and adds agency-scoped policies so that “users of agency X only see rows where `agencyId` = X”.

## How you use Supabase today

- **Storage:** Next.js API routes use the **service_role** client (`lib/supabase.ts`) for uploads (vehicles, damage reports, customers). No client-side Supabase.
- **Database:** Prisma talks to Supabase Postgres via `DATABASE_URL` / `DIRECT_URL`. That connection often uses a role that **bypasses RLS**, so these policies don’t affect your current app until you use a role that respects RLS (e.g. anon key from the client) or set `app.agency_id` per request.

## Apply the RLS migration

1. Open **Supabase Dashboard** → **SQL Editor**.
2. Paste the contents of `migrations/20250221000000_enable_rls_agency_policies.sql`.
3. Run it.

Or, if you use Supabase CLI and link this project:

```bash
supabase db push
```

## Expenses index (`vehicleId`)

The **index on `expenses(vehicleId)`** is already in the Prisma schema (`@@index([vehicleId])` on the `Expense` model).

- **Preferred:** run `npm run db:migrate` (or `npx prisma migrate dev`) so Prisma creates and applies the migration.
- **If Prisma migrate fails** (e.g. shadow DB issues), add the index manually in Supabase SQL Editor:

```sql
CREATE INDEX IF NOT EXISTS "expenses_vehicleId_idx" ON public.expenses ("vehicleId");
```

## Enforcing agency in RLS when using Prisma

Policies use `app.current_agency_id()`, which reads `current_setting('app.agency_id', true)`.

- If you keep using only the **direct Postgres connection** (e.g. `postgres` role), RLS is bypassed and nothing changes.
- If you later use the **anon key** from the client, set `app.agency_id` in the JWT or in a session variable so the policies can allow the right rows.
- If you want Prisma to respect RLS, you’d need to run `SET app.agency_id = '...'` on the connection before each request (e.g. in a Prisma middleware or connection wrapper). That’s optional and more advanced.

## After applying

- Re-run **Security Advisor** and **Performance Advisor** in the Supabase dashboard.
- Leave “unused” indexes as-is for now and revisit after more traffic.
