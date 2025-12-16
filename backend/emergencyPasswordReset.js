// emergencyPasswordReset.js
import bcrypt from 'bcrypt';
import db from './src/db/pg_client.js';

async function emergencyReset() {
  try {
    console.log('🚨 EMERGENCY PASSWORD RESET FOR SUPER ADMIN');

    const newPassword = "TempAdmin123!"; // Temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    console.log('📋 Reset Details:');
    console.log('   New Password:', newPassword);
    console.log('   Hash Length:', hashedPassword.length);
    console.log('   Hash Prefix:', hashedPassword.substring(0, 7));
    console.log('   Is Valid Bcrypt:', hashedPassword.startsWith('$2b$'));

    // Update super admin
    const result = await db.query(
      `UPDATE users SET password_hash = $1
       WHERE role = 'super_admin' AND email = 'admin@digigov.local'
       RETURNING email, role`,
      [hashedPassword]
    );

    if (result.rows.length > 0) {
      console.log('✅ SUCCESS: Password reset for:', result.rows[0].email);
      console.log('🔑 TEMPORARY LOGIN CREDENTIALS:');
      console.log('   Email: admin@digigov.local');
      console.log('   Password: TempAdmin123!');
      console.log('   ⚠️  Change this password immediately after login!');
    } else {
      console.log('❌ No super admin user found');
    }

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error);
  } finally {
    process.exit();
  }
}

emergencyReset();
