/**

 * One-shot schema repair for upgraded FEMS databases.

 * Run before dev:services if auth/extinguisher fail to start:

 *   node scripts/fix-schemas.mjs

 */

import pg from 'pg';



const { Client } = pg;

const DB_URL = process.env.DATABASE_URL_BASE

  ? process.env.DATABASE_URL_BASE

  : 'postgresql://postgres:12345@localhost:5433';



async function fixAuth() {

  const client = new Client({ connectionString: `${DB_URL}/fems_auth` });

  await client.connect();

  const exists = await client.query(

    `SELECT 1 FROM information_schema.tables WHERE table_name = 'users'`,

  );

  if (exists.rowCount === 0) {

    await client.end();

    return;

  }



  await client.query(

    `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar(100) DEFAULT ''`,

  );

  await client.query(

    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar(100) DEFAULT ''`,

  );

  await client.query(`

    UPDATE users SET

      first_name = COALESCE(NULLIF(TRIM(first_name), ''), SPLIT_PART(TRIM(full_name), ' ', 1), 'User'),

      last_name = COALESCE(

        NULLIF(TRIM(last_name), ''),

        CASE WHEN POSITION(' ' IN TRIM(full_name)) > 0

          THEN TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))

          ELSE SPLIT_PART(TRIM(full_name), ' ', 1) END,

        'Account'

      )

  `);

  console.log('✓ fems_auth users columns backfilled');

  await client.end();

}



async function ensureEnum(client, typeName, labels) {

  const exists = await client.query(`SELECT 1 FROM pg_type WHERE typname = $1`, [

    typeName,

  ]);

  if (exists.rowCount === 0) {

    await client.query(

      `CREATE TYPE "${typeName}" AS ENUM (${labels.map((l) => `'${l}'`).join(', ')})`,

    );

  }

}



async function fixExtinguisher() {

  const client = new Client({

    connectionString: `${DB_URL}/fems_extinguishers`,

  });

  await client.connect();

  const table = await client.query(

    `SELECT 1 FROM information_schema.tables WHERE table_name = 'fire_extinguishers'`,

  );

  if (table.rowCount === 0) {

    await client.end();

    return;

  }



  await client.query(

    `ALTER TABLE fire_extinguishers ADD COLUMN IF NOT EXISTS location varchar(255) DEFAULT 'Unspecified'`,

  );

  await client.query(

    `UPDATE fire_extinguishers SET location = 'Unspecified' WHERE location IS NULL OR TRIM(location) = ''`,

  );



  const hasPurchase = await client.query(

    `SELECT 1 FROM information_schema.columns WHERE table_name = 'fire_extinguishers' AND column_name = 'purchase_date'`,

  );

  const hasInstall = await client.query(

    `SELECT 1 FROM information_schema.columns WHERE table_name = 'fire_extinguishers' AND column_name = 'installation_date'`,

  );

  if (hasPurchase.rowCount > 0 && hasInstall.rowCount === 0) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN installation_date date`,

    );

    await client.query(

      `UPDATE fire_extinguishers SET installation_date = purchase_date WHERE installation_date IS NULL`,

    );

  }

  await client.query(

    `ALTER TABLE fire_extinguishers ADD COLUMN IF NOT EXISTS installation_date date DEFAULT CURRENT_DATE`,

  );

  await client.query(

    `UPDATE fire_extinguishers SET installation_date = CURRENT_DATE WHERE installation_date IS NULL`,

  );



  const hasCapacity = await client.query(

    `SELECT 1 FROM information_schema.columns WHERE table_name = 'fire_extinguishers' AND column_name = 'capacity'`,

  );

  if (hasCapacity.rowCount > 0) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN IF NOT EXISTS size varchar(50)`,

    );

    const rows = await client.query(`SELECT id, capacity FROM fire_extinguishers`);

    for (const row of rows.rows) {

      const cap = String(row.capacity ?? '').toLowerCase();

      let size = '5_LB';

      if (cap.includes('2.5') || cap.includes('1.5') || cap.includes('2kg')) size = '2.5_LB';

      else if (cap.includes('12')) size = '12_LB';

      else if (cap.includes('9')) size = '9_LB';

      await client.query(`UPDATE fire_extinguishers SET size = $1 WHERE id = $2`, [

        size,

        row.id,

      ]);

    }

  }

  const sizeMetaEarly = await client.query(

    `SELECT udt_name FROM information_schema.columns

     WHERE table_name = 'fire_extinguishers' AND column_name = 'size'`,

  );

  if (sizeMetaEarly.rowCount === 0) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN size varchar(50) DEFAULT '5_LB'`,

    );

  } else if (sizeMetaEarly.rows[0].udt_name === 'varchar') {

    await client.query(

      `UPDATE fire_extinguishers SET size = '5_LB' WHERE size IS NULL OR TRIM(size::text) = ''`,

    );

  }



  await ensureEnum(client, 'fire_extinguishers_type_enum', [

    'WATER',

    'CO2',

    'FOAM',

    'DRY_CHEMICAL',

  ]);

  await ensureEnum(client, 'fire_extinguishers_size_enum', [

    '2.5_LB',

    '5_LB',

    '9_LB',

    '12_LB',

  ]);



  const typeCol = await client.query(

    `SELECT udt_name FROM information_schema.columns

     WHERE table_name = 'fire_extinguishers' AND column_name = 'type'`,

  );

  if (typeCol.rowCount === 0) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN type fire_extinguishers_type_enum NOT NULL DEFAULT 'DRY_CHEMICAL'`,

    );

    await client.query(

      `ALTER TABLE fire_extinguishers ALTER COLUMN type DROP DEFAULT`,

    );

  } else if (typeCol.rows[0].udt_name !== 'fire_extinguishers_type_enum') {

    await client.query(`

      ALTER TABLE fire_extinguishers

      ALTER COLUMN type TYPE fire_extinguishers_type_enum

      USING (

        CASE

          WHEN type IS NULL OR TRIM(type::text) = '' THEN 'DRY_CHEMICAL'

          WHEN UPPER(type::text) IN ('WATER','CO2','FOAM','DRY_CHEMICAL') THEN UPPER(type::text)

          WHEN UPPER(type::text) LIKE '%CO2%' THEN 'CO2'

          WHEN UPPER(type::text) LIKE '%FOAM%' THEN 'FOAM'

          WHEN UPPER(type::text) LIKE '%WATER%' THEN 'WATER'

          ELSE 'DRY_CHEMICAL'

        END

      )::fire_extinguishers_type_enum

    `);

  }



  const sizeCol = await client.query(

    `SELECT udt_name FROM information_schema.columns

     WHERE table_name = 'fire_extinguishers' AND column_name = 'size'`,

  );

  if (sizeCol.rowCount === 0) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN size fire_extinguishers_size_enum NOT NULL DEFAULT '5_LB'`,

    );

    await client.query(

      `ALTER TABLE fire_extinguishers ALTER COLUMN size DROP DEFAULT`,

    );

  } else if (sizeCol.rows[0].udt_name !== 'fire_extinguishers_size_enum') {

    await client.query(`

      ALTER TABLE fire_extinguishers

      ALTER COLUMN size TYPE fire_extinguishers_size_enum

      USING (

        CASE

          WHEN size IS NULL OR TRIM(size::text) = '' THEN '5_LB'

          WHEN size::text IN ('2.5_LB','5_LB','9_LB','12_LB') THEN size::text

          WHEN size::text = '1.5_LB' THEN '2.5_LB'

          WHEN LOWER(size::text) LIKE '%2.5%' OR LOWER(size::text) LIKE '%1.5%' THEN '2.5_LB'

          WHEN LOWER(size::text) LIKE '%12%' THEN '12_LB'

          WHEN LOWER(size::text) LIKE '%9%' THEN '9_LB'

          ELSE '5_LB'

        END

      )::fire_extinguishers_size_enum

    `);

  }



  await client.query(

    `ALTER TABLE fire_extinguishers DROP COLUMN IF EXISTS capacity`,

  );

  await client.query(

    `ALTER TABLE fire_extinguishers DROP COLUMN IF EXISTS purchase_date`,

  );



  await client.query(
    `ALTER TYPE fire_extinguishers_size_enum ADD VALUE IF NOT EXISTS '2.5_LB'`,
  );
  await client.query(
    `UPDATE fire_extinguishers SET size = '2.5_LB'::fire_extinguishers_size_enum WHERE size::text = '1.5_LB'`,
  );

  console.log('✓ fems_extinguishers type/size enums migrated');

  await client.end();

}



async function ensureInspectionDb() {

  const client = new Client({ connectionString: `${DB_URL}/postgres` });

  await client.connect();

  const res = await client.query(

    "SELECT 1 FROM pg_database WHERE datname = 'fems_inspections'",

  );

  if (res.rowCount === 0) {

    await client.query('CREATE DATABASE fems_inspections');

    console.log('✓ created fems_inspections database');

  }

  await client.end();

}



async function main() {

  console.log('Fixing legacy schemas...\n');

  await ensureInspectionDb();

  await fixAuth();

  await fixExtinguisher();

  console.log('\nDone. Restart: npm run dev:services');

}



main().catch((e) => {

  console.error(e.message);

  process.exit(1);

});


