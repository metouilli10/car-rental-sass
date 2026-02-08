# Locapro - Car Rental SaaS

## Project Overview

**Locapro** is a multi-tenancy car rental SaaS platform designed for Moroccan rental agencies.

- **Brand Identity:** "Votre agence, sous contrôle" (Your agency, under control)
- **Personality:** Professional, reliable, calm urgency, operations-first
- **Purpose:** Streamline operations for car rental agencies with comprehensive vehicle, booking, and customer management

## Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 15.1.4 (App Router with Turbopack)
- **UI Library:** React 19 (TypeScript 5)
- **UI Components:** shadcn/ui + Radix UI primitives
- **Styling:** Tailwind CSS 3.4.1 with custom animations
- **Forms:** React Hook Form 7.54.2 + Zod 3.24.1 validation
- **Icons:** Lucide React 0.468.0
- **Tables:** TanStack React Table 8.20.6
- **Date Utilities:** date-fns 3.6.0

### Backend
- **API:** Next.js API Routes (server actions pattern)
- **ORM:** Prisma 6.1.0
- **Database:** SQLite (migrated from PostgreSQL)
- **Authentication:** NextAuth.js 4.24.11 (JWT strategy, credentials provider)
- **Password Hashing:** bcryptjs 2.4.3
- **PDF Generation:** Playwright 1.49.1

## Project Structure

```
car rental sass/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public authentication routes
│   │   └── login/                # Login page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── vehicles/             # Vehicle management
│   │   ├── customers/            # Customer management
│   │   ├── bookings/             # Booking/reservation management
│   │   ├── contracts/            # Contract PDF generation
│   │   ├── payments/             # Payment tracking
│   │   ├── damage-reports/       # Damage reports & documentation
│   │   ├── catalogue/            # Vehicle catalogue
│   │   └── components/           # Dashboard-specific components
│   └── api/                      # API routes
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components (16+ components)
│   ├── shared/                   # Shared components (PageHeader, NavLink)
│   ├── bookings/                 # Booking-specific components
│   ├── customers/                # Customer-specific components
│   ├── payments/                 # Payment-specific components
│   └── vehicles/                 # Vehicle-specific components
├── lib/                          # Core utilities & business logic
│   ├── actions/                  # Server actions (CRUD operations)
│   ├── validations/              # Zod schemas for validation
│   ├── auth.ts                   # NextAuth.js configuration
│   ├── prisma.ts                 # Prisma client singleton
│   ├── availability.ts           # Booking availability logic
│   ├── contract-template.ts      # PDF contract templates
│   └── utils.ts                  # Helper utilities
├── prisma/                       # Database
│   ├── schema.prisma             # 12 data models
│   └── migrations/               # Database migrations
├── public/                       # Static assets
│   ├── assets/                   # Logos & images
│   └── uploads/                  # File storage (vehicle/damage photos)
└── types/                        # TypeScript type definitions
```

## Core Modules

### 1. Authentication & Security
- Credentials-based login (NextAuth.js with JWT)
- Role-based access control: `OWNER` and `STAFF`
- Protected routes via [middleware.ts](middleware.ts)
- Password hashing with bcryptjs

### 2. Vehicle Management
- CRUD operations for vehicles
- Status tracking: `AVAILABLE`, `RENTED`, `MAINTENANCE`, `UNAVAILABLE`
- Vehicle specs: make, model, year, plate, color, seats, AC, gearbox
- Photo upload support
- Mileage and maintenance tracking
- Daily rental pricing per vehicle

### 3. Customer Management
- Customer database with passport/CIN information
- ID photo storage
- Contact details (email, phone)
- Search and listing functionality

