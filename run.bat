@echo off
REM MAISON — chạy nhanh trên Windows (bấm đúp hoặc: run.bat [up^|down^|reset^|logs])
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
if "%~1"=="" pause
