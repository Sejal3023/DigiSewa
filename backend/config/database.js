// backend/config/database.js
import "dotenv/config";

// Database configuration - using default export
const databaseConfig = {
  // PostgreSQL direct connection
  postgres: {
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'digisewa',
    password: process.env.POSTGRES_PASSWORD || '',
    port: process.env.POSTGRES_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Connection pooling
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
  },
  
  // Choose database type - PostgreSQL only
  useDirectPostgres: true,
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  }
};

// Database connection status
export const getDatabaseStatus = () => {
  return {
    type: 'PostgreSQL Direct',
    host: databaseConfig.postgres.host,
    port: databaseConfig.postgres.port,
    database: databaseConfig.postgres.database,
    user: databaseConfig.postgres.user,
  };
};

// Default export for the config
export default databaseConfig;