### 4. Booking System
- Create, view, update bookings
- Status: `DRAFT`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELED`
- Automatic availability checking (prevents overlapping bookings)
- Automatic price calculation based on dates and daily rates
- Support for multiple payment types
- Return date tracking (planned vs actual)

### 5. Payment Management
- Payment tracking: `PENDING`, `PAID`, `REFUNDED`
- Payment types: `CASH`, `CARD`, `TRANSFER`, `CMI`
- Payment categories: `RENTAL`, `DEPOSIT`, `REFUND`
- Booking payment status: `PENDING`, `PARTIAL`, `PAID`

### 6. Deposit Management
- Deposit status: `HELD`, `PARTIAL_RETURNED`, `RETURNED`, `FORFEITED`
- Deposit actions: `RELEASE`, `PARTIAL`, `HOLD`
- Track held and returned amounts

### 7. Damage Reporting
- Damage reports with photo documentation
- Fuel level and cleanliness tracking
- Deposit action decisions based on damage assessment
- Photo descriptions and timestamps

### 8. Contract Management
- Generate PDF contracts for bookings
- PDF stored with booking references
- Template system in [lib/contract-template.ts](lib/contract-template.ts)

### 9. Dashboard & Reporting
- **Operations du Jour:** Today's pickups and returns
- **Action Requise:** Required actions (red alerts)
- **Vue d'Ensemble:** Metrics and KPIs
- Vehicle status grid
- Revenue charts

### 10. Catalogue System
- Public vehicle catalogue
- Availability checking integrated with bookings
- Vehicle details and specifications

## Development Guidelines

### Language & Localization
- **All UI copy must be in French** (per [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md))
- Use "calm urgency" tone: professional, reliable, in control
- Brand promise: "Does this help the agency maintain control?"

### Code Conventions

#### Server Actions
- Location: `lib/actions/[domain].ts`
- Pattern: Export async functions that use Prisma client
- Always include proper error handling
- Example: `lib/actions/vehicles.ts`, `lib/actions/bookings.ts`

#### Validations
- Location: `lib/validations/[domain].ts`
- Use Zod schemas for type-safe validation
- Export both schema and inferred TypeScript type
- Example: `bookingSchema`, `vehicleSchema`

#### Components
- **Domain-specific:** `components/[domain]/` (e.g., `components/vehicles/`)
- **Shared UI:** `components/ui/` (shadcn components)
- **Common components:** `components/shared/` (PageHeader, NavLink, etc.)

### Multi-tenancy (CRITICAL)

**Always filter by `agencyId` in database queries!**

- All entities are scoped to Agency (except User and Agency models)
- Every Prisma query must include `where: { agencyId }`
- Cascade deletes configured in schema
- User-agency relationships enforced

Example:
```typescript
const vehicles = await prisma.vehicle.findMany({
  where: { agencyId: session.user.agencyId }
});
```

### Authentication
- Protected routes: All routes under `(dashboard)` group
- Middleware: [middleware.ts](middleware.ts) handles route protection
- Session: Access via `await auth()` from [lib/auth.ts](lib/auth.ts)
- Roles: Check `session.user.role` for OWNER/STAFF permissions

### Database
- **Client:** Use singleton from [lib/prisma.ts](lib/prisma.ts)
- **Mutations:** Always use server actions (no direct Prisma in components)
- **Patterns:** Follow existing patterns in `lib/actions/`
- **Transactions:** Use Prisma transactions for multi-model operations

## Key Files Reference

- [lib/auth.ts](lib/auth.ts) - NextAuth.js configuration and session management
- [middleware.ts](middleware.ts) - Route protection and auth middleware
- [prisma/schema.prisma](prisma/schema.prisma) - Database models (12 models)
- [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) - Complete design system & brand identity
- [README.md](README.md) - Installation & setup guide (French)
- [lib/availability.ts](lib/availability.ts) - Booking availability checking logic
- [lib/contract-template.ts](lib/contract-template.ts) - PDF contract generation templates

## Database Models

### Core Models (12 total)

1. **Agency** - Multi-tenancy root entity
2. **User** - System users with roles (`OWNER`, `STAFF`)
3. **Vehicle** - Fleet management with status tracking
4. **Customer** - Client database with passport/CIN info
5. **Booking** - Rental reservations with status workflow
6. **Payment** - Transaction tracking
7. **Deposit** - Security deposit management
8. **Contract** - PDF contract storage
9. **DamageReport** - Vehicle damage documentation
10. **DamagePhoto** - Damage report photos

### Key Relationships
- All entities cascade delete with Agency
- Booking → Vehicle, Customer, Agency (many-to-one)
- Payment → Booking (many-to-one)
- Deposit → Booking (one-to-one)
- Contract → Booking (one-to-one)
- DamageReport → Booking (one-to-one)

### Vehicle Status Enum
```prisma
enum VehicleStatus {
  AVAILABLE      // Ready to rent
  RENTED         // Currently rented out
  MAINTENANCE    // Under maintenance
  UNAVAILABLE    // Not available for rental
}
```

### Booking Status Enum
```prisma
enum BookingStatus {
  DRAFT          // Being created
  CONFIRMED      // Confirmed, awaiting pickup
  ACTIVE         // Currently rented (picked up)
  COMPLETED      // Returned and closed
  CANCELED       // Canceled reservation
}
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm start                # Run production server
npm run lint             # Run ESLint

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database (⚠️ destructive)
npm run db:studio        # Open Prisma Studio (http://localhost:5555)
```

## Important Notes

### Brand & Design
- **Primary Color:** #6D5EF7 (violet)
- **Theme:** Midnight Steel × Violet
- **Typography:** Inter font family
- **Icons:** Lucide React (stroke-based, 20px default)
- **Design system:** See [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)

### Environment Setup
- Copy `.env.example` to `.env`
- Required variables:
  - `DATABASE_URL` - SQLite connection string
  - `NEXTAUTH_URL` - Application URL (http://localhost:3000)
  - `NEXTAUTH_SECRET` - JWT secret (generate with `openssl rand -base64 32`)
  - `NEXT_PUBLIC_APP_URL` - Public app URL

### Configuration
- **Strict TypeScript** enabled
- **React Strict Mode** enabled
- **Image Optimization:** AVIF, WebP formats
- **Build:** Turbopack (dev), Next.js (production)
- **Compression:** Enabled in production

### Current State
- Database: SQLite (migrated from PostgreSQL)
- Recent features: Dashboard tracking, vehicle features, catalogue system
- Git branch: `main`

## Quick Tips

1. **Adding a new feature?** Follow existing patterns in similar modules
2. **Need to validate input?** Check `lib/validations/` for existing schemas
3. **Creating a form?** Use React Hook Form + Zod + shadcn/ui components
4. **Making DB changes?** Update Prisma schema, run migrations, update types
5. **Styling?** Follow Locapro brand guidelines (calm, professional, violet accent)
6. **Testing?** Use Prisma Studio (`npm run db:studio`) to inspect database

---

**For more details:**
- Installation: See [README.md](README.md)
- Design system: See [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md)
- Database schema: See [prisma/schema.prisma](prisma/schema.prisma)
