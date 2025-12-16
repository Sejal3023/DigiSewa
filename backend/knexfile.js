import 'dotenv/config';
import databaseConfig from './config/database.js';

const config = {
  development: {
    client: 'pg',
    connection: {
      host: databaseConfig.postgres.host,
      port: databaseConfig.postgres.port,
      user: databaseConfig.postgres.user,
      password: databaseConfig.postgres.password,
      database: databaseConfig.postgres.database,
      ssl: databaseConfig.postgres.ssl,
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations'
    },
     seeds: {
      directory: './src/db/seeds'
    }
  }
};

export default config;
