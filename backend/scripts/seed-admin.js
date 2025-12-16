import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'digisewa',
  password: process.env.POSTGRES_PASSWORD || '',
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

async function seedAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const email = 'admin@digisewa.gov.in';
    const fullName = 'System Administrator';
    const passwordHash = '$2a$10$C1cSrGqdYQ6S1Pq8g4yGQeHE3v8Tzh5bmb93aJz6U4kQm9WZ/1kqK'; // bcrypt('admin123')
    const role = 'admin';

    const upsertSql = `
      INSERT INTO users (email, full_name, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
      RETURNING id, email, role, created_at;
    `;

    const { rows } = await client.query(upsertSql, [email, fullName, passwordHash, role]);
    await client.query('COMMIT');
    console.log('Admin seeded/updated:', rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed seeding admin:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

seedAdmin();


