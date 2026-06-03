import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

const logger = new Logger('AuthSchemaFix');

function connectionString(config: ConfigService): string {
  const url = config.get<string>('DATABASE_URL');
  if (url) return url;
  const host = config.get('DB_HOST', 'localhost');
  const port = config.get('DB_PORT', 5433);
  const user = config.get('DB_USERNAME', 'postgres');
  const password = config.get('DB_PASSWORD', '12345');
  const database = config.get('DB_DATABASE', 'fems_auth');
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

async function columnExists(
  client: Client,
  table: string,
  column: string,
): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return res.rowCount > 0;
}

async function addEnumValueIfMissing(
  client: Client,
  enumName: string,
  value: string,
): Promise<void> {
  const res = await client.query(
    `SELECT 1 FROM pg_enum e
     JOIN pg_type t ON e.enumtypid = t.oid
     WHERE t.typname = $1 AND e.enumlabel = $2`,
    [enumName, value],
  );
  if (res.rowCount === 0) {
    await client.query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}'`);
    logger.log(`Added enum value ${enumName}.${value}`);
  }
}

/**
 * Prepares legacy fems_auth schema before TypeORM synchronize (avoids NOT NULL on empty columns).
 */
export async function runAuthSchemaFix(config: ConfigService): Promise<void> {
  const client = new Client({ connectionString: connectionString(config) });
  try {
    await client.connect();
  } catch (err) {
    logger.warn(`Auth schema fix skipped (database not reachable): ${(err as Error).message}`);
    return;
  }

  try {
    const tableCheck = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'`,
    );
    if (tableCheck.rowCount === 0) {
      return;
    }

    if (!(await columnExists(client, 'users', 'first_name'))) {
      await client.query(
        `ALTER TABLE users ADD COLUMN first_name varchar(100) DEFAULT ''`,
      );
      logger.log('Added users.first_name');
    } else {
      await client.query(
        `ALTER TABLE users ALTER COLUMN first_name SET DEFAULT ''`,
      );
    }

    if (!(await columnExists(client, 'users', 'last_name'))) {
      await client.query(
        `ALTER TABLE users ADD COLUMN last_name varchar(100) DEFAULT ''`,
      );
      logger.log('Added users.last_name');
    } else {
      await client.query(
        `ALTER TABLE users ALTER COLUMN last_name SET DEFAULT ''`,
      );
    }

    await client.query(`
      UPDATE users SET
        first_name = COALESCE(
          NULLIF(TRIM(first_name), ''),
          SPLIT_PART(TRIM(full_name), ' ', 1),
          'User'
        ),
        last_name = COALESCE(
          NULLIF(TRIM(last_name), ''),
          CASE
            WHEN POSITION(' ' IN TRIM(full_name)) > 0 THEN
              TRIM(SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1))
            ELSE SPLIT_PART(TRIM(full_name), ' ', 1)
          END,
          'Account'
        )
      WHERE full_name IS NOT NULL
    `);

    const enumRes = await client.query(
      `SELECT udt_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'`,
    );
    if (enumRes.rows[0]?.udt_name) {
      await addEnumValueIfMissing(client, enumRes.rows[0].udt_name, 'inspector');
    }
  } catch (err) {
    logger.error(`Auth schema fix failed: ${(err as Error).message}`);
    throw err;
  } finally {
    await client.end();
  }
}
