/**
 * Export all FEMS PostgreSQL databases using pg_dump.
 * Requires pg_dump on PATH (PostgreSQL client tools).
 *
 * Usage:
 *   node scripts/backup-databases.mjs
 *   DATABASE_URL_BASE=postgresql://postgres:pass@localhost:5433 node scripts/backup-databases.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DB_URL = process.env.DATABASE_URL_BASE
  ? process.env.DATABASE_URL_BASE
  : 'postgresql://postgres:12345@localhost:5433';

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
const outDir = path.join(process.cwd(), 'backups', stamp);

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

console.log(`Backing up to ${outDir}\n`);

for (const db of databases) {
  const file = path.join(outDir, `${db}.sql`);
  const env = { ...process.env, PGPASSWORD: conn.password };
  const cmd = [
    'pg_dump',
    `-h ${conn.host}`,
    `-p ${conn.port}`,
    `-U ${conn.user}`,
    '-F p',
    db,
    `-f "${file}"`,
  ].join(' ');
  try {
    execSync(cmd, { stdio: 'inherit', env, shell: true });
    console.log(`✓ ${db}`);
  } catch {
    console.error(`✗ ${db} — ensure pg_dump is installed and Postgres is running`);
    process.exitCode = 1;
  }
}

console.log('\nBackup complete.');
