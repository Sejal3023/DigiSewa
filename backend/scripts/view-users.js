import 'dotenv/config';
import pkg from 'pg';

const { Client } = pkg;

async function viewUsers() {
  const user = 'postgres';
  const password = '3023';
  const host = 'localhost';
  const port = 5432;
  const database = 'digisewa';

  const client = new Client({ user, password, host, port, database, ssl: false });

  try {
    console.log(`Connecting to database '${database}' to view users...`);
    await client.connect();
    const result = await client.query('SELECT * FROM users');
    console.log('Registered Users:');
    console.table(result.rows);
  } catch (error) {
    console.error('Failed to view users:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

viewUsers();
