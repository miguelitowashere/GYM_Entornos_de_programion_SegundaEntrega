@echo off
REM =====================================================
REM Start-app.bat para levantar el proyecto con Docker
REM =====================================================

REM Copiar archivos .env si no existen
IF NOT EXIST Backend\.env COPY Backend\.env.example Backend\.env
IF NOT EXIST Frontend\.env COPY Frontend\.env.example Frontend\.env

REM Construir y levantar los contenedores
docker-compose up --build -d

REM Esperar 5 segundos para que los contenedores inicien
timeout /t 5 /nobreak >nul

REM Abrir el frontend en el navegador
start http://localhost:5173

echo.
echo Contenedores levantados. Backend: http://localhost:8000, Frontend: http://localhost:5173
pause
