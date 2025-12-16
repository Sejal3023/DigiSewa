@echo off
echo Creating .env file for DigiSewa backend...

echo # PostgreSQL Configuration > .env
echo POSTGRES_USER=postgres >> .env
echo POSTGRES_PASSWORD=3023 >> .env
echo POSTGRES_HOST=localhost >> .env
echo POSTGRES_PORT=5432 >> .env
echo POSTGRES_DB=digisewa >> .env
echo. >> .env
echo # Choose database type >> .env
echo USE_DIRECT_POSTGRES=true >> .env
echo. >> .env
echo # Server Configuration >> .env
echo PORT=5001 >> .env
echo NODE_ENV=development >> .env
echo FRONTEND_URL=http://localhost:5173 >> .env
echo. >> .env
echo # JWT Configuration >> .env
echo JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure >> .env
echo JWT_EXPIRES_IN=24h >> .env
echo. >> .env
echo # Blockchain Configuration (optional for now) >> .env
echo PRIVATE_KEY=your_blockchain_private_key_here >> .env
echo BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545 >> .env
echo CONTRACT_ADDRESS=your_contract_address_here >> .env

echo .env file created successfully!
echo Please review and modify the values as needed.
pause

