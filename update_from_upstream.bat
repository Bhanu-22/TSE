@echo off
REM Navigate to the repository directory
cd "C:\Users\BhanuPraksh\Documents\TSE"
 
REM Ensure upstream remote exists
git remote get-url upstream >nul 2>nul
if %errorlevel% neq 0 (
    echo "Adding upstream remote..."
    git remote add upstream https://github.com/thoughtspot/tse-demo-builder-v2.git
)
 
REM Fetch latest changes from upstream only
git fetch upstream
 
REM Merge upstream into local main safely
git merge upstream/main --no-edit
 
REM Optional: push to your origin if you want to update your fork
REM git push origin main
 
echo "Update complete."