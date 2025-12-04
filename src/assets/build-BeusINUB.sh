#!/bin/bash
# Build script for WebAssembly NLP Kernel

set -e

echo "Building WebAssembly NLP Kernel..."

# Build with cargo
cargo build --target wasm32-unknown-unknown --release

# Copy the wasm file to pkg directory
mkdir -p pkg
cp target/wasm32-unknown-unknown/release/grammar_checker_wasm.wasm pkg/

echo "Build complete! Output: pkg/grammar_checker_wasm.wasm"
echo "Size: $(du -h pkg/grammar_checker_wasm.wasm | cut -f1)"
