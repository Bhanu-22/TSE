@echo off
REM This script updates the local repository from the upstream repository.

REM Navigate to the repository directory
cd "C:\Users\AparnaaMarimuthu\Documents\tse-demo-builder-v2-main\tse-demo-builder-v2-main"

REM Check if the upstream remote exists, if not, add it.
git remote get-url upstream >nul 2>nul
if %errorlevel% neq 0 (
    echo "Upstream remote not found. Adding it now."
    git remote add upstream https://github.com/thoughtspot/tse-demo-builder-v2.git
)

REM Fetch the latest changes from all remotes
echo "Fetching latest changes from all remotes..."
git fetch --all

REM Check if the local main branch is behind the upstream/main branch
git rev-list HEAD...upstream/main --count > count.txt
set /p COUNT=<count.txt
del count.txt

if %COUNT% gtr 0 (
    echo "Your local branch is behind the upstream repository by %COUNT% commit(s)."
    echo "Pulling changes from upstream..."
    git pull upstream main
    echo "Update complete."
) else (
    echo "Your local branch is up to date with the upstream repository."
)

pause
