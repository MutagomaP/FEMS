import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

const logger = new Logger('InspectionSchemaFix');

function connectionString(config: ConfigService): string {
  const url = config.get<string>('DATABASE_URL');
  if (url) return url;
  const host = config.get('DB_HOST', 'localhost');
  const port = config.get('DB_PORT', 5433);
  const user = config.get('DB_USERNAME', 'postgres');
  const password = config.get('DB_PASSWORD', '12345');
  const database = config.get('DB_DATABASE', 'fems_inspections');
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export async function runInspectionSchemaFix(config: ConfigService): Promise<void> {
  const client = new Client({ connectionString: connectionString(config) });
  await client.connect();
  try {
    const col = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'maintenance_logs' AND column_name = 'recommendations'`,
    );
    if (col.rowCount === 0) {
      await client.query(
        `ALTER TABLE maintenance_logs ADD COLUMN recommendations text`,
      );
      logger.log('Added maintenance_logs.recommendations column');
    }
  } catch (err) {
    logger.error(`Inspection schema fix failed: ${(err as Error).message}`);
    throw err;
  } finally {
    await client.end();
  }
}
