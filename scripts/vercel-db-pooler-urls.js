#!/usr/bin/env node
/**
 * Print DATABASE_URL and DIRECT_URL with Supabase POOLER host for Vercel.
 * Run: node scripts/vercel-db-pooler-urls.js
 * Copy the two lines into Vercel → Settings → Environment Variables.
 */
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error(".env not found");
  process.exit(1);
}
const raw = fs.readFileSync(envPath, "utf8");
let databaseUrl = "";
let directUrl = "";
for (const line of raw.split("\n")) {
  const m = line.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\s#]+)/);
  if (m) databaseUrl = m[1].trim();
  const m2 = line.match(/^\s*DIRECT_URL\s*=\s*["']?([^"'\s#]+)/);
  if (m2) directUrl = m2[1].trim();
}
if (!databaseUrl || !directUrl) {
  console.error("DATABASE_URL and DIRECT_URL not found in .env");
  process.exit(1);
}
// Replace direct host with pooler, set correct ports and params
const poolerHost = "aws-1-eu-central-1.pooler.supabase.com";
// Parse and replace host in DATABASE_URL (use port 6543, add pgbouncer)
const u1 = new URL(databaseUrl);
u1.hostname = poolerHost;
u1.port = "6543";
if (!u1.searchParams.has("pgbouncer")) u1.searchParams.set("pgbouncer", "true");
if (!u1.searchParams.has("connect_timeout")) u1.searchParams.set("connect_timeout", "30");
const dbPooler = u1.toString();
// Parse and replace host in DIRECT_URL (use port 5432)
const u2 = new URL(directUrl);
u2.hostname = poolerHost;
u2.port = "5432";
const directPooler = u2.toString();

console.log("Add or update these in Vercel → Project → Settings → Environment Variables:\n");
console.log("DATABASE_URL");
console.log(dbPooler);
console.log("\nDIRECT_URL");
console.log(directPooler);
console.log("\nThen redeploy the project.");
console.log("\nIf you use a custom DB user (e.g. prisma), ensure the pooler supports it.");
console.log("Otherwise use postgres.PROJECT_REF and your DB password from Supabase Dashboard.");
console.log("  Example: postgres.actfqdgdmwfypffqazdv:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/...");