@echo off
echo Auto Git Push is running...
echo Press Ctrl+C to stop

:loop
git status --porcelain
if %errorlevel% equ 0 (
    git status --porcelain | findstr /r "."
    if %errorlevel% equ 0 (
        echo Changes detected, committing and pushing...
        git add .
        git commit -m "Auto commit: %date% %time%"
        git push origin main
        echo Pushed successfully!
    )
)
timeout /t 10 /nobreak > nul
goto loop
