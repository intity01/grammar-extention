# Grammar Checker Extension

Browser extension for real-time grammar checking in Thai, English, and Japanese without AI.

## Features

- Real-time grammar checking for Thai, English, and Japanese
- Rule-based approach (no AI/ML)
- WebAssembly-powered NLP kernel for high performance
- Two correction modes: Inline and Copy to Clipboard
- Works offline with local dictionaries
- Manifest V3 compatible

## Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Rust and wasm-pack (for WebAssembly modules)

### Installation

```bash
# Install dependencies
pnpm install

# Build WebAssembly modules
pnpm run build:wasm

# Development mode
pnpm run dev

# Production build
pnpm run build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Linting and Formatting

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format
```

## Project Structure

```
├── src/
│   ├── background/     # Service Worker (MV3)
│   ├── content/        # Content scripts
│   ├── offscreen/      # Offscreen document for clipboard
│   ├── worker/         # Web Worker for NLP processing
│   └── lib/            # Shared libraries
├── tests/
│   ├── unit/           # Unit tests
│   └── property/       # Property-based tests
├── rules/              # Grammar rules (JSON)
├── wasm/               # Rust WebAssembly modules
├── dictionaries/       # Language dictionaries (DAT format)
└── public/             # Static assets and manifest
```

## Architecture

The extension uses a multi-layered architecture:

1. **Content Script**: Monitors input fields and coordinates UI
2. **Service Worker**: Manages extension lifecycle and message routing
3. **Web Worker**: Runs WebAssembly NLP kernel
4. **Offscreen Document**: Handles clipboard access (MV3)

## License

MIT
