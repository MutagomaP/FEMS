import { Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { Client } from 'pg';



const logger = new Logger('ExtinguisherSchemaFix');



const TYPE_ENUM = 'fire_extinguishers_type_enum';

const SIZE_ENUM = 'fire_extinguishers_size_enum';



function connectionString(config: ConfigService): string {

  const url = config.get<string>('DATABASE_URL');

  if (url) return url;

  const host = config.get('DB_HOST', 'localhost');

  const port = config.get('DB_PORT', 5433);

  const user = config.get('DB_USERNAME', 'postgres');

  const password = config.get('DB_PASSWORD', '12345');

  const database = config.get('DB_DATABASE', 'fems_extinguishers');

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;

}



async function columnExists(

  client: Client,

  column: string,

): Promise<boolean> {

  const res = await client.query(

    `SELECT 1 FROM information_schema.columns

     WHERE table_schema = 'public' AND table_name = 'fire_extinguishers' AND column_name = $1`,

    [column],

  );

  return res.rowCount > 0;

}



async function columnUdtName(

  client: Client,

  column: string,

): Promise<string | null> {

  const res = await client.query(

    `SELECT udt_name, data_type FROM information_schema.columns

     WHERE table_schema = 'public' AND table_name = 'fire_extinguishers' AND column_name = $1`,

    [column],

  );

  return res.rows[0]?.udt_name ?? null;

}



async function ensureEnumType(

  client: Client,

  typeName: string,

  labels: string[],

): Promise<void> {

  const exists = await client.query(`SELECT 1 FROM pg_type WHERE typname = $1`, [

    typeName,

  ]);

  if (exists.rowCount === 0) {

    const values = labels.map((l) => `'${l}'`).join(', ');

    await client.query(`CREATE TYPE "${typeName}" AS ENUM (${values})`);

    logger.log(`Created enum ${typeName}`);

  }

}



async function migrateToEnum(

  client: Client,

  column: string,

  enumName: string,

  labels: string[],

  usingExpr: string,

  defaultLabel: string,

): Promise<void> {

  await ensureEnumType(client, enumName, labels);



  const udt = await columnUdtName(client, column);

  if (!udt) {

    await client.query(

      `ALTER TABLE fire_extinguishers ADD COLUMN ${column} "${enumName}" NOT NULL DEFAULT '${defaultLabel}'`,

    );

    await client.query(

      `ALTER TABLE fire_extinguishers ALTER COLUMN ${column} DROP DEFAULT`,

    );

    logger.log(`Added fire_extinguishers.${column} (${enumName})`);

    return;

  }



  if (udt === enumName) {

    await client.query(

      `UPDATE fire_extinguishers SET ${column} = $1::"${enumName}" WHERE ${column} IS NULL`,

      [defaultLabel],

    );

    return;

  }



  await client.query(`

    ALTER TABLE fire_extinguishers

    ALTER COLUMN ${column} TYPE "${enumName}"

    USING (${usingExpr})::"${enumName}"

  `);

  await client.query(

    `UPDATE fire_extinguishers SET ${column} = $1::"${enumName}" WHERE ${column} IS NULL`,

    [defaultLabel],

  );

  logger.log(`Migrated fire_extinguishers.${column} → ${enumName}`);

}



export async function runExtinguisherSchemaFix(

  config: ConfigService,

): Promise<void> {

  const client = new Client({ connectionString: connectionString(config) });

  try {

    await client.connect();

  } catch (err) {

    logger.warn(

      `Extinguisher schema fix skipped: ${(err as Error).message}`,

    );

    return;

  }



  try {

    const tableCheck = await client.query(

      `SELECT 1 FROM information_schema.tables

       WHERE table_schema = 'public' AND table_name = 'fire_extinguishers'`,

    );

    if (tableCheck.rowCount === 0) {

      return;

    }



    if (!(await columnExists(client, 'location'))) {

      await client.query(

        `ALTER TABLE fire_extinguishers ADD COLUMN location varchar(255) DEFAULT 'Unspecified'`,

      );

      logger.log('Added fire_extinguishers.location');

    }

    await client.query(

      `UPDATE fire_extinguishers SET location = 'Unspecified' WHERE location IS NULL OR TRIM(location) = ''`,

    );



    const hasPurchase = await columnExists(client, 'purchase_date');

    const hasInstallation = await columnExists(client, 'installation_date');



    if (hasPurchase && !hasInstallation) {

      await client.query(

        `ALTER TABLE fire_extinguishers ADD COLUMN installation_date date`,

      );

      await client.query(

        `UPDATE fire_extinguishers SET installation_date = purchase_date WHERE installation_date IS NULL`,

      );

      logger.log('Migrated purchase_date → installation_date');

    }



    if (!(await columnExists(client, 'installation_date'))) {

      await client.query(

        `ALTER TABLE fire_extinguishers ADD COLUMN installation_date date DEFAULT CURRENT_DATE`,

      );

    }

    await client.query(

      `UPDATE fire_extinguishers SET installation_date = CURRENT_DATE WHERE installation_date IS NULL`,

    );



    if (await columnExists(client, 'capacity')) {

      if (!(await columnExists(client, 'size'))) {

        await client.query(

          `ALTER TABLE fire_extinguishers ADD COLUMN size varchar(50)`,

        );

      }

      const rows = await client.query(`SELECT id, capacity FROM fire_extinguishers`);

      for (const row of rows.rows) {

        const cap = String(row.capacity ?? '').toLowerCase();

        let size = '5_LB';

        if (cap.includes('2.5') || cap.includes('1.5') || cap.includes('2kg') || cap.includes('2 kg')) {

          size = '2.5_LB';

        } else if (cap.includes('12')) {

          size = '12_LB';

        } else if (cap.includes('9')) {

          size = '9_LB';

        }

        await client.query(`UPDATE fire_extinguishers SET size = $1 WHERE id = $2`, [

          size,

          row.id,

        ]);

      }

    }



    if (!(await columnExists(client, 'size'))) {

      await client.query(

        `ALTER TABLE fire_extinguishers ADD COLUMN size varchar(50) DEFAULT '5_LB'`,

      );

    } else {

      const sizeUdt = await columnUdtName(client, 'size');

      if (sizeUdt === 'varchar') {

        await client.query(

          `UPDATE fire_extinguishers SET size = '5_LB' WHERE size IS NULL OR TRIM(size::text) = ''`,

        );

      }

    }



    const typeUsing = `

      CASE

        WHEN type IS NULL OR TRIM(type::text) = '' THEN 'DRY_CHEMICAL'

        WHEN UPPER(type::text) IN ('WATER','CO2','FOAM','DRY_CHEMICAL') THEN UPPER(type::text)

        WHEN UPPER(type::text) LIKE '%CO2%' OR UPPER(type::text) LIKE '%CARBON%' THEN 'CO2'

        WHEN UPPER(type::text) LIKE '%FOAM%' THEN 'FOAM'

        WHEN UPPER(type::text) LIKE '%WATER%' THEN 'WATER'

        ELSE 'DRY_CHEMICAL'

      END

    `;



    await migrateToEnum(

      client,

      'type',

      TYPE_ENUM,

      ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'],

      typeUsing,

      'DRY_CHEMICAL',

    );



    const sizeUsing = `

      CASE

        WHEN size IS NULL OR TRIM(size::text) = '' THEN '5_LB'

        WHEN size::text IN ('2.5_LB','5_LB','9_LB','12_LB') THEN size::text

        WHEN size::text = '1.5_LB' THEN '2.5_LB'

        WHEN LOWER(size::text) LIKE '%2.5%' OR LOWER(size::text) LIKE '%1.5%' OR LOWER(size::text) LIKE '%2kg%' THEN '2.5_LB'

        WHEN LOWER(size::text) LIKE '%12%' THEN '12_LB'

        WHEN LOWER(size::text) LIKE '%9%' THEN '9_LB'

        ELSE '5_LB'

      END

    `;



    await migrateToEnum(

      client,

      'size',

      SIZE_ENUM,

      ['2.5_LB', '5_LB', '9_LB', '12_LB'],

      sizeUsing,

      '5_LB',

    );

    await client.query(
      `ALTER TYPE "${SIZE_ENUM}" ADD VALUE IF NOT EXISTS '2.5_LB'`,
    );
    await client.query(
      `UPDATE fire_extinguishers SET size = '2.5_LB'::"${SIZE_ENUM}" WHERE size::text = '1.5_LB'`,
    );



    if (await columnExists(client, 'capacity')) {

      await client.query(`ALTER TABLE fire_extinguishers DROP COLUMN capacity`);

      logger.log('Dropped legacy capacity column');

    }

    if (await columnExists(client, 'purchase_date')) {

      await client.query(`ALTER TABLE fire_extinguishers DROP COLUMN purchase_date`);

      logger.log('Dropped legacy purchase_date column');

    }

    await client.query(
      `ALTER TABLE fire_extinguishers ALTER COLUMN customer_id DROP NOT NULL`,
    ).catch(() => {});

    const statusEnum = await client.query(
      `SELECT udt_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'fire_extinguishers' AND column_name = 'status'`,
    );
    const statusType = statusEnum.rows[0]?.udt_name as string | undefined;
    if (statusType) {
      await client.query(
        `ALTER TYPE "${statusType}" ADD VALUE IF NOT EXISTS 'IN_STOCK'`,
      ).catch(() => {});
      logger.log('Ensured IN_STOCK on extinguisher status enum');
    }

    const uniqueSerial = await client.query(
      `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'fire_extinguishers'
       AND indexname = 'uq_fire_extinguishers_serial_number'`,
    );
    if (uniqueSerial.rowCount === 0) {
      await client.query(
        `CREATE UNIQUE INDEX uq_fire_extinguishers_serial_number ON fire_extinguishers (serial_number)`,
      );
      logger.log('Created unique index on fire_extinguishers.serial_number');
    }

  } catch (err) {

    logger.error(`Extinguisher schema fix failed: ${(err as Error).message}`);

    throw err;

  } finally {

    await client.end();

  }

}


