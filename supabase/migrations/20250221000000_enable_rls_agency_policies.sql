-- Locapro: Enable RLS and add agency-scoped policies
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) or via Supabase CLI.
-- Your app uses Prisma with the direct connection (often bypasses RLS). These
-- policies apply when using roles that respect RLS (e.g. anon key from client).
-- To enforce agency context with Prisma, set app.agency_id per request (see README in supabase/).

-- Helper: current agency id (set by app or JWT)
CREATE OR REPLACE FUNCTION app.current_agency_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.agency_id', true), '')::text;
$$;

-- ---------------------------------------------------------------------------
-- Agencies: user can only see their own agency
-- ---------------------------------------------------------------------------
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_select_own"
  ON public.agencies FOR SELECT
  USING (id = app.current_agency_id());

CREATE POLICY "agencies_update_own"
  ON public.agencies FOR UPDATE
  USING (id = app.current_agency_id());

-- ---------------------------------------------------------------------------
-- Users: scoped by agencyId
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_agency"
  ON public.users FOR SELECT
  USING ("agencyId" = app.current_agency_id());

CREATE POLICY "users_insert_agency"
  ON public.users FOR INSERT
  WITH CHECK ("agencyId" = app.current_agency_id());

CREATE POLICY "users_update_agency"
  ON public.users FOR UPDATE
  USING ("agencyId" = app.current_agency_id());

CREATE POLICY "users_delete_agency"
  ON public.users FOR DELETE
  USING ("agencyId" = app.current_agency_id());

-- ---------------------------------------------------------------------------
-- Vehicles, customers, bookings, expenses, reminder_rules, notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_agency" ON public.vehicles FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_agency" ON public.customers FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_agency" ON public.bookings FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_agency" ON public.expenses FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

ALTER TABLE public.reminder_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminder_rules_agency" ON public.reminder_rules FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_agency" ON public.notifications FOR ALL USING ("agencyId" = app.current_agency_id()) WITH CHECK ("agencyId" = app.current_agency_id());

-- ---------------------------------------------------------------------------
-- Child tables: scope via parent (booking → agency, damage_report → booking, notification → agency)
-- ---------------------------------------------------------------------------
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_addons_via_booking"
  ON public.booking_addons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  );

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_via_booking"
  ON public.payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  );

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits_via_booking"
  ON public.deposits FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  );

ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "damage_reports_via_booking"
  ON public.damage_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = "bookingId" AND b."agencyId" = app.current_agency_id())
  );

ALTER TABLE public.damage_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "damage_photos_via_report"
  ON public.damage_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.damage_reports dr
      JOIN public.bookings b ON b.id = dr."bookingId"
      WHERE dr.id = "damageReportId" AND b."agencyId" = app.current_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.damage_reports dr
      JOIN public.bookings b ON b.id = dr."bookingId"
      WHERE dr.id = "damageReportId" AND b."agencyId" = app.current_agency_id()
    )
  );

ALTER TABLE public.inspection_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspection_sections_via_report"
  ON public.inspection_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.damage_reports dr
      JOIN public.bookings b ON b.id = dr."bookingId"
      WHERE dr.id = "damageReportId" AND b."agencyId" = app.current_agency_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.damage_reports dr
      JOIN public.bookings b ON b.id = dr."bookingId"
      WHERE dr.id = "damageReportId" AND b."agencyId" = app.current_agency_id()
    )
  );

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_events_via_notification"
  ON public.notification_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = "notificationId" AND n."agencyId" = app.current_agency_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = "notificationId" AND n."agencyId" = app.current_agency_id())
  );
