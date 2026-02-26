-- Run this in Supabase Dashboard → SQL Editor to create the owner user for production.
-- Login: owner@automaroc.ma / password123

-- 1. Create agency if not exists (id used by seed)
INSERT INTO agencies (id, name, address, phone, email, city, country, currency, "createdAt", "updatedAt")
VALUES (
  'agency-1',
  'Auto Maroc Location',
  '123 Boulevard Mohammed V, Casablanca',
  '+212520123456',
  'contact@automaroc.ma',
  'Casablanca',
  'Morocco',
  'MAD',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  "updatedAt" = NOW();

-- 2. Create or update owner user (bcrypt hash for password123)
-- If your DB uses enum type "UserRole", uncomment the line below and remove the plain 'OWNER' line.
INSERT INTO users (id, email, password, name, role, "isActive", "agencyId", "createdAt", "updatedAt")
VALUES (
  'user-owner-1',
  'owner@automaroc.ma',
  '$2a$10$Ix4bv11ZEtvSlkh2NeS/LuAPzDaUUcoyEUAVgIURg7IOl.Gcg5lsa',
  'Hassan Alami',
  'OWNER',
  true,
  'agency-1',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "isActive" = true,
  "agencyId" = EXCLUDED."agencyId",
  "updatedAt" = NOW();

-- 3. Verify: run this and you should see one row
-- SELECT id, email, "isActive", "agencyId", role FROM users WHERE email = 'owner@automaroc.ma';
