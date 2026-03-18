-- Baseline migration for the original core schema.
-- This is intentionally idempotent so it can be resolved on an existing dev
-- database while also allowing shadow-database replay from an empty database.

CREATE SCHEMA IF NOT EXISTS "public";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VehicleStatus') THEN
    CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
    CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentType') THEN
    CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CMI');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentCategory') THEN
    CREATE TYPE "PaymentCategory" AS ENUM ('RENTAL', 'DEPOSIT', 'REFUND');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingPaymentStatus') THEN
    CREATE TYPE "BookingPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingDepositStatus') THEN
    CREATE TYPE "BookingDepositStatus" AS ENUM ('PENDING', 'RECEIVED', 'RETURNED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositStatus') THEN
    CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'PARTIAL_RETURNED', 'RETURNED', 'FORFEITED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositAction') THEN
    CREATE TYPE "DepositAction" AS ENUM ('RELEASE', 'PARTIAL', 'HOLD');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InspectionSectionType') THEN
    CREATE TYPE "InspectionSectionType" AS ENUM ('CARROSSERIE', 'PNEUS', 'INTERIEUR', 'KILOMETRAGE', 'CARBURANT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InspectionStatus') THEN
    CREATE TYPE "InspectionStatus" AS ENUM ('OK', 'DAMAGE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InspectionType') THEN
    CREATE TYPE "InspectionType" AS ENUM ('DEPART', 'RETOUR');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReminderType') THEN
    CREATE TYPE "ReminderType" AS ENUM ('OIL_CHANGE', 'INSURANCE_EXPIRY', 'TECH_INSPECTION', 'VIGNETTE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationSeverity') THEN
    CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'DUE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationStatus') THEN
    CREATE TYPE "NotificationStatus" AS ENUM ('OPEN', 'SNOOZED', 'DONE', 'DISMISSED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationEventStatus') THEN
    CREATE TYPE "NotificationEventStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InfractionType') THEN
    CREATE TYPE "InfractionType" AS ENUM ('SPEEDING', 'PARKING', 'RED_LIGHT', 'TOLL', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InfractionStatus') THEN
    CREATE TYPE "InfractionStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PAID', 'CONTESTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gearbox') THEN
    CREATE TYPE "Gearbox" AS ENUM ('MANUAL', 'AUTO');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CustomerType') THEN
    CREATE TYPE "CustomerType" AS ENUM ('PERSONNE_PHYSIQUE', 'PERSONNE_MORALE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "agencies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Morocco',
  "currency" TEXT NOT NULL DEFAULT 'MAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STAFF',
  "agencyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "plate" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
  "pricePerDay" DOUBLE PRECISION NOT NULL,
  "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 2000,
  "gearbox" "Gearbox" NOT NULL DEFAULT 'MANUAL',
  "seats" INTEGER NOT NULL DEFAULT 5,
  "hasAC" BOOLEAN NOT NULL DEFAULT true,
  "category" TEXT NOT NULL DEFAULT 'Citadine',
  "photoUrl" TEXT,
  "mileage" INTEGER,
  "currentKm" INTEGER,
  "nextMaintenanceKm" INTEGER,
  "lastOilChangeMileageKm" INTEGER,
  "lastOilChangeDate" TIMESTAMP(3),
  "oilChangeIntervalKm" INTEGER,
  "oilChangeIntervalMonths" INTEGER,
  "nextOilChangeMileageKm" INTEGER,
  "nextOilChangeDate" TIMESTAMP(3),
  "insuranceProvider" TEXT,
  "insurancePolicyNumber" TEXT,
  "insuranceStartDate" TIMESTAMP(3),
  "insuranceExpiryDate" TIMESTAMP(3),
  "insuranceReminderDays" INTEGER[],
  "lastTechnicalInspectionDate" TIMESTAMP(3),
  "nextTechnicalInspectionDate" TIMESTAMP(3),
  "technicalInspectionReminderDays" INTEGER[],
  "vignetteExpiryDate" TIMESTAMP(3),
  "vignetteReminderDays" INTEGER[],
  "maintenanceNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "customerType" "CustomerType" NOT NULL DEFAULT 'PERSONNE_PHYSIQUE',
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT NOT NULL,
  "passportOrCIN" TEXT,
  "passportOrCINExpiry" TIMESTAMP(3),
  "passportPhotoUrl" TEXT,
  "address" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "nationality" TEXT NOT NULL DEFAULT 'Marocaine',
  "licenseNumber" TEXT,
  "licenseExpiry" TIMESTAMP(3),
  "licensePhotoUrl" TEXT,
  "ice" TEXT,
  "rc" TEXT,
  "representativeName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "actualReturnDate" TIMESTAMP(3),
  "pricePerDay" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "depositAmount" DOUBLE PRECISION NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "paymentStatus" "BookingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "depositStatus" "BookingDepositStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "pickupLocation" TEXT,
  "returnLocation" TEXT,
  "hasFullInsurance" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" "PaymentType" NOT NULL,
  "category" "PaymentCategory" NOT NULL DEFAULT 'RENTAL',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "deposits" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
  "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "returnedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "damage_reports" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "inspectionType" "InspectionType" NOT NULL DEFAULT 'RETOUR',
  "fuelLevel" TEXT,
  "cleanliness" TEXT,
  "notes" TEXT,
  "depositAction" "DepositAction" NOT NULL,
  "totalDamageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deductFromDeposit" BOOLEAN NOT NULL DEFAULT false,
  "deductedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "damage_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inspection_sections" (
  "id" TEXT NOT NULL,
  "damageReportId" TEXT NOT NULL,
  "sectionType" "InspectionSectionType" NOT NULL,
  "status" "InspectionStatus" NOT NULL DEFAULT 'OK',
  "notes" TEXT,
  "damageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inspection_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "damage_photos" (
  "id" TEXT NOT NULL,
  "damageReportId" TEXT NOT NULL,
  "sectionId" TEXT,
  "photoUrl" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "damage_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reminder_rules" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "type" "ReminderType" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "leadDays" INTEGER[],
  "leadKm" INTEGER[],
  "channelInApp" BOOLEAN NOT NULL DEFAULT true,
  "channelEmail" BOOLEAN NOT NULL DEFAULT false,
  "channelWhatsApp" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reminder_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" "ReminderType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "severity" "NotificationSeverity" NOT NULL,
  "dueAt" TIMESTAMP(3),
  "dueMileageKm" INTEGER,
  "status" "NotificationStatus" NOT NULL DEFAULT 'OPEN',
  "snoozedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_events" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationEventStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "infractions" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "bookingId" TEXT,
  "customerId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "time" TEXT,
  "type" "InfractionType" NOT NULL DEFAULT 'OTHER',
  "status" "InfractionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DOUBLE PRECISION,
  "notes" TEXT,
  "clientName" TEXT,
  "clientCin" TEXT,
  "clientPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "infractions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_agencyId_idx" ON "users"("agencyId");

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_plate_key" ON "vehicles"("plate");
CREATE INDEX IF NOT EXISTS "vehicles_agencyId_idx" ON "vehicles"("agencyId");
CREATE INDEX IF NOT EXISTS "vehicles_status_idx" ON "vehicles"("status");

CREATE INDEX IF NOT EXISTS "customers_agencyId_idx" ON "customers"("agencyId");

CREATE INDEX IF NOT EXISTS "bookings_agencyId_idx" ON "bookings"("agencyId");
CREATE INDEX IF NOT EXISTS "bookings_vehicleId_idx" ON "bookings"("vehicleId");
CREATE INDEX IF NOT EXISTS "bookings_customerId_idx" ON "bookings"("customerId");
CREATE INDEX IF NOT EXISTS "bookings_startDate_idx" ON "bookings"("startDate");
CREATE INDEX IF NOT EXISTS "bookings_endDate_idx" ON "bookings"("endDate");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");
CREATE INDEX IF NOT EXISTS "bookings_vehicleId_status_idx" ON "bookings"("vehicleId", "status");
CREATE INDEX IF NOT EXISTS "bookings_agencyId_status_idx" ON "bookings"("agencyId", "status");

CREATE INDEX IF NOT EXISTS "payments_bookingId_idx" ON "payments"("bookingId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_category_idx" ON "payments"("category");

CREATE UNIQUE INDEX IF NOT EXISTS "deposits_bookingId_key" ON "deposits"("bookingId");
CREATE INDEX IF NOT EXISTS "deposits_status_idx" ON "deposits"("status");

CREATE INDEX IF NOT EXISTS "damage_reports_bookingId_idx" ON "damage_reports"("bookingId");
CREATE INDEX IF NOT EXISTS "inspection_sections_damageReportId_idx" ON "inspection_sections"("damageReportId");
CREATE INDEX IF NOT EXISTS "damage_photos_damageReportId_idx" ON "damage_photos"("damageReportId");
CREATE INDEX IF NOT EXISTS "damage_photos_sectionId_idx" ON "damage_photos"("sectionId");

CREATE INDEX IF NOT EXISTS "reminder_rules_agencyId_idx" ON "reminder_rules"("agencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "reminder_rules_agencyId_type_key" ON "reminder_rules"("agencyId", "type");

CREATE INDEX IF NOT EXISTS "notifications_agencyId_idx" ON "notifications"("agencyId");
CREATE INDEX IF NOT EXISTS "notifications_vehicleId_idx" ON "notifications"("vehicleId");
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_agencyId_vehicleId_type_key" ON "notifications"("agencyId", "vehicleId", "type");

CREATE INDEX IF NOT EXISTS "notification_events_notificationId_idx" ON "notification_events"("notificationId");

CREATE INDEX IF NOT EXISTS "infractions_agencyId_idx" ON "infractions"("agencyId");
CREATE INDEX IF NOT EXISTS "infractions_agencyId_date_idx" ON "infractions"("agencyId", "date");
CREATE INDEX IF NOT EXISTS "infractions_agencyId_status_idx" ON "infractions"("agencyId", "status");
CREATE INDEX IF NOT EXISTS "infractions_agencyId_vehicleId_date_idx" ON "infractions"("agencyId", "vehicleId", "date");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_agencyId_fkey') THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_agencyId_fkey') THEN
    ALTER TABLE "vehicles"
      ADD CONSTRAINT "vehicles_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_agencyId_fkey') THEN
    ALTER TABLE "customers"
      ADD CONSTRAINT "customers_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_agencyId_fkey') THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_vehicleId_fkey') THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_customerId_fkey') THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_bookingId_fkey') THEN
    ALTER TABLE "payments"
      ADD CONSTRAINT "payments_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deposits_bookingId_fkey') THEN
    ALTER TABLE "deposits"
      ADD CONSTRAINT "deposits_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'damage_reports_bookingId_fkey') THEN
    ALTER TABLE "damage_reports"
      ADD CONSTRAINT "damage_reports_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspection_sections_damageReportId_fkey') THEN
    ALTER TABLE "inspection_sections"
      ADD CONSTRAINT "inspection_sections_damageReportId_fkey"
      FOREIGN KEY ("damageReportId") REFERENCES "damage_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'damage_photos_damageReportId_fkey') THEN
    ALTER TABLE "damage_photos"
      ADD CONSTRAINT "damage_photos_damageReportId_fkey"
      FOREIGN KEY ("damageReportId") REFERENCES "damage_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'damage_photos_sectionId_fkey') THEN
    ALTER TABLE "damage_photos"
      ADD CONSTRAINT "damage_photos_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "inspection_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reminder_rules_agencyId_fkey') THEN
    ALTER TABLE "reminder_rules"
      ADD CONSTRAINT "reminder_rules_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_agencyId_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_vehicleId_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_events_notificationId_fkey') THEN
    ALTER TABLE "notification_events"
      ADD CONSTRAINT "notification_events_notificationId_fkey"
      FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'infractions_agencyId_fkey') THEN
    ALTER TABLE "infractions"
      ADD CONSTRAINT "infractions_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'infractions_vehicleId_fkey') THEN
    ALTER TABLE "infractions"
      ADD CONSTRAINT "infractions_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'infractions_bookingId_fkey') THEN
    ALTER TABLE "infractions"
      ADD CONSTRAINT "infractions_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'infractions_customerId_fkey') THEN
    ALTER TABLE "infractions"
      ADD CONSTRAINT "infractions_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
