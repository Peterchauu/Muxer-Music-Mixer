# Setup script for RubberBand library on Windows in order to configure and run pyrubberband

$ErrorActionPreference = "Stop"

Write-Host "Setting up RubberBand library for pitch-preserving time-stretching..." -ForegroundColor Green

$serverDir = $PSScriptRoot
$rubberbandZip = Join-Path $serverDir "rubberband.zip"
$rubberbandDir = Join-Path $serverDir "rubberband"
$rubberbandUrl = "https://breakfastquay.com/files/releases/rubberband-3.3.0-gpl-executable-windows.zip"

# Download RubberBand if not already present
if (Test-Path (Join-Path $rubberbandDir "rubberband-3.3.0-gpl-executable-windows\rubberband.exe")) {
    Write-Host "RubberBand already installed, skipping download." -ForegroundColor Yellow
} else {
    Write-Host "Downloading RubberBand library..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $rubberbandUrl -OutFile $rubberbandZip
    
    Write-Host "Extracting RubberBand..." -ForegroundColor Cyan
    Expand-Archive -Path $rubberbandZip -DestinationPath $rubberbandDir -Force
    
    Write-Host "Cleaning up..." -ForegroundColor Cyan
    Remove-Item $rubberbandZip
}

# Install pyrubberband
Write-Host "Installing pyrubberband Python package..." -ForegroundColor Cyan
& python -m pip install pyrubberband==0.3.0

Write-Host "`nRubberBand setup complete!" -ForegroundColor Green
Write-Host "The server will automatically configure the PATH to use RubberBand." -ForegroundColor Green
