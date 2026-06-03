/**
 * Export FEMS PostgreSQL schema (structure only, no data) for all service databases.
 * Requires pg_dump on PATH.
 *
 * Usage:
 *   npm run export:schema
 *   DATABASE_URL_BASE=postgresql://postgres:pass@localhost:5432 npm run export:schema
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DB_URL =
  process.env.DATABASE_URL_BASE ??
  'postgresql://postgres:12345@localhost:5433';

const databases = [
  'fems_auth',
  'fems_customers',
  'fems_extinguishers',
  'fems_notifications',
  'fems_renewals',
  'fems_compliance',
  'fems_inspections',
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.join(process.cwd(), 'database-export', stamp);

function parseBaseUrl(url) {
  const u = new URL(url.replace('postgresql://', 'http://'));
  return {
    host: u.hostname,
    port: u.port || '5432',
    user: u.username || 'postgres',
    password: u.password || '',
  };
}

const conn = parseBaseUrl(DB_URL);
fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  exportedAt: new Date().toISOString(),
  connection: {
    host: conn.host,
    port: conn.port,
    user: conn.user,
    databases,
  },
  files: [],
};

console.log(`Exporting schema to ${outDir}\n`);

for (const db of databases) {
  const file = path.join(outDir, `${db}.schema.sql`);
  const env = { ...process.env, PGPASSWORD: conn.password };
  const cmd = [
    'pg_dump',
    `-h ${conn.host}`,
    `-p ${conn.port}`,
    `-U ${conn.user}`,
    '--schema-only',
    '--no-owner',
    '--no-privileges',
    '-F p',
    db,
    `-f "${file}"`,
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe', env, shell: true });
    console.log(`✓ ${db}`);
    manifest.files.push({ database: db, file: `${db}.schema.sql` });
  } catch {
    console.error(`✗ ${db} — is Postgres running? (pg_dump required)`);
    process.exitCode = 1;
  }
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

console.log('\nSchema export complete.');
console.log(`Manifest: ${path.join(outDir, 'manifest.json')}`);
