import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

async function verifyAdmin() {
  const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'digisewa',
    password: process.env.POSTGRES_PASSWORD || '3023',
    port: Number(process.env.POSTGRES_PORT) || 5432,
  });

  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE email = $1',
      ['admin@digisewa.gov.in']
    );
    if (rows.length > 0) {
      console.log('Admin found:', rows[0]);
    } else {
      console.log('Admin not found');
    }
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

verifyAdmin();


