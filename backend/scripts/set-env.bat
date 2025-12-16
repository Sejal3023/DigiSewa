@echo off
echo Setting up environment variables...
echo.
echo STEP 1: Get your service role key from:
echo https://supabase.com/dashboard/project/doxtmxezxgjcboawgmmr/settings/api
echo.
echo STEP 2: Copy the SERVICE_ROLE key (not anon key)
echo.
echo STEP 3: Run this command with your real key:
echo.
echo powershell -Command "(Get-Content .env) -replace 'SUPABASE_SERVICE_KEY=.*', 'SUPABASE_SERVICE_KEY=YOUR_ACTUAL_SERVICE_KEY_HERE' | Set-Content .env"
echo.
echo STEP 4: Test connection:
echo npm run check:db
echo.
echo STEP 5: Start server:
echo npm run dev
