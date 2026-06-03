/**
 * Restore FEMS PostgreSQL databases from pg_dump SQL files.
 * Requires psql on PATH (PostgreSQL client tools).
 *
 * Usage:
 *   node scripts/restore-databases.mjs backups/2026-06-03T09-00-00
 *   DATABASE_URL_BASE=postgresql://postgres:pass@localhost:5433 node scripts/restore-databases.mjs ./backups/my-export
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const databases = [
  'fems_auth',
  'fems_customers',
  'fems_extinguishers',
  'fems_notifications',
  'fems_renewals',
  'fems_compliance',
  'fems_inspections',
];

const backupDir = process.argv[2];
if (!backupDir) {
  console.error('Usage: node scripts/restore-databases.mjs <backup-directory>');
  process.exit(1);
}

const resolvedDir = path.resolve(backupDir);
if (!fs.existsSync(resolvedDir)) {
  console.error(`Backup directory not found: ${resolvedDir}`);
  process.exit(1);
}

const DB_URL = process.env.DATABASE_URL_BASE
  ? process.env.DATABASE_URL_BASE
  : 'postgresql://postgres:12345@localhost:5433';

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
console.log(`Restoring from ${resolvedDir}\n`);

for (const db of databases) {
  const file = path.join(resolvedDir, `${db}.sql`);
  if (!fs.existsSync(file)) {
    console.warn(`⚠ Skipping ${db} — file not found: ${file}`);
    continue;
  }
  const env = { ...process.env, PGPASSWORD: conn.password };
  const cmd = [
    'psql',
    `-h ${conn.host}`,
    `-p ${conn.port}`,
    `-U ${conn.user}`,
    '-d',
    db,
    '-f',
    `"${file}"`,
  ].join(' ');
  try {
    execSync(cmd, { stdio: 'inherit', env, shell: true });
    console.log(`✓ ${db}`);
  } catch {
    console.error(`✗ ${db} — restore failed`);
    process.exitCode = 1;
  }
}

console.log('\nRestore complete.');
