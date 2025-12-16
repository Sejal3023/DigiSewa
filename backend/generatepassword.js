import bcrypt from 'bcrypt';

// Function to generate hash
async function generatePasswordHash(password, label) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(`\n${label}:`);
        console.log(`  Email/Password: ${password}`);
        console.log(`  Hash: ${hash}`);
        return hash;
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

// Generate hashes for all 6 officers
async function generateAllHashes() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  DIGISEWA - DEPARTMENT OFFICER PASSWORD HASHES');
    console.log('═══════════════════════════════════════════════════════');
    
    const hashes = {};
    
    hashes.food = await generatePasswordHash('FoodOfficer@123', '1. Food Safety Officer');
    hashes.labour = await generatePasswordHash('LabourOfficer@123', '2. Labour Officer');
    hashes.rto = await generatePasswordHash('RTOOfficer@123', '3. RTO Officer');
    hashes.police = await generatePasswordHash('PoliceOfficer@123', '4. Police Officer');
    hashes.revenue = await generatePasswordHash('RevenueOfficer@123', '5. Revenue Officer');
    hashes.municipal = await generatePasswordHash('MunicipalOfficer@123', '6. Municipal Officer');
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  SQL INSERT SCRIPT (Copy-paste ready!)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`-- Create 6 Department Officers
INSERT INTO users (email, full_name, phone, password_hash, role, department, employee_id, designation, is_active)
VALUES 
-- 1. Food Safety Officer
('food.officer@digisewa.gov.in', 'Dr. Rajesh Kumar', '+91-9876543210', 
 '${hashes.food}', 
 'officer', 'Food Safety Department', 'EMP001', 'Food Safety Inspector', true),

-- 2. Labour Officer  
('labour.officer@digisewa.gov.in', 'Priya Sharma', '+91-9876543211', 
 '${hashes.labour}',
 'officer', 'Labour Department', 'EMP002', 'Labour Inspector', true),

-- 3. RTO Officer
('rto.officer@digisewa.gov.in', 'Amit Patel', '+91-9876543212', 
 '${hashes.rto}',
 'officer', 'Regional Transport Office', 'EMP003', 'RTO Inspector', true),

-- 4. Police Officer
('police.officer@digisewa.gov.in', 'Inspector Vikram Singh', '+91-9876543213', 
 '${hashes.police}',
 'officer', 'Police Department', 'EMP004', 'Police Inspector', true),

-- 5. Revenue Officer
('revenue.officer@digisewa.gov.in', 'Sunita Reddy', '+91-9876543214', 
 '${hashes.revenue}',
 'officer', 'Revenue Department', 'EMP005', 'Revenue Inspector', true),

-- 6. Municipal Officer
('municipal.officer@digisewa.gov.in', 'Ankit Verma', '+91-9876543215', 
 '${hashes.municipal}',
 'officer', 'Municipal Corporation', 'EMP006', 'Municipal Inspector', true);
`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS FOR TESTING');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('1. Food Safety: food.officer@digisewa.gov.in / FoodOfficer@123');
    console.log('2. Labour: labour.officer@digisewa.gov.in / LabourOfficer@123');
    console.log('3. RTO: rto.officer@digisewa.gov.in / RTOOfficer@123');
    console.log('4. Police: police.officer@digisewa.gov.in / PoliceOfficer@123');
    console.log('5. Revenue: revenue.officer@digisewa.gov.in / RevenueOfficer@123');
    console.log('6. Municipal: municipal.officer@digisewa.gov.in / MunicipalOfficer@123');
}

generateAllHashes();
