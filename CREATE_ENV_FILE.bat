@echo off
REM Script pour créer facilement le fichier .env du dashboard
REM Usage: CREATE_ENV_FILE.bat [votre-api-key]

echo.
echo ================================================
echo Creation du fichier .env pour le Dashboard
echo ================================================
echo.

if "%1"=="" (
    echo ERREUR: Veuillez fournir votre API Key en parametre
    echo.
    echo Usage: CREATE_ENV_FILE.bat [votre-api-key]
    echo.
    echo Exemple:
    echo   CREATE_ENV_FILE.bat abc123def456...xyz789
    echo.
    pause
    exit /b 1
)

set API_KEY=%1

echo VITE_API_KEY=%API_KEY%> dashboard\.env

if exist "dashboard\.env" (
    echo.
    echo [OK] Fichier .env cree avec succes!
    echo.
    echo Localisation: dashboard\.env
    echo.
    echo Prochaines etapes:
    echo   1. cd dashboard
    echo   2. npm run dev
    echo   3. Ouvrir http://localhost:5173
    echo.
) else (
    echo.
    echo [ERREUR] Impossible de creer le fichier .env
    echo.
)

pause
