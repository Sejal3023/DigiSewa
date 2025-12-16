import 'dotenv/config';

console.log('Environment Variables Check:');
console.log('============================');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***SET***' : 'NOT SET');
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
console.log('USE_DIRECT_POSTGRES:', process.env.USE_DIRECT_POSTGRES);
console.log('============================');

// Check if .env file exists
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
console.log('.env file exists:', existsSync(envPath));

if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    console.log('.env file content:');
    console.log(envContent);
  } catch (err) {
    console.log('Error reading .env file:', err.message);
  }
} else {
  console.log('No .env file found. Creating one...');
  
  const envContent = `# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=3023
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=digisewa

# Choose database type
USE_DIRECT_POSTGRES=true

# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h`;
  
  try {
    import('fs').then(fs => {
      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file created successfully!');
    });
  } catch (err) {
    console.log('Error creating .env file:', err.message);
  }
}
