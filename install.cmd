@echo off
REM Morpheus installer for Windows. Run from Command Prompt or double-click.
REM Runs install.ps1 with a one-time execution-policy bypass (no system setting is changed).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
pause
