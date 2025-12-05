# Quick fix script for backend dependencies issue
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Dependencies Quick Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Remove old node_modules" -ForegroundColor Yellow
Write-Host "  2. Remove package-lock.json" -ForegroundColor Yellow
Write-Host "  3. Install dependencies with correct version" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "[1/3] Removing old node_modules..." -ForegroundColor Green
Set-Location backend

if (Test-Path "node_modules") {
    Write-Host "Deleting node_modules folder..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force node_modules -ErrorAction Stop
        Write-Host "Done!" -ForegroundColor Green
    }
    catch {
        Write-Host "[WARNING] Could not delete node_modules" -ForegroundColor Red
        Write-Host "Please close all terminal windows and try again" -ForegroundColor Yellow
        Write-Host "Or manually delete: backend\node_modules" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}
else {
    Write-Host "node_modules not found, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/3] Removing package-lock.json..." -ForegroundColor Green
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "Done!" -ForegroundColor Green
}
else {
    Write-Host "package-lock.json not found, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[3/3] Installing dependencies..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Installation failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Fix completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Start the project" -ForegroundColor Cyan
Write-Host "  .\start-dev.ps1   (PowerShell)" -ForegroundColor White
Write-Host "  .\start-dev-cn.bat (CMD)" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"

