import 'dotenv/config';
import pkg from 'pg';

const { Client } = pkg;

async function ensureDatabaseExists() {
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || '';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = Number(process.env.POSTGRES_PORT) || 5432;
  const dbName = process.env.POSTGRES_DB || 'digisewa';

  const adminClient = new Client({
    user,
    password,
    host,
    port,
    database: 'postgres',
  });

  try {
    console.log(`Connecting to postgres to check database '${dbName}'...`);
    await adminClient.connect();

    const { rowCount } = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (rowCount && rowCount > 0) {
      console.log(`Database '${dbName}' already exists. ✅`);
      return;
    }

    console.log(`Creating database '${dbName}'...`);
    await adminClient.query(`CREATE DATABASE ${JSON.stringify(dbName).replace(/^"|"$/g, '')}`);
    console.log(`Database '${dbName}' created successfully. ✅`);
  } catch (error) {
    console.error('Failed to ensure database exists:', error.message);
    process.exitCode = 1;
  } finally {
    await adminClient.end().catch(() => {});
  }
}

ensureDatabaseExists();


