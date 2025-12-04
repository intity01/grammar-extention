# Production Build Script for Grammar Checker Extension
# This script builds the complete extension package

param(
    [switch]$SkipWasm = $false,
    [switch]$SkipOptimize = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Grammar Checker Extension - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/6] Cleaning previous build..." -ForegroundColor Green
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  ✓ Removed dist directory" -ForegroundColor Gray
}

# Step 2: Build WebAssembly modules
if (-not $SkipWasm) {
    Write-Host "[2/6] Building WebAssembly modules..." -ForegroundColor Green
    Push-Location wasm
    
    # Build with cargo
    Write-Host "  Building Rust code..." -ForegroundColor Gray
    cargo build --target wasm32-unknown-unknown --release
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Cargo build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Create pkg directory if it doesn't exist
    if (-not (Test-Path "pkg")) {
        New-Item -ItemType Directory -Path "pkg" | Out-Null
    }
    
    # Copy the wasm file
    $wasmFile = "target\wasm32-unknown-unknown\release\grammar_checker_wasm.wasm"
    Copy-Item $wasmFile "pkg\grammar_checker_wasm.wasm" -Force
    
    # Show wasm size
    $wasmSize = (Get-Item "pkg\grammar_checker_wasm.wasm").Length
    $wasmSizeMB = [math]::Round($wasmSize / 1MB, 2)
    Write-Host "  ✓ Wasm module built: $wasmSizeMB MB" -ForegroundColor Gray
    
    # Optimize with wasm-opt if available and not skipped
    if (-not $SkipOptimize) {
        if (Get-Command wasm-opt -ErrorAction SilentlyContinue) {
            Write-Host "  Optimizing with wasm-opt..." -ForegroundColor Gray
            wasm-opt -Oz "pkg\grammar_checker_wasm.wasm" -o "pkg\grammar_checker_wasm_opt.wasm"
            if ($LASTEXITCODE -eq 0) {
                Move-Item "pkg\grammar_checker_wasm_opt.wasm" "pkg\grammar_checker_wasm.wasm" -Force
                $optimizedSize = (Get-Item "pkg\grammar_checker_wasm.wasm").Length
                $optimizedSizeMB = [math]::Round($optimizedSize / 1MB, 2)
                $savings = [math]::Round(($wasmSize - $optimizedSize) / 1MB, 2)
                Write-Host "  ✓ Optimized: $optimizedSizeMB MB (saved $savings MB)" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ⚠ wasm-opt not found, skipping optimization" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
} else {
    Write-Host "[2/6] Skipping WebAssembly build (--SkipWasm)" -ForegroundColor Yellow
}

# Step 3: Build TypeScript with Vite
Write-Host "[3/6] Building TypeScript code..." -ForegroundColor Green
pnpm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ TypeScript build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ TypeScript compiled and bundled" -ForegroundColor Gray

# Step 4: Verify required files
Write-Host "[4/6] Verifying build output..." -ForegroundColor Green

$requiredFiles = @(
    "dist\manifest.json",
    "dist\background.js",
    "dist\content.js",
    "dist\offscreen.js",
    "dist\worker.js",
    "dist\offscreen.html",
    "dist\popup.html",
    "dist\wasm\grammar_checker_wasm.wasm"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "  ✗ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
    exit 1
}

Write-Host "  ✓ All required files present" -ForegroundColor Gray

# Step 5: Calculate bundle size
Write-Host "[5/6] Calculating bundle size..." -ForegroundColor Green

$totalSize = 0
Get-ChildItem -Path "dist" -Recurse -File | ForEach-Object {
    $totalSize += $_.Length
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "  Total extension size: $totalSizeMB MB" -ForegroundColor Cyan

if ($totalSizeMB -gt 20) {
    Write-Host "  ⚠ Warning: Extension size exceeds 20MB target!" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Size within 20MB target" -ForegroundColor Gray
}

# Show breakdown
Write-Host "  Size breakdown:" -ForegroundColor Gray
$categories = @{
    "JavaScript" = @("*.js")
    "WebAssembly" = @("*.wasm")
    "Dictionaries" = @("*.dat.br", "*.dat")
    "Rules" = @("rules\*.json")
    "HTML/CSS" = @("*.html", "*.css")
    "Other" = @("*")
}

foreach ($category in $categories.Keys) {
    $size = 0
    foreach ($pattern in $categories[$category]) {
        Get-ChildItem -Path "dist" -Recurse -Include $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
            $size += $_.Length
        }
    }
    if ($size -gt 0) {
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host "    $category : $sizeMB MB" -ForegroundColor Gray
    }
}

# Step 6: Create package info
Write-Host "[6/6] Creating package info..." -ForegroundColor Green

$packageInfo = @{
    name = "grammar-checker-extension"
    version = "1.0.0"
    buildDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    totalSize = "$totalSizeMB MB"
    files = (Get-ChildItem -Path "dist" -Recurse -File).Count
} | ConvertTo-Json

$packageInfo | Out-File "dist\build-info.json" -Encoding UTF8
Write-Host "  ✓ Build info saved to dist\build-info.json" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Load unpacked extension from 'dist' folder in Chrome/Edge" -ForegroundColor White
Write-Host "  2. Test on various websites" -ForegroundColor White
Write-Host "  3. Run test suite: pnpm test" -ForegroundColor White
Write-Host ""
