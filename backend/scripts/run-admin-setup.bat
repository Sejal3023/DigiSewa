@echo off
echo.
echo ========================================
echo   DigiSewa Admin System Setup
echo ========================================
echo.
echo This script will set up the admin system with:
echo - Admin users and roles
echo - Access codes
echo - Database tables
echo.
echo Make sure your backend is running and .env is configured!
echo.
pause

echo.
echo Installing dependencies...
npm install

echo.
echo Running admin setup...
node scripts/setup-admin.js

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now login with these credentials:
echo.
echo Super Admin:
echo   Email: admin@government.in
echo   Password: Admin@2024
echo   Access Code: ADMIN2024
echo.
echo Municipal Officer:
echo   Email: officer@municipal.gov.in
echo   Password: Admin@2024
echo   Access Code: MUNICIPAL2024
echo.
echo RTO Officer:
echo   Email: officer@rto.gov.in
echo   Password: Admin@2024
echo   Access Code: RTO2024
echo.
echo FSSAI Officer:
echo   Email: officer@fssai.gov.in
echo   Password: Admin@2024
echo   Access Code: FSSAI2024
echo.
echo ========================================
echo.
pause
