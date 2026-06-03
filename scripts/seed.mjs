/**
 * FEMS seed script — populates all databases with demo data.
 */
import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const { Client } = pg;
const DB_URL = process.env.DATABASE_URL_BASE
  ? process.env.DATABASE_URL_BASE
  : 'postgresql://postgres:12345@localhost:5433';

const ADMIN_PASSWORD = 'Admin@123';
const CUSTOMER_PASSWORD = 'Customer@123';
const INSPECTOR_PASSWORD = 'Inspector@123';

async function connect(dbName) {
  const client = new Client({ connectionString: `${DB_URL}/${dbName}` });
  await client.connect();
  return client;
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  );
  return result.rows[0].exists;
}

async function requireTable(client, dbLabel, tableName) {
  if (!(await tableExists(client, tableName))) {
    throw new Error(
      `Table "${tableName}" not found in ${dbLabel}. Start backend services first:\n  npm run dev:services`,
    );
  }
}

async function safeDelete(client, tableName) {
  if (await tableExists(client, tableName)) {
    await client.query(`DELETE FROM ${tableName}`);
  }
}

async function seedAuth() {
  const client = await connect('fems_auth');
  await requireTable(client, 'fems_auth', 'users');

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 12);
  const inspectorHash = await bcrypt.hash(INSPECTOR_PASSWORD, 12);

  await safeDelete(client, 'password_reset_tokens');
  await safeDelete(client, 'audit_logs');
  await safeDelete(client, 'refresh_tokens');
  await safeDelete(client, 'users');

  await client.query(
    `INSERT INTO users (id, first_name, last_name, full_name, email, password, role, created_at, updated_at)
     VALUES ($1, 'System', 'Administrator', 'System Administrator', 'admin@fems.local', $2, 'admin', NOW(), NOW())`,
    [randomUUID(), adminHash],
  );

  await client.query(
    `INSERT INTO users (id, first_name, last_name, full_name, email, password, role, created_at, updated_at)
     VALUES
       ($1, 'Alice', 'Johnson', 'Alice Johnson', 'alice@example.com', $2, 'customer', NOW(), NOW()),
       ($3, 'Bob', 'Smith', 'Bob Smith', 'bob@example.com', $2, 'customer', NOW(), NOW())`,
    [randomUUID(), customerHash, randomUUID()],
  );

  await client.query(
    `INSERT INTO users (id, first_name, last_name, full_name, email, password, role, created_at, updated_at)
     VALUES ($1, 'Ian', 'Inspector', 'Ian Inspector', 'inspector@fems.local', $2, 'inspector', NOW(), NOW())`,
    [randomUUID(), inspectorHash],
  );

  await client.end();
  console.log('✓ fems_auth seeded');
}

async function seedCustomers() {
  const client = await connect('fems_customers');
  await requireTable(client, 'fems_customers', 'customers');
  const ids = {
    alice: randomUUID(),
    bob: randomUUID(),
    carol: randomUUID(),
  };

  await safeDelete(client, 'customers');
  await client.query(
    `INSERT INTO customers (id, full_name, national_id, phone, email, address, created_at, updated_at)
     VALUES
       ($1, 'Alice Johnson', 'NAT-001', '+250780000001', 'alice@example.com', 'Kigali, Rwanda', NOW(), NOW()),
       ($2, 'Bob Smith', 'NAT-002', '+250780000002', 'bob@example.com', 'Musanze, Rwanda', NOW(), NOW()),
       ($3, 'Carol Williams', 'NAT-003', '+250780000003', 'carol@example.com', 'Huye, Rwanda', NOW(), NOW())`,
    [ids.alice, ids.bob, ids.carol],
  );

  await client.end();
  console.log('✓ fems_customers seeded');
  return ids;
}

