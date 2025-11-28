@echo off
cd /d "%~dp0"
:loop
npm run dev
echo Servidor se cerro, reiniciando...
timeout /t 2
goto loop
