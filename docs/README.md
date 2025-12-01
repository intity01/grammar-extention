# Grammar Checker Extension

A privacy-focused browser extension for real-time grammar checking in Thai (ไทย), English, and Japanese (日本語).

## 🌟 Features

### 🌍 Multi-Language Support
- **Thai (ไทย):** ตรวจสอบไวยากรณ์ภาษาไทย รองรับการตัดคำและกฎไวยากรณ์
- **English:** Grammar and spelling checks with intelligent suggestions
- **Japanese (日本語):** 日本語の文法チェック with morphological analysis

### 🔒 Privacy First
- **100% Offline:** All processing happens locally in your browser
- **No Data Collection:** We don't collect, store, or transmit your text
- **No AI/Cloud:** Rule-based checking without external servers
- **Open Source:** Verify our privacy claims by reviewing the code

### ⚡ Fast & Efficient
- **Real-time Checking:** See errors as you type with <50ms response time
- **Lightweight:** Uses <50MB memory with optimized dictionaries
- **Non-blocking:** Doesn't slow down your typing
- **WebAssembly:** High-performance text processing

### 🎯 Smart Correction Modes
- **Inline Mode:** Automatically fix errors in place
- **Clipboard Mode:** Copy corrected text to clipboard

### 🌐 Works Everywhere
- Gmail, Google Docs, Twitter, Facebook
- Any textarea, input field, or contenteditable element
- Chrome and Edge browsers

## 📦 Installation

### From Chrome Web Store
1. Visit [Chrome Web Store](#) (coming soon)
2. Click "Add to Chrome"
3. Start typing to see grammar checking in action

### From Microsoft Edge Add-ons
1. Visit [Edge Add-ons](#) (coming soon)
2. Click "Get"
3. Start typing to see grammar checking in action

### From Source (Development)
```bash
# Clone repository
git clone https://github.com/intity01/grammar-extention.git
cd grammar-extention

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the "dist" folder
```

## 🚀 How It Works

1. **Install** the extension
2. **Start typing** in any text field
3. **Errors are highlighted** automatically
4. **Click** to see suggestions and apply corrections

## 🔧 Technology

- **WebAssembly** for high-performance text processing
- **Double-Array Trie** for efficient dictionary storage
- **Rule-based grammar checking** (no AI/ML)
- **Manifest V3** for modern browser compatibility
- **Rust** for WASM modules
- **TypeScript** for extension logic

## 📝 Supported Error Types

### Thai (ไทย)
- Word spacing errors
- Word order issues
- Redundant phrases
- Common grammar mistakes

### English
- Subject-verb agreement
- Article usage (a/an/the)
- Common spelling mistakes
- Verb tense errors

### Japanese (日本語)
- Particle usage (は、が、を、に)
- Hiragana/Katakana consistency
- Verb conjugation
- Common grammar patterns

## 💡 Perfect For

- Students writing essays
- Professionals composing emails
- Social media enthusiasts
- Anyone who writes in multiple languages
- Privacy-conscious users

## 🔐 Privacy Policy

We take your privacy seriously. Read our full privacy policy:
- **Online:** https://intity01.github.io/grammar-extention/
- **Markdown:** [PRIVACY.md](PRIVACY.md)

**Summary:**
- ✅ 100% offline processing
- ✅ No data collection
- ✅ No external servers
- ✅ No tracking
- ✅ Your privacy is fully protected

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Rust and Cargo (for WASM)
- npm or pnpm

### Build Commands
```bash
# Development build
npm run dev

# Production build
npm run build

# Build WASM modules
npm run build:wasm

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### Project Structure
```
grammar-extention/
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Content scripts
│   ├── lib/            # Core libraries
│   ├── offscreen/      # Offscreen document
│   └── worker/         # Web worker
├── wasm/               # Rust WASM modules
├── dictionaries/       # Language dictionaries
├── rules/              # Grammar rules
├── public/             # Static assets
├── tests/              # Test files
└── promotional/        # Store materials
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆓 Free & Open Source

This extension is completely free with:
- ❌ No ads
- ❌ No premium tiers
- ❌ No hidden costs
- ✅ Open source code
- ✅ Community-driven

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/intity01/grammar-extention/issues)
- **Discussions:** [GitHub Discussions](https://github.com/intity01/grammar-extention/discussions)
- **Documentation:** [Wiki](https://github.com/intity01/grammar-extention/wiki)

## 🙏 Acknowledgments

- Dictionary data from open-source projects
- Grammar rules compiled from linguistic research
- Community contributions and feedback

## 📊 Status

- ✅ Core functionality complete
- ✅ Multi-language support (Thai, English, Japanese)
- ✅ WebAssembly optimization
- ✅ Privacy-focused design
- 🚧 Store submission in progress
- 🚧 Additional language support planned

---

**Made with ❤️ for privacy-conscious multilingual writers**

[⬆ Back to top](#grammar-checker-extension)