async function seedExtinguishers(customerIds) {
  const client = await connect('fems_extinguishers');
  await requireTable(client, 'fems_extinguishers', 'fire_extinguishers');
  const today = new Date();
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  const extinguishers = [
    { serial: 'FE-STOCK-001', location: 'Central warehouse', type: 'DRY_CHEMICAL', size: '5_LB', install: addDays(-60), expiry: addDays(700), status: 'IN_STOCK', customerId: null },
    { serial: 'FE-STOCK-002', location: 'Central warehouse', type: 'CO2', size: '9_LB', install: addDays(-30), expiry: addDays(900), status: 'IN_STOCK', customerId: null },
    { serial: 'FE-001', location: 'Building A — Floor 2', type: 'DRY_CHEMICAL', size: '5_LB', install: addDays(-730), expiry: addDays(45), status: 'EXPIRING_SOON', customerId: customerIds.alice },
    { serial: 'FE-002', location: 'Building A — Lobby', type: 'CO2', size: '5_LB', install: addDays(-365), expiry: addDays(120), status: 'ACTIVE', customerId: customerIds.alice },
    { serial: 'FE-003', location: 'Warehouse Bay 3', type: 'FOAM', size: '9_LB', install: addDays(-900), expiry: addDays(-10), status: 'EXPIRED', customerId: customerIds.alice },
    { serial: 'FE-004', location: 'Office Block B', type: 'DRY_CHEMICAL', size: '5_LB', install: addDays(-400), expiry: addDays(15), status: 'EXPIRING_SOON', customerId: customerIds.bob },
    { serial: 'FE-005', location: 'Cafeteria', type: 'WATER', size: '9_LB', install: addDays(-200), expiry: addDays(200), status: 'ACTIVE', customerId: customerIds.bob },
  ];

  const extIds = [];
  await safeDelete(client, 'fire_extinguishers');

  for (const ext of extinguishers) {
    const id = randomUUID();
    extIds.push({ id, ...ext });
    await client.query(
      `INSERT INTO fire_extinguishers (id, serial_number, location, type, size, installation_date, expiry_date, status, customer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [id, ext.serial, ext.location, ext.type, ext.size, ext.install, ext.expiry, ext.status, ext.customerId],
    );
  }

  await client.end();
  console.log('✓ fems_extinguishers seeded');
  return extIds;
}

async function seedInspections(customerIds, extIds) {
  const client = await connect('fems_inspections');
  if (!(await tableExists(client, 'inspection_schedules'))) {
    await client.end();
    console.log('⊘ fems_inspections skipped (start inspection-maintenance-service first)');
    return;
  }

  await safeDelete(client, 'maintenance_logs');
  await safeDelete(client, 'inspection_schedules');

  const ext = extIds[0];
  await client.query(
    `INSERT INTO inspection_schedules (id, extinguisher_id, customer_id, scheduled_by_user_id, inspector_user_id, inspection_date, inspection_time, status, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, $5, '10:00', 'PENDING', 'Annual inspection', NOW(), NOW())`,
    [randomUUID(), ext.id, customerIds.alice, randomUUID(), addDaysIso(7)],
  );

  await client.query(
    `INSERT INTO maintenance_logs (id, extinguisher_id, inspector_user_id, action_taken, maintenance_date, issues_identified, notes, created_at)
     VALUES ($1, $2, $3, 'Pressure test and recharge', $4, 'Minor hose wear', 'Recommend replacement next cycle', NOW())`,
    [randomUUID(), ext.id, randomUUID(), addDaysIso(-30)],
  );

  await client.end();
  console.log('✓ fems_inspections seeded');
}

function addDaysIso(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

async function seedNotifications(customerIds) {
  const client = await connect('fems_notifications');
  await requireTable(client, 'fems_notifications', 'notifications');
  await safeDelete(client, 'notification_deliveries');
  await safeDelete(client, 'notifications');
  await safeDelete(client, 'system_settings');

  const notifId = randomUUID();
  await client.query(
    `INSERT INTO notifications (id, customer_id, extinguisher_id, message, type, channel, status, sent_at, read_at, created_at)
     VALUES ($1, $2, $3, 'Your fire extinguisher FE-001 expires in 45 days.', 'EXPIRY_60', 'EMAIL', 'SENT', NOW(), NULL, NOW())`,
    [notifId, customerIds.alice, randomUUID()],
  );

  await client.end();
  console.log('✓ fems_notifications seeded');
}

async function seedRenewals(customerIds) {
  const client = await connect('fems_renewals');
  await requireTable(client, 'fems_renewals', 'renewal_requests');
  await safeDelete(client, 'renewal_requests');
  await client.end();
  console.log('✓ fems_renewals seeded');
}

async function seedCompliance(customerIds) {
  const client = await connect('fems_compliance');
  await requireTable(client, 'fems_compliance', 'compliance_cases');
  await safeDelete(client, 'compliance_cases');
  await client.end();
  console.log('✓ fems_compliance seeded');
}

async function main() {
  console.log('Seeding FEMS databases...\n');
  await seedAuth();
  const customerIds = await seedCustomers();
  const extIds = await seedExtinguishers(customerIds);
  await seedInspections(customerIds, extIds);
  await seedNotifications(customerIds);
  await seedRenewals(customerIds);
  await seedCompliance(customerIds);
  console.log('\nSeed complete!');
  console.log('Admin: admin@fems.local / Admin@123');
  console.log('Inspector: inspector@fems.local / Inspector@123');
  console.log('User (customer): alice@example.com / Customer@123');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
