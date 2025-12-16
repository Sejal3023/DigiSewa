import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';

const { Client } = pkg;

async function applySchema() {
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = String(process.env.POSTGRES_PASSWORD || '');
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = Number(process.env.POSTGRES_PORT) || 5432;
  const database = process.env.POSTGRES_DB || 'digisewa';

  const sqlFilePath = path.resolve(process.cwd(), 'DigiSewa-main', 'backend', 'scripts', 'setup-db.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  const client = new Client({ user, password, host, port, database, ssl: false });

  try {
    console.log(`Connecting to database '${database}' to apply schema...`);
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Schema applied successfully. ✅');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Failed to apply schema:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

applySchema();
