import { query, testConnection } from '../postgresClient.js';

const setupDatabase = async () => {
  console.log('Setting up database...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }

  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Insert test user if not exists
    const testUser = await query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
    if (testUser.rows.length === 0) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash('password123', 10);
      
      await query(
        'INSERT INTO users (email, full_name, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['test@example.com', 'Test User', '1234567890', hashedPassword, 'citizen']
      );
      console.log('✅ Test user created: test@example.com / password123');
    } else {
      console.log('✅ Test user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();