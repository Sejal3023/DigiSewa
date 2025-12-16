import { Sequelize } from 'sequelize';
import databaseConfig from '../../config/database.js';

const sequelize = new Sequelize(
  databaseConfig.postgres.database,
  databaseConfig.postgres.user,
  databaseConfig.postgres.password,
  {
    host: databaseConfig.postgres.host,
    port: databaseConfig.postgres.port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: databaseConfig.postgres.ssl,
    },
    logging: false, // Disable logging
  }
);

export default sequelize;
