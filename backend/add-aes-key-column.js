import db from './src/db/pg_client.js';

async function addAesKeyColumn() {
  try {
    console.log('Adding aes_key column to licenses table...');

    // Check if column already exists
    const checkResult = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'licenses' AND column_name = 'aes_key'
    `);

    if (checkResult.rows.length > 0) {
      console.log('aes_key column already exists');
      return;
    }

    // Add the column
    await db.query(`
      ALTER TABLE licenses ADD COLUMN aes_key VARCHAR(255)
    `);

    console.log('✅ aes_key column added successfully');
  } catch (error) {
    console.error('❌ Error adding aes_key column:', error);
  } finally {
    process.exit(0);
  }
}

addAesKeyColumn();
