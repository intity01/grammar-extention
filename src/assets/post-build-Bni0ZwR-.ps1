# Post-build cleanup script
# Removes unnecessary build artifacts from dist folder

Write-Host "Cleaning up build artifacts..." -ForegroundColor Green

$distPath = "dist"

if (-not (Test-Path $distPath)) {
    Write-Host "Error: dist folder not found" -ForegroundColor Red
    exit 1
}

# Remove unnecessary file types from assets folder
$assetsPath = Join-Path $distPath "assets"

if (Test-Path $assetsPath) {
    $patterns = @(
        "*.o",
        "*.d",
        "*.rmeta",
        "*.rlib",
        "*.pdb",
        "*.exe",
        "*.dll",
        "*.lib",
        "*.bin",
        "*.yaml",
        "*.lock",
        "*.test.*",
        "*.spec.*"
    )

    $removedCount = 0
    $removedSize = 0

    foreach ($pattern in $patterns) {
        $files = Get-ChildItem -Path $assetsPath -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $removedSize += $file.Length
            Remove-Item $file.FullName -Force
            $removedCount++
        }
    }

    if ($removedCount -gt 0) {
        $removedSizeMB = [math]::Round($removedSize / 1MB, 2)
        Write-Host "  Removed $removedCount files ($removedSizeMB MB)" -ForegroundColor Gray
    }
}

# Calculate final size
$totalSize = (Get-ChildItem -Path $distPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "Final extension size: $totalSizeMB MB" -ForegroundColor Cyan

if ($totalSizeMB -gt 20) {
    Write-Host "WARNING: Extension size exceeds 20MB target!" -ForegroundColor Yellow
} else {
    Write-Host "Size is within 20MB target" -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Green
