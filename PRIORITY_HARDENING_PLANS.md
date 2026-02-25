# Priority Hardening Plans

## Plan 1 (P0): Data Isolation and Security Baseline

### Goal
Guarantee tenant isolation and close high-impact security gaps that can break trust between agencies.

### Scope
- Booking and vehicle/customer agency consistency
- API mutation authorization hardening
- Authentication abuse protections
- Storage upload abuse protections

### Tasks
1. Enforce tenant integrity in the database schema.
2. Add composite unique/index constraints for tenant-safe relations where needed.
3. Add migration(s) to enforce booking-to-customer and booking-to-vehicle agency consistency.
4. Update `app/api/bookings/[id]/dates/route.ts` to validate:
   - `vehicleId` belongs to current agency
   - booking status is mutable (not canceled/completed)
   - lifecycle/business guards are respected
5. Harden reminder engine input checks in `lib/reminders/engine.ts`:
   - fetch vehicle with both `id` and `agencyId`
   - fail fast on mismatch
6. Add auth rate-limiting for credentials login (IP + email key).
7. Add temporary lockout/backoff policy after repeated failed login attempts.
8. Add API rate limiting and quotas for upload routes.
9. Add server-side content verification for uploads (magic-byte check, optional AV scan queue).
10. Add security audit logs for sensitive mutations (booking date/vehicle changes, role/password updates).

### Deliverables
- Prisma migration(s) for tenant-safe constraints
- Hardened API and action guards
- Login and upload rate limiting
- Security audit log table and usage in critical paths

### Success Criteria
- Cross-tenant write attempts fail at both app and DB levels.
- Booking date mutation API cannot assign foreign-agency vehicles.
- Repeated login abuse is throttled/blocked.
- Upload spam and invalid file payloads are throttled and rejected.

---

## Plan 2 (P1): Reliability and Operational Readiness

### Goal
Make deployments predictable and reduce production incidents that affect all agencies.

### Scope
- Migration/build safety
- Error handling behavior consistency
- Channel readiness transparency
- Documentation correctness

### Tasks
1. Replace production `db push` in build pipeline with migration-based deployment flow.
2. Split CI/CD pipeline into explicit phases:
   - schema validation
   - migration apply
   - app build
3. Add startup/runtime checks for required env vars (`DATABASE_URL`, `DIRECT_URL`, auth secrets, storage keys).
4. Replace `return null` auth fallbacks on server pages with deterministic redirects or dedicated error boundaries.
5. Implement clear in-product channel state:
   - mark Email/WhatsApp as disabled and non-delivery until implemented
   - avoid misleading operators
6. Add structured error reporting for server actions and APIs.
7. Update and align docs (`README`, troubleshooting, runbooks) with current architecture and deployment process.
8. Add operational runbook for incident response (DB issue, auth outage, storage outage).

### Deliverables
- Updated scripts and CI pipeline
- Unified auth-failure UX behavior
- Correct docs/runbook set
- Better observability for runtime failures

### Success Criteria
- Deployments do not mutate schema unpredictably.
- No blank-page behavior on auth/session failures.
- Teams can recover quickly from known infra issues using documented playbooks.

---

## Plan 3 (P2): Performance, Product Experience, and Maintainability

### Goal
Improve speed and usability at scale while reducing long-term maintenance cost.

### Scope
- Query efficiency and pagination strategy
- UX completeness gaps
- Code duplication and type safety debt

### Tasks
1. Add query profiling for dashboard/finance/calendar endpoints and identify top slow queries.
2. Introduce pagination/caps for heavy list queries and dashboard cards where data volume grows quickly.
3. Add/aggressively tune indexes for high-frequency filters and ranges.
4. Refactor duplicated booking creation/reservation data loading into shared server data functions.
5. Replace mock global search overlay with real tenant-scoped search endpoints.
6. Remove `as unknown as`/`any` escapes in expenses/finance flow by aligning Prisma client + schema and types.
7. Add caching strategy where safe (e.g., short-lived summary cards) and explicit invalidation rules.
8. Add broader tests:
   - tenant-boundary tests
   - API contract tests
   - high-volume query behavior tests
9. Improve role UX consistency across modules (visible actions reflect real permissions).

### Deliverables
- Faster and bounded heavy pages
- Real global search
- Reduced duplication and stronger typing
- Expanded test coverage for scale and tenancy

### Success Criteria
- Dashboard and finance pages remain responsive with large datasets.
- Search returns real tenant records across modules.
- Type escapes are eliminated in core finance/expense paths.
- Regression risk decreases with expanded automated tests.

---

## Suggested Execution Order
1. Execute Plan 1 fully before onboarding more agencies.
2. Execute Plan 2 next to stabilize deployments and operations.
3. Execute Plan 3 continuously in parallel sprints once P0/P1 guardrails are in place.

---

## No-Regression Execution Protocol

### Rule 1: Always change behavior behind a flag first
- Add feature flags for sensitive changes (`tenant_db_constraints`, `strict_booking_date_api`, `auth_rate_limit`, `upload_rate_limit`, `new_global_search`).
- Enable in staging first, then pilot agency, then all agencies.

### Rule 2: Database migrations must be backward-compatible first
- Step A: Add new nullable columns/indexes/constraints in a non-breaking way.
- Step B: Backfill and validate data consistency with verification scripts.
- Step C: Switch app logic to the new constraints.
- Step D: Remove legacy paths only after production validation window.

### Rule 3: Protect existing contracts
- Add API contract tests before refactors for:
  - booking creation/update
  - booking date mutation API
  - payments/deposits mutations
  - uploads
- Keep request/response shapes stable unless explicitly versioned.

### Rule 4: Snapshot critical business logic before touching it
- Add regression tests for:
  - booking overlap logic
  - payment status derivation (`PENDING` / `PARTIAL` / `PAID`)
  - deposit status transitions
  - dashboard KPI aggregates

### Rule 5: Use staged rollout with hard stop gates
- Gate 1: Local tests pass.
- Gate 2: Staging smoke + regression tests pass.
- Gate 3: Pilot agency validates key workflows.
- Gate 4: Full rollout with monitoring.
- If any gate fails: stop rollout and rollback immediately.

### Rule 6: Define rollback per change before deployment
- For each change, record:
  - rollback command/commit
  - data rollback implications
  - expected recovery time

### Rule 7: Monitor production behavior after each release
- Track:
  - booking creation/update failure rate
  - login failure and lockout rates
  - upload rejection/error rate
  - p95 page/API latency (dashboard, finance, calendar)
- Set alert thresholds and on-call owner before rollout.

### Rule 8: Avoid large mixed refactors
- Do not combine security, schema, and UI refactor in one deployment.
- Ship small vertical slices and validate each slice.
