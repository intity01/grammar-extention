#!/bin/bash
# Production Build Script for Grammar Checker Extension
# This script builds the complete extension package

set -e

SKIP_WASM=false
SKIP_OPTIMIZE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-wasm)
            SKIP_WASM=true
            shift
            ;;
        --skip-optimize)
            SKIP_OPTIMIZE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "========================================"
echo "Grammar Checker Extension - Build Script"
echo "========================================"
echo ""

# Step 1: Clean previous build
echo "[1/6] Cleaning previous build..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "  ✓ Removed dist directory"
fi

# Step 2: Build WebAssembly modules
if [ "$SKIP_WASM" = false ]; then
    echo "[2/6] Building WebAssembly modules..."
    cd wasm
    
    # Build with cargo
    echo "  Building Rust code..."
    cargo build --target wasm32-unknown-unknown --release
    
    # Create pkg directory if it doesn't exist
    mkdir -p pkg
    
    # Copy the wasm file
    cp target/wasm32-unknown-unknown/release/grammar_checker_wasm.wasm pkg/grammar_checker_wasm.wasm
    
    # Show wasm size
    WASM_SIZE=$(stat -f%z "pkg/grammar_checker_wasm.wasm" 2>/dev/null || stat -c%s "pkg/grammar_checker_wasm.wasm")
    WASM_SIZE_MB=$(echo "scale=2; $WASM_SIZE / 1048576" | bc)
    echo "  ✓ Wasm module built: ${WASM_SIZE_MB} MB"
    
    # Optimize with wasm-opt if available and not skipped
    if [ "$SKIP_OPTIMIZE" = false ]; then
        if command -v wasm-opt &> /dev/null; then
            echo "  Optimizing with wasm-opt..."
            wasm-opt -Oz pkg/grammar_checker_wasm.wasm -o pkg/grammar_checker_wasm_opt.wasm
            mv pkg/grammar_checker_wasm_opt.wasm pkg/grammar_checker_wasm.wasm
            OPTIMIZED_SIZE=$(stat -f%z "pkg/grammar_checker_wasm.wasm" 2>/dev/null || stat -c%s "pkg/grammar_checker_wasm.wasm")
            OPTIMIZED_SIZE_MB=$(echo "scale=2; $OPTIMIZED_SIZE / 1048576" | bc)
            SAVINGS=$(echo "scale=2; ($WASM_SIZE - $OPTIMIZED_SIZE) / 1048576" | bc)
            echo "  ✓ Optimized: ${OPTIMIZED_SIZE_MB} MB (saved ${SAVINGS} MB)"
        else
            echo "  ⚠ wasm-opt not found, skipping optimization"
        fi
    fi
    
    cd ..
else
    echo "[2/6] Skipping WebAssembly build (--skip-wasm)"
fi

# Step 3: Build TypeScript with Vite
echo "[3/6] Building TypeScript code..."
pnpm run build
echo "  ✓ TypeScript compiled and bundled"

# Step 4: Verify required files
echo "[4/6] Verifying build output..."

REQUIRED_FILES=(
    "dist/manifest.json"
    "dist/background.js"
    "dist/content.js"
    "dist/offscreen.js"
    "dist/worker.js"
    "dist/offscreen.html"
    "dist/popup.html"
    "dist/wasm/grammar_checker_wasm.wasm"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "  ✗ Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "    - $file"
    done
    exit 1
fi

echo "  ✓ All required files present"

# Step 5: Calculate bundle size
echo "[5/6] Calculating bundle size..."

TOTAL_SIZE=$(find dist -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}' || \
             find dist -type f -exec stat -c%s {} \; | awk '{s+=$1} END {print s}')
TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc)

echo "  Total extension size: ${TOTAL_SIZE_MB} MB"

if (( $(echo "$TOTAL_SIZE_MB > 20" | bc -l) )); then
    echo "  ⚠ Warning: Extension size exceeds 20MB target!"
else
    echo "  ✓ Size within 20MB target"
fi

# Step 6: Create package info
echo "[6/6] Creating package info..."

cat > dist/build-info.json << EOF
{
  "name": "grammar-checker-extension",
  "version": "1.0.0",
  "buildDate": "$(date '+%Y-%m-%d %H:%M:%S')",
  "totalSize": "${TOTAL_SIZE_MB} MB",
  "files": $(find dist -type f | wc -l)
}
EOF

echo "  ✓ Build info saved to dist/build-info.json"

echo ""
echo "========================================"
echo "Build completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Load unpacked extension from 'dist' folder in Chrome/Edge"
echo "  2. Test on various websites"
echo "  3. Run test suite: pnpm test"
echo ""
