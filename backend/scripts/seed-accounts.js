import 'dotenv/config';
import bcrypt from 'bcrypt';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'digisewa',
  password: process.env.POSTGRES_PASSWORD || '',
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

async function ensureAdminTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_access_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT UNIQUE NOT NULL,
      role TEXT,
      department TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function upsertUser(email, fullName, passwordPlain, role, department) {
  const passwordHash = await bcrypt.hash(passwordPlain, 12);
  const result = await pool.query(
    `INSERT INTO users (email, full_name, password_hash, role, department)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       department = EXCLUDED.department,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, email, role, department, created_at;`,
    [email, fullName, passwordHash, role, department]
  );
  return result.rows[0];
}

async function upsertAccessCode(code, role, department) {
  const result = await pool.query(
    `INSERT INTO admin_access_codes (code, role, department, is_active)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (code) DO UPDATE SET
       role = EXCLUDED.role,
       department = EXCLUDED.department,
       is_active = TRUE
     RETURNING id, code, role, department, is_active;`,
    [code, role, department]
  );
  return result.rows[0];
}

async function main() {
  await ensureAdminTables();

  // Seed Super Administrator
  const superAdmin = await upsertUser(
    'admin@government.in',
    'Super Administrator',
    'Admin@2024',
    'admin',
    'Administration'
  );
  const superCode = await upsertAccessCode('ADMIN2024', 'admin', null);

  // Seed Department Officers
  const municipal = await upsertUser(
    'officer@municipal.gov.in',
    'Municipal Officer',
    'Admin@2024',
    'officer',
    'Municipal'
  );
  const municipalCode = await upsertAccessCode('MUNICIPAL2024', 'officer', 'Municipal');

  const rto = await upsertUser(
    'officer@rto.gov.in',
    'RTO Officer',
    'Admin@2024',
    'officer',
    'RTO'
  );
  const rtoCode = await upsertAccessCode('RTO2024', 'officer', 'RTO');

  const fssai = await upsertUser(
    'officer@fssai.gov.in',
    'FSSAI Officer',
    'Admin@2024',
    'officer',
    'FSSAI'
  );
  const fssaiCode = await upsertAccessCode('FSSAI2024', 'officer', 'FSSAI');

  console.log('Seeded accounts:', {
    superAdmin,
    superCode,
    municipal,
    municipalCode,
    rto,
    rtoCode,
    fssai,
    fssaiCode,
  });
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });


