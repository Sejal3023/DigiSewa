// debug-admin-login.js
import db from './src/db/pg_client.js';

async function debugAdminLogin() {
  try {
    console.log('🔍 DEBUGGING ADMIN LOGIN ISSUE\n');

    // Check if user exists
    console.log('1. Checking user in users table:');
    const userResult = await db.query(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1 AND role = 'super_admin'",
      ['admin@digigov.local']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in users table');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.email}, role: ${user.role}`);
    console.log(`   Hash length: ${user.password_hash.length}`);
    console.log(`   Hash starts with: ${user.password_hash.substring(0, 7)}\n`);

    // Check admin access codes
    console.log('2. Checking admin access codes:');
    const codesResult = await db.query('SELECT * FROM admin_access_codes WHERE is_active = true');
    console.log(`Found ${codesResult.rows.length} active codes:`);

    codesResult.rows.forEach(code => {
      console.log(`   - ${code.code} (expires: ${code.expires_at || 'never'})`);
    });

    // Test specific code
    const testCode = 'GOV-ADMIN-2025';
    console.log(`\n3. Testing code '${testCode}':`);
    const codeResult = await db.query(
      'SELECT * FROM admin_access_codes WHERE code = $1 AND is_active = true',
      [testCode]
    );

    if (codeResult.rows.length === 0) {
      console.log('❌ Code not found or inactive');
    } else {
      const code = codeResult.rows[0];
      console.log(`✅ Code found: ${code.code}`);
      console.log(`   Active: ${code.is_active}`);
      console.log(`   Expires: ${code.expires_at || 'never'}`);

      if (code.expires_at) {
        const now = new Date();
        const expires = new Date(code.expires_at);
        console.log(`   Expired: ${now > expires}`);
      }
    }

    // Test bcrypt comparison
    console.log('\n4. Testing password hash:');
    const bcrypt = (await import('bcrypt')).default;
    const testPassword = 'TempAdmin123!';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`Password '${testPassword}' valid: ${isValid}`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit();
  }
}

debugAdminLogin();
