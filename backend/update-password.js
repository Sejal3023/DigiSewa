const bcrypt = require('bcrypt');
const db = require('./src/db/pg_client');

async function updatePassword() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);

    console.log('New password:', password);
    console.log('New hash:', hash);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, 'admin@digigov.local']
    );

    console.log('Password updated successfully!');
    console.log('Use password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

updatePassword();
