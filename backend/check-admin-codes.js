// check-admin-codes.js
import db from './src/db/pg_client.js';

async function checkAdminCodes() {
  try {
    console.log('🔍 Checking admin access codes...');

    const result = await db.query('SELECT * FROM admin_access_codes WHERE is_active = true');
    console.log('📋 Found admin access codes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.rows.length === 0) {
      console.log('❌ No active admin access codes found!');
      console.log('💡 You may need to run the admin setup script.');
    } else {
      result.rows.forEach(code => {
        console.log(`🔐 Code: ${code.code}`);
        console.log(`   📝 Description: ${code.description}`);
        console.log(`   ✅ Active: ${code.is_active}`);
        console.log(`   ⏰ Expires: ${code.expires_at || 'Never'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking admin codes:', error);
  } finally {
    process.exit();
  }
}

checkAdminCodes();
