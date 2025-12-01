# Build script for WebAssembly NLP Kernel (PowerShell)

Write-Host "Building WebAssembly NLP Kernel..." -ForegroundColor Green

# Build with cargo
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Create pkg directory if it doesn't exist
if (-not (Test-Path "pkg")) {
    New-Item -ItemType Directory -Path "pkg" | Out-Null
}

# Copy the wasm file to pkg directory
$wasmFile = "target\wasm32-unknown-unknown\release\grammar_checker_wasm.wasm"
Copy-Item $wasmFile "pkg\" -Force

Write-Host "Build complete! Output: pkg\grammar_checker_wasm.wasm" -ForegroundColor Green

# Show file size
$size = (Get-Item "pkg\grammar_checker_wasm.wasm").Length
$sizeKB = [math]::Round($size / 1KB, 2)
$sizeMB = [math]::Round($size / 1MB, 2)

if ($sizeMB -gt 1) {
    Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
} else {
    Write-Host "Size: $sizeKB KB" -ForegroundColor Cyan
}
