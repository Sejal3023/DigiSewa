# PostgreSQL Setup for DigiSewa

Your project is already configured to support both Supabase and direct PostgreSQL connections. Here's how to set up direct PostgreSQL:

### 1. Install PostgreSQL

**Windows (Recommended):**
- Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
- Or use Chocolatey: `choco install postgresql`

**Alternative for Windows:**
- Use [PostgreSQL for Windows](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

### 2. Create Database and User

After installing PostgreSQL, open Command Prompt or PowerShell as Administrator and run:

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE digisewa;

# Create user (optional but recommended)
CREATE USER digisewa_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE digisewa TO digisewa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO digisewa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO digisewa_user;

# Exit
\q
```

### 3. Set Environment Variables

Create a `.env` file in your `backend` directory:

```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=3023
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=digisewa

# Choose database type
USE_DIRECT_POSTGRES=true

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
```

## Step 1: Create the Database

First, connect to PostgreSQL as the superuser and create the database:

```bash
# Connect to PostgreSQL (without specifying a database)
psql -U postgres -h localhost -p 5432
```

When prompted for password, enter: `3023`

## Step 2: Create the Database

Once you're connected to PostgreSQL, run these commands:

```sql
-- Create the database
CREATE DATABASE digisewa;

-- Verify it was created
\l

-- Exit PostgreSQL
\q
```

## Step 3: Test Connection to the New Database

Now test the connection to the newly created database:

```bash
# Test connection to the digisewa database
psql -U postgres -h localhost -p 5432 -d digisewa
```

When prompted for password, enter: `3023`

## Step 4: Run the Database Setup Script

Once you can connect to the `digisewa` database, run the setup script:

```bash
cd DigiSewa-main/backend
psql -U postgres -d digisewa -f scripts/setup-postgres.sql
```

When prompted for password, enter: `3023`

## Step 5: Test the Connection Again

After the setup is complete, test the connection:

```bash
psql -U postgres -h localhost -p 5432 -d digisewa
```

## What Happened

The error occurred because:
1. ✅ PostgreSQL is running and accessible
2. ✅ Your password `3023` is correct
3. ❌ The database `digisewa` hadn't been created yet

The setup script expects the database to already exist, so we need to create it first. After following these steps, your application should be able to connect successfully.

Let me know if you encounter any other issues during this process!