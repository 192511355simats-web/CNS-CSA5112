@echo off
title Custom Assembly Studio
cd /d "%~dp0"
if exist "CustomAssemblyStudio.exe" (
    echo Launching Custom Assembly Studio...
    start "" "%~dp0CustomAssemblyStudio.exe"
    exit
) else (
    echo Starting Custom Assembly Studio HTTP Server on port 8080...
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
    pause
)
