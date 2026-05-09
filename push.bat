@echo off
echo =========================================
echo  🚀 Ready to push changes to GitHub
echo =========================================
set /p msg="📝 Enter commit message (or press Enter for default): "

if "%msg%"=="" set msg="Auto-commit updates"

echo 📦 Staging files...
git add .

echo 💾 Committing changes...
git commit -m "%msg%"

echo 📤 Pushing to repository...
git push origin main

echo.
echo ✅ Successfully pushed to GitHub!
pause