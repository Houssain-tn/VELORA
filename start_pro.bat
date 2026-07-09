@echo off
title VELORA PRO - Serveur de Production
color 0b
echo ==========================================
echo           VELORA ENTERPRISE PRO
echo ==========================================
echo.
echo [1/4] Verification du Moteur MySQL (XAMPP)...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if not errorlevel 1 (
    echo [OK] Base de donnees MySQL operationnelle.
) else (
    echo [ATTENTION] MySQL n'est pas detecte. Assurez-vous que XAMPP est lance.
    pause
    exit
)

echo.
echo [2/4] Demarrage du Backend NestJS (Mode Production)...
start "VELORA Backend" cmd /k "title VELORA Backend && cd /d %~dp0apps\backend && npm run start:prod"

echo.
echo [3/4] Demarrage du Frontend React (Serveur LAN Securise)...
start "VELORA Frontend" cmd /k "title VELORA Frontend && cd /d %~dp0apps\frontend && npm run preview -- --port 5175 --host"

echo.
echo [4/4] Ouverture de l'interface de controle...
echo Patientez pendant la montee en charge des services (10 sec)...
timeout /t 10 /nobreak > nul

start https://localhost:5175

echo.
echo ==========================================
echo        SYSTEME OPERATIONNEL (PRO)
echo ==========================================
echo Application Locale : https://localhost:5175
echo Acces Reseau (LAN) : Demandez l'IP de ce PC (ex: https://192.168.x.x:5175)
echo Moteur API Backend : http://localhost:3333/api
echo ==========================================
echo.
echo Gardez cette fenetre ouverte pour maintenir les serveurs en ligne.
echo Appuyez sur une touche pour arreter l'infrastructure.
pause > nul
taskkill /F /T /FI "WINDOWTITLE eq VELORA Backend" > nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq VELORA Frontend" > nul 2>&1
echo Arret termine.
exit
