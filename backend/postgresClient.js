import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: dotenv.config is called in index.js before importing this file

// Simple, direct approach - the test proved the password works
const postgresConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'digisewa',
  password: process.env.POSTGRES_PASSWORD || '3023',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pooling - use simpler settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

console.log('🔐 PostgreSQL connection configured');
console.log('User:', postgresConfig.user);
console.log('Host:', postgresConfig.host);
console.log('Database:', postgresConfig.database);
console.log('Port:', postgresConfig.port);
console.log('Password type:', typeof postgresConfig.password);
console.log('Password length:', postgresConfig.password ? postgresConfig.password.length : 'undefined');

// Create connection pool
export const postgresPool = new Pool(postgresConfig);

// Enhanced test connection function
export async function testConnection() {
  let client;
  try {
    client = await postgresPool.connect();
    console.log('✅ Database connection established successfully.');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    // Specific error handling
    if (error.code === '28P01') {
      console.error('Authentication failed - please check username/password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is PostgreSQL running on port 5432?');
    }
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Test connection on startup with retry logic
let retryCount = 0;
const maxRetries = 3;

async function initializeDatabase() {
  const connected = await testConnection();
  if (!connected && retryCount < maxRetries) {
    retryCount++;
    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
    setTimeout(initializeDatabase, 2000);
  }
}

initializeDatabase();

// Event handlers
postgresPool.on('connect', (client) => {
  console.log('New PostgreSQL client connected');
});

postgresPool.on('error', (err, client) => {
  console.error('Unexpected database error:', err.message);
});

// Helper function to run queries
export const query = (text, params) => postgresPool.query(text, params);

// Helper function to get a client from the pool
export const getClient = () => postgresPool.connect();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...');
  await postgresPool.end();
  process.exit(0);
});

export default postgresPool;
