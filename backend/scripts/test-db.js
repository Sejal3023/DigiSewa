import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Test with different password approaches
const testPasswords = [
  process.env.POSTGRES_PASSWORD || '',
  String(process.env.POSTGRES_PASSWORD || ''),
  (process.env.POSTGRES_PASSWORD || '').trim(),
  Buffer.from(process.env.POSTGRES_PASSWORD || '').toString('utf8')
];

console.log('🧪 Testing different password approaches:');

for (let i = 0; i < testPasswords.length; i++) {
  const testPassword = testPasswords[i];
  
  console.log(`\nTest ${i + 1}:`);
  console.log('Password type:', typeof testPassword);
  console.log('Password length:', testPassword.length);
  console.log('Password hex:', Buffer.from(testPassword).toString('hex'));
  
  const client = new Client({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'digisewa',
    password: testPassword,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();
    console.log('✅ SUCCESS with this approach!');
    await client.end();
    break;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}