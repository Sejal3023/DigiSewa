import { postgresPool } from '../postgresClient.js';

const testConnection = async () => {
  try {
    const client = await postgresPool.connect();
    console.log('Successfully connected to the database!');
    client.release();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  } finally {
    await postgresPool.end();
  }
};

testConnection();
