@echo off
echo ========================================
echo DigiSewa Backend Setup Script
echo ========================================
echo.

echo Step 1: Creating .env file...
call create-env.bat
echo.

echo Step 2: Installing dependencies...
npm install
echo.

echo Step 3: Testing database connection...
echo Please make sure PostgreSQL is running and the 'digisewa' database exists.
echo If not, run the database setup first.
echo.
node scripts/test-connection.js
echo.

echo Step 4: Setting up database schema...
echo This will create the required tables in your PostgreSQL database.
echo.
node scripts/setup-db.js
echo.

echo Step 5: Starting the backend server...
echo The server will start on port 5001
echo.
echo Press any key to start the server...
pause
npm start

