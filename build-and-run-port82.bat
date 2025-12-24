@echo off
setlocal

rem Stop existing process on port 82
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :82 ^| findstr LISTENING') do taskkill /PID %%a /F

rem Build the Next.js app
npm run build || goto :error

rem Start the app on port 82
npx next start -p 82
goto :eof

:error
echo Build failed. Aborting start.
endlocal
exit /b 1
