/**
 * Delete specific maintenance log rows from fems_inspections.
 * Usage: node scripts/delete-maintenance-logs.mjs
 */
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_DATABASE || 'fems_inspections',
});

const TARGETS = [
  { actionTaken: 'Annual pressure test', maintenanceDate: '2026-06-03' },
  { actionTaken: 'Pressure test and recharge', maintenanceDate: '2026-05-04' },
];

async function main() {
  await client.connect();

  const before = await client.query(
    `SELECT id, extinguisher_id, action_taken, maintenance_date::text AS maintenance_date,
            notes, issues_identified, recommendations
     FROM maintenance_logs
     ORDER BY maintenance_date DESC`,
  );
  console.log('Before:', before.rows.length, 'rows');
  for (const row of before.rows) {
    console.log(' -', row.id, row.action_taken, row.maintenance_date, row.notes ?? '—');
  }

  let deleted = 0;
  for (const t of TARGETS) {
    const res = await client.query(
      `DELETE FROM maintenance_logs
       WHERE action_taken = $1 AND maintenance_date = $2::date`,
      [t.actionTaken, t.maintenanceDate],
    );
    deleted += res.rowCount ?? 0;
    console.log(`Deleted ${res.rowCount} row(s) for ${t.actionTaken} on ${t.maintenanceDate}`);
  }

  const after = await client.query(
    `SELECT COUNT(*)::int AS count FROM maintenance_logs`,
  );
  console.log(`Done. Removed ${deleted} row(s). Remaining: ${after.rows[0].count}`);
  await client.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
