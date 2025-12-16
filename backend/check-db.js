import db from './postgresClient.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check applications
    const apps = await db.query(`
      SELECT a.id, a.license_type, a.status, a.responsible_dept, d.name as dept_name
      FROM applications a
      LEFT JOIN departments d ON a.responsible_dept = d.id
      LIMIT 10
    `);
    console.log('📋 Applications:');
    apps.rows.forEach(app => {
      console.log(`  - ID: ${app.id}, Type: ${app.license_type}, Status: ${app.status}, Dept: ${app.dept_name || 'NULL'}`);
    });

    // Check departments
    const depts = await db.query('SELECT * FROM departments');
    console.log('\n🏢 Departments:');
    depts.rows.forEach(dept => {
      console.log(`  - ID: ${dept.id}, Name: ${dept.name}`);
    });

    // Check officers
    const officers = await db.query(`
      SELECT u.email, u.department, u.role, u.password_hash
      FROM users u
      WHERE u.role = 'officer'
    `);
    console.log('\n👮 Officers:');
    officers.rows.forEach(officer => {
      console.log(`  - Email: ${officer.email}, Dept: ${officer.department}, Role: ${officer.role}, Has Password: ${!!officer.password_hash}`);
    });

    // Check police officer specifically
    const policeOfficer = await db.query(`
      SELECT u.email, u.department, u.role, u.password_hash, u.employee_id, u.access_code
      FROM users u
      WHERE u.email = 'police.officer@digisewa.gov.in'
    `);
    console.log('\n🚔 Police Officer Details:');
    if (policeOfficer.rows.length > 0) {
      const officer = policeOfficer.rows[0];
      console.log(`  - Email: ${officer.email}`);
      console.log(`  - Department: ${officer.department}`);
      console.log(`  - Role: ${officer.role}`);
      console.log(`  - Employee ID: ${officer.employee_id}`);
      console.log(`  - Access Code: ${officer.access_code}`);
      console.log(`  - Has Password: ${!!officer.password_hash}`);
    } else {
      console.log('  - No police officer found!');
    }

    // Check license_department_mapping
    const mappings = await db.query('SELECT * FROM license_department_mapping');
    console.log('\n🔗 License-Department Mappings:');
    mappings.rows.forEach(mapping => {
      console.log(`  - ${mapping.license_type} → ${mapping.department_name}`);
    });

  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    process.exit();
  }
}

checkDatabase();
