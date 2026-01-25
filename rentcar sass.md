You are my senior full-stack engineer. Build an MVP rental car management SaaS for Moroccan car rental agencies.

GOAL (MVP v1)
A web app that helps agencies manage: vehicles, bookings, customers, contracts (PDF), deposits/payments, damage reports (with photos). Morocco-optimized: MAD currency, French UI, cash payments, deposit tracking, passport/CIN uploads, WhatsApp quick contact.

TECH STACK (must follow)
- Next.js 14+ (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Prisma ORM + PostgreSQL
- Auth: start with a simple email/password auth (NextAuth or Supabase Auth). If unsure, implement NextAuth with Credentials for MVP. Include role-based access (OWNER, STAFF).
- Storage: S3-compatible (Cloudflare R2 or AWS S3). Implement signed upload URLs.
- PDF generation: Playwright HTML → PDF for contracts.
- Validation: Zod
- Forms: React Hook Form
- Tables: TanStack Table

PROJECT CONSTRAINTS
- Keep MVP lean and operational. Avoid overbuilding analytics.
- UX must prioritize daily actions: create booking, check-in/out, deposit received/released, damage photos.
- French UI strings by default. (AR later)
- Currency MAD everywhere.

DELIVERABLES
1) Create the full project scaffold with folder structure and environment variables documented.
2) Define the database schema in Prisma for:
   - User (with role)
   - Agency (multi-tenant ready even if MVP is single agency)
   - Vehicle
   - Customer
   - Booking
   - Payment
   - Deposit
   - Contract
   - DamageReport
   - DamagePhoto
3) Build core pages (App Router):
   - /login
   - /dashboard
   - /vehicles (list, add, edit)
   - /bookings (list, create, details)
   - /contracts/[id] (view + generate PDF)
   - /payments (payments + deposits overview)
   - /damage-reports (create from booking return)
4) Build the dashboard wireframe with these cards and sections:
   - Cars Out Today
   - Cars Available Today
   - Deposits Held (MAD)
   - Payments Pending
   - Today’s Pickups & Returns table with actions: View Contract, Add Damage, WhatsApp customer, Release deposit
   - Vehicle status list (available/rented/maintenance)
5) Implement business rules:
   - Prevent double-booking: vehicle cannot have overlapping bookings unless status is CANCELED.
   - Booking statuses: DRAFT, CONFIRMED, ACTIVE, COMPLETED, CANCELED
   - Vehicle statuses: AVAILABLE, RENTED, MAINTENANCE
   - Deposit statuses: HELD, PARTIAL_RETURNED, RETURNED, FORFEITED
   - Payment types: CASH, CARD, TRANSFER
   - Payment status: PENDING, PAID, REFUNDED
6) Contract generation:
   - Contract template in French with fields:
     customer name, passport/CIN, phone
     vehicle make/model/plate
     dates, price per day, total, deposit amount, payment type
     agency name + address placeholders
   - Generate HTML then Playwright PDF
   - Store PDF URL in storage (R2/S3)
7) Damage workflow:
   - On return (booking completion), create damage report:
     - checklist (fuel, cleanliness)
     - notes
     - photo upload (multiple)
     - deposit action: release/partial/hold
8) Provide seed data script:
   - 1 agency
   - 1 owner user
   - 5 vehicles
   - 3 customers
   - 4 bookings across dates including one active and one returning today
9) Provide step-by-step local setup instructions:
   - install deps
   - setup .env
   - run migrations
   - run dev
   - generate PDF test
10) Code quality:
   - Use server actions or route handlers consistently
   - Add error handling + loading states
   - Protect routes (auth guard)
   - Use reusable components (PageHeader, StatCard, DataTable, StatusBadge, ConfirmDialog)

OUTPUT FORMAT
- First, propose the repo structure.
- Then output the Prisma schema.
- Then implement page-by-page in the order: auth → vehicles → customers → bookings → dashboard → contracts pdf → payments/deposits → damage reports.
- After each major part, include quick manual test steps.

IMPORTANT UX DETAILS (Morocco)
- On Booking details page, include a prominent WhatsApp button that opens:
  https://wa.me/<phone>?text=<pre-filled message in French>
- In booking create form:
  - Price/day + number of days auto-compute total
  - Deposit amount required
  - Payment type required
- All dates should display in DD/MM/YYYY format.

START NOW
Begin by generating the project scaffold plan and repo structure, then Prisma schema, then the first routes.
