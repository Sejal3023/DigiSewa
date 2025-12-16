const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'Admin@2024';
  const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO';

  console.log('Testing password:', password);
  console.log('Against hash:', hash);

  const isValid = await bcrypt.compare(password, hash);
  console.log('Password valid:', isValid);
}

testPassword();
