import 'dotenv/config';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin credentials
const adminCredentials = [
  {
    email: 'admin@government.in',
    password: 'Admin@2024',
    fullName: 'System Administrator',
    role: 'super_admin',
    department: 'IT Department',
    permissions: { all: true, users: true, applications: true, licenses: true, system: true }
  },
  {
    email: 'officer@municipal.gov.in',
    password: 'Admin@2024',
    fullName: 'Municipal Officer',
    role: 'officer',
    department: 'Municipal Corporation',
    permissions: { applications: true, licenses: true, verify: true, issue: true }
  },
  {
    email: 'officer@rto.gov.in',
    password: 'Admin@2024',
    fullName: 'RTO Officer',
    role: 'officer',
    department: 'Regional Transport Office',
    permissions: { applications: true, licenses: true, verify: true, issue: true }
  },
  {
    email: 'officer@fssai.gov.in',
    password: 'Admin@2024',
    fullName: 'FSSAI Officer',
    role: 'officer',
    department: 'Food & Drug Administration',
    permissions: { applications: true, licenses: true, verify: true, issue: true }
  }
];

// Admin access codes
const adminAccessCodes = [
  {
    code: 'ADMIN2024',
    description: 'Default admin access code for system administration',
    permissions: { all: true, users: true, applications: true, licenses: true, system: true },
    expiresAt: '2025-12-31T23:59:59Z'
  },
  {
    code: 'MUNICIPAL2024',
    description: 'Municipal Corporation officer access code',
    permissions: { applications: true, licenses: true, verify: true, issue: true },
    expiresAt: '2025-12-31T23:59:59Z'
  },
  {
    code: 'RTO2024',
    description: 'RTO officer access code',
    permissions: { applications: true, licenses: true, verify: true, issue: true },
    expiresAt: '2025-12-31T23:59:59Z'
  },
  {
    code: 'FSSAI2024',
    description: 'FSSAI officer access code',
    permissions: { applications: true, licenses: true, verify: true, issue: true },
    expiresAt: '2025-12-31T23:59:59Z'
  }
];

async function setupAdminSystem() {
  console.log('🚀 Setting up DigiSewa Admin System...\n');

  try {
    // Create admin users table
    console.log('📋 Creating admin_users table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          department TEXT,
          permissions JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.log('ℹ️  admin_users table might already exist or using direct SQL...');
    }

    // Create admin access codes table
    console.log('📋 Creating admin_access_codes table...');
    const { error: codesTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_access_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code TEXT UNIQUE NOT NULL,
          description TEXT,
          permissions JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (codesTableError) {
      console.log('ℹ️  admin_access_codes table might already exist or using direct SQL...');
    }

    // Insert admin users
    console.log('👥 Creating admin users...');
    for (const admin of adminCredentials) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      
      const { error: insertError } = await supabase
        .from('admin_users')
        .upsert({
          email: admin.email,
          password_hash: hashedPassword,
          full_name: admin.fullName,
          role: admin.role,
          department: admin.department,
          permissions: admin.permissions
        }, { onConflict: 'email' });

      if (insertError) {
        console.log(`⚠️  Error creating admin user ${admin.email}:`, insertError.message);
      } else {
        console.log(`✅ Created admin user: ${admin.email} (${admin.role})`);
      }
    }

    // Insert admin access codes
    console.log('🔑 Creating admin access codes...');
    for (const accessCode of adminAccessCodes) {
      const { error: insertError } = await supabase
        .from('admin_access_codes')
        .upsert({
          code: accessCode.code,
          description: accessCode.description,
          permissions: accessCode.permissions,
          expires_at: accessCode.expiresAt
        }, { onConflict: 'code' });

      if (insertError) {
        console.log(`⚠️  Error creating access code ${accessCode.code}:`, insertError.message);
      } else {
        console.log(`✅ Created access code: ${accessCode.code}`);
      }
    }

    console.log('\n🎉 Admin system setup completed!');
    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    adminCredentials.forEach(admin => {
      console.log(`👤 ${admin.fullName}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Password: ${admin.password}`);
      console.log(`   🏢 Role: ${admin.role}`);
      console.log(`   🏛️  Department: ${admin.department}`);
      console.log('');
    });

    console.log('🔑 Admin Access Codes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    adminAccessCodes.forEach(code => {
      console.log(`🔐 ${code.code} - ${code.description}`);
    });

    console.log('\n💡 You can now use these credentials to login to the admin portal!');
    console.log('🌐 Go to: http://localhost:8080/login and select "Admin Portal" tab');

  } catch (error) {
    console.error('❌ Error setting up admin system:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupAdminSystem();
