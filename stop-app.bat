@echo off
REM =====================================================
REM Stop-app.bat para detener y borrar contenedores
REM =====================================================

docker-compose down

echo.
echo Contenedores detenidos.
pause
