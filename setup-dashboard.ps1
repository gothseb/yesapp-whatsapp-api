# Setup Dashboard with API Key
Write-Host ""
Write-Host "🔧 YesApp Dashboard Setup" -ForegroundColor Cyan
Write-Host "━" * 60
Write-Host ""

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is not running on port 3000" -ForegroundColor Red
    Write-Host "  Please start the backend first: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 To complete the setup, you need your API Key." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: If you have the API key from backend startup logs:" -ForegroundColor White
Write-Host "   → Enter it when prompted below" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: To generate a NEW API key:" -ForegroundColor White
Write-Host "   1. Stop this script (Ctrl+C)" -ForegroundColor Gray
Write-Host "   2. Stop the backend" -ForegroundColor Gray
Write-Host "   3. Delete: data/db.sqlite" -ForegroundColor Gray
Write-Host "   4. Restart backend - NEW key will be shown in logs" -ForegroundColor Gray
Write-Host "   5. Run this script again with the new key" -ForegroundColor Gray
Write-Host ""
Write-Host "━" * 60
Write-Host ""

# Prompt for API key
$apiKey = Read-Host "Enter your API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host ""
    Write-Host "✗ No API key provided. Exiting." -ForegroundColor Red
    exit 1
}

# Create .env file
$envContent = @"
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_KEY=$apiKey
"@

$envPath = Join-Path $PSScriptRoot "dashboard\.env"
Set-Content -Path $envPath -Value $envContent

Write-Host ""
Write-Host "✓ Dashboard configured successfully!" -ForegroundColor Green
Write-Host "  Config file: dashboard\.env" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   cd dashboard" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   Then open: http://localhost:5173" -ForegroundColor Green
Write-Host ""
