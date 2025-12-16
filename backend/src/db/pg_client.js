import pg from 'pg';

/**
 * PostgreSQL Raw Client Setup
 * This file sets up a direct connection pool using the 'pg' library.
 */
const { Pool } = pg;

// Define variables with robust environment variable checking and explicit defaults.
// This prevents the 'pg' library from silently falling back to the OS username ('ASUS')
// if the POSTGRES_USER environment variable isn't loaded yet.
const dbUser = process.env.POSTGRES_USER || process.env.PGUSER || 'postgres';
const dbHost = process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost';
const dbName = process.env.POSTGRES_DB || process.env.PGDATABASE || 'digisewa';
// Use parseInt to ensure the port is treated as a number
const dbPort = parseInt(process.env.POSTRES_PORT || process.env.PGPORT || 5432, 10);
const dbPassword = String(process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || '3023'); 

// --- EXPLICIT CONFIGURATION ---
const config = {
  user: dbUser,
  host: dbHost,
  database: dbName,
  port: dbPort,
  // CRITICAL: Ensure password is cast to string
  password: dbPassword, 
};

// --- DEBUGGING LOG (To confirm configuration used by 'pg') ---
console.log('--- PG Client Config Used ---');
console.log(`User: ${config.user}`);
console.log(`Host: ${config.host}`);
console.log(`Database: ${config.database}`);
console.log(`Port: ${config.port}`);
console.log(`Password is ${config.password.length > 0 ? 'set' : 'NOT set'} (${config.password.length} chars)`);
console.log('-----------------------------');
// -----------------------

// Initialize the Pool with the configuration
const pool = new Pool(config); 

// --- Connection Test and Error Handling ---

pool.on('connect', () => {
  console.log('✅ PostgreSQL Raw Client connected successfully.');
});

pool.on('error', (err) => {
  // Log a specific message for the common 28P01 (invalid password) failure
  if (err.code === '28P01') {
    console.error(`❌ FATAL AUTH ERROR (28P01): Password authentication failed for user "${config.user}". 
                   Please ensure your POSTGRES_PASSWORD is correct for this user.`);
  } else {
    console.error('❌ Unexpected error on PostgreSQL client pool:', err.message);
  }
});

/**
 * Export a wrapper object that exposes the standard .query() method.
 */
export default {
  /**
   * Executes a database query.
   * @param {string} text - The SQL query text.
   * @param {Array<any>} [params] - Optional parameters for the query.
   * @returns {Promise<pg.QueryResult>} - The result of the query.
   */
  query: (text, params) => {
    return pool.query(text, params);
  },
};
