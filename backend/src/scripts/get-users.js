import { postgresPool } from '../postgresClient.js';

const getUsers = async () => {
  try {
    const client = await postgresPool.connect();
    console.log('Successfully connected to the database!');
    const result = await client.query('SELECT id FROM users');
    const userIds = result.rows.map(row => row.id);
    console.log('User IDs:', userIds);
    client.release();
  } catch (error) {
    console.error('Failed to connect to the database or query users:', error);
  } finally {
    await postgresPool.end();
  }
};

getUsers();
