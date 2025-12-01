# WebAssembly NLP Kernel

This is the WebAssembly-based NLP kernel for the Grammar Checker Extension. It provides high-performance tokenization and text analysis for Thai, English, and Japanese languages.

## Features

- **Thai Tokenization**: Maximal Matching with Backtracking algorithm
- **Japanese Tokenization**: Character-type-based segmentation with optional dictionary lookup
- **English Tokenization**: Whitespace-based with simplified Brill POS tagger
- **Dictionary Support**: Double-Array Trie (DAT) for efficient dictionary lookups
- **Memory Efficient**: Optimized for low memory usage (<50MB for all dictionaries)

## Building

### Prerequisites

- Rust (with `wasm32-unknown-unknown` target)
- cargo

### Build Commands

```bash
# Build for development
cargo build --target wasm32-unknown-unknown

# Build for release (optimized)
cargo build --target wasm32-unknown-unknown --release

# Or use the build script
./build.ps1  # Windows PowerShell
./build.sh   # Linux/Mac
```

### Build Output

The compiled Wasm module will be in:
- Development: `target/wasm32-unknown-unknown/debug/grammar_checker_wasm.wasm`
- Release: `target/wasm32-unknown-unknown/release/grammar_checker_wasm.wasm`
- Copied to: `pkg/grammar_checker_wasm.wasm`

## Testing

```bash
# Run all tests
cargo test --lib

# Run specific test module
cargo test --lib thai_tokenizer
cargo test --lib japanese_tokenizer
cargo test --lib english_tokenizer
cargo test --lib dat
```

## Usage

### JavaScript/TypeScript

```javascript
import init, { DictionaryManager } from './pkg/grammar_checker_wasm.js';

// Initialize the Wasm module
await init();

// Create dictionary manager
const manager = new DictionaryManager();

// Load dictionaries (optional, for better accuracy)
const thaiDict = await fetch('dictionaries/thai.dat').then(r => r.arrayBuffer());
await manager.loadDictionary('th', new Uint8Array(thaiDict));

// Tokenize text
const thaiTokens = manager.tokenizeThai('สวัสดีครับ');
const japaneseTokens = manager.tokenizeJapanese('こんにちは');
const englishTokens = manager.tokenizeEnglish('Hello world');

// Analyze text (main entry point)
const result = manager.analyze('Hello world', 'en');
console.log(result.tokens);
console.log(result.processingTime);
```

## API Reference

### DictionaryManager

Main class for managing dictionaries and tokenization.

#### Methods

- `constructor()`: Create a new dictionary manager
- `loadDictionary(language: string, data: Uint8Array)`: Load a dictionary for a language
- `unloadDictionary(language: string)`: Unload a dictionary to free memory
- `isLoaded(language: string)`: Check if a dictionary is loaded
- `getTotalMemoryUsage()`: Get total memory usage of all loaded dictionaries
- `getLoadedLanguages()`: Get list of loaded languages
- `tokenizeThai(text: string)`: Tokenize Thai text
- `tokenizeThaiGreedy(text: string)`: Tokenize Thai text (faster, less accurate)
- `tokenizeJapanese(text: string)`: Tokenize Japanese text
- `tokenizeEnglish(text: string)`: Tokenize English text with POS tagging
- `analyze(text: string, language: string)`: Main analysis function

### Dictionary

Wrapper for a single dictionary.

#### Methods

- `constructor(data: Uint8Array)`: Load a dictionary from binary data
- `lookupWord(word: string)`: Look up a word in the dictionary
- `containsWord(word: string)`: Check if a word exists
- `getLanguage()`: Get the language of this dictionary
- `getEntryCount()`: Get the number of entries
- `getMemoryUsage()`: Get memory usage in bytes

## Dictionary Format

Dictionaries are stored in Double-Array Trie (DAT) binary format:

```
Header (32 bytes):
- Magic number (4 bytes): 0x44415400 ('DAT\0')
- Version (4 bytes)
- Language (8 bytes): 'th', 'en', 'ja', etc.
- Entry count (4 bytes)
- BASE array size (4 bytes)
- CHECK array size (4 bytes)

Data:
- BASE array (4 bytes per entry)
- CHECK array (4 bytes per entry)
- VALUES array (4 bytes per entry)
```

## Building Dictionaries

Use the `dict-builder` tool to build dictionaries:

```bash
# Build a dictionary
cargo run --bin dict-builder --features build-tools -- build input.txt output.dat en

# Verify a dictionary
cargo run --bin dict-builder --features build-tools -- verify output.dat

# Compress a dictionary
cargo run --bin dict-builder --features build-tools -- compress output.dat output.dat.br
```

## Performance

- **Module Size**: ~276KB (uncompressed)
- **Tokenization Speed**: <50ms for typical text (after debounce)
- **Memory Usage**: <50MB for all loaded dictionaries
- **Dictionary Lookup**: O(1) per character

## Architecture

```
┌─────────────────────────────────────┐
│     JavaScript/TypeScript Layer     │
├─────────────────────────────────────┤
│         Wasm Bindings (JS)          │
├─────────────────────────────────────┤
│      Rust Wasm Module (Core)        │
│  ┌───────────────────────────────┐  │
│  │  DictionaryManager            │  │
│  │  - Thai Tokenizer             │  │
│  │  - Japanese Tokenizer         │  │
│  │  - English Tokenizer          │  │
│  │  - DAT Dictionary Reader      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## License

See the main project LICENSE file.
