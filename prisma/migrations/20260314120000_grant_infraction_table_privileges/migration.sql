GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
ON TABLE "public"."infractions"
TO anon, authenticated, service_role, prisma;

GRANT USAGE
ON TYPE "public"."InfractionType"
TO anon, authenticated, service_role, prisma;

GRANT USAGE
ON TYPE "public"."InfractionStatus"
TO anon, authenticated, service_role, prisma;
