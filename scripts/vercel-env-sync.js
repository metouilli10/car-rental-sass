#!/usr/bin/env node
/**
 * Sync environment variables from .env to a Vercel project via API.
 *
 * Usage:
 *   VERCEL_TOKEN=your_token PROJECT_ID=your_project_id node scripts/vercel-env-sync.js
 *
 * Optional: TEAM_ID=team_xxx (required if project is under a team)
 *
 * Get PROJECT_ID: Vercel Dashboard → Your Project → Settings → General → Project ID
 * Get token: Vercel Dashboard → Settings → Tokens (use "Full Account" scope to list/add env)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.env.VERCEL_TOKEN;
const projectIdOrName = process.env.PROJECT_ID || process.env.VERCEL_PROJECT_ID;
const teamId = process.env.TEAM_ID;
const listOnly = process.argv.includes('--list');

if (!token) {
  console.error('Set VERCEL_TOKEN (Vercel → Settings → Tokens; use Full Account scope).');
  process.exit(1);
}
if (!listOnly && !projectIdOrName) {
  console.error('Usage: VERCEL_TOKEN=xxx PROJECT_ID=xxx [TEAM_ID=xxx] node scripts/vercel-env-sync.js');
  console.error('       VERCEL_TOKEN=xxx node scripts/vercel-env-sync.js --list   # list projects to find PROJECT_ID');
  console.error('PROJECT_ID = project name or id (prj_xxx). TEAM_ID required if project is under a team.');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const vars = [];
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!key) continue;
  const override = process.env[`OVERRIDE_${key}`];
  vars.push({ key, value: override !== undefined ? override : value });
}

// Optional: set OVERRIDE_NEXTAUTH_URL and OVERRIDE_NEXT_PUBLIC_APP_URL to your Vercel URL when syncing for production

const target = ['production', 'preview'];
const baseUrl = 'api.vercel.com';

function request(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: baseUrl,
      path: pathname,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) reject(new Error(json.error?.message || data || res.statusCode));
          else resolve(json);
        } catch (e) {
          reject(new Error(data || e.message));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listProjects() {
  const pathname = teamId
    ? `/v9/projects?teamId=${encodeURIComponent(teamId)}`
    : '/v9/projects';
  const data = await request('GET', pathname);
  const projects = data.projects || [];
  if (projects.length === 0) {
    console.log('No projects found. Try with TEAM_ID=team_xxx (see Vercel Dashboard → Team Settings).');
    return;
  }
  console.log('Projects (use name or id as PROJECT_ID):');
  projects.forEach((p) => console.log('  ', p.name, '  id:', p.id));
}

async function main() {
  if (listOnly) {
    await listProjects();
    return;
  }

  const query = new URLSearchParams({ upsert: 'true' });
  if (teamId) query.set('teamId', teamId);
  const pathname = `/v10/projects/${encodeURIComponent(projectIdOrName)}/env?${query}`;

  console.log('Syncing', vars.length, 'env vars to Vercel project:', projectIdOrName);
  for (const { key, value } of vars) {
    try {
      await request('POST', pathname, {
        key,
        value,
        type: 'encrypted',
        target,
      });
      console.log('  OK', key);
    } catch (e) {
      console.error('  FAIL', key, e.message);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
