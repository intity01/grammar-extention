# Implementation Plan

- [x] 1. Set up project structure and development environment





  - Create extension directory structure (src, tests, rules, wasm, dictionaries, public)
  - Initialize TypeScript project with tsconfig.json
  - Set up Vite for bundling (better Wasm support than Webpack)
  - Configure Jest and fast-check for testing
  - Create Manifest V3 file with required permissions (storage, activeTab, offscreen, clipboardWrite, contextMenus)
  - Add Content Security Policy for WebAssembly ('wasm-unsafe-eval')
  - Set up ESLint and Prettier
  - Initialize Rust workspace for Wasm modules
  - Configure wasm-pack or wasm-bindgen
  - Set up pnpm as package manager
  - _Requirements: 4.3_

- [x] 2. Implement language detection system





  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Create Language Detector with character-based detection


  - Implement Unicode character range checks for Thai (U+0E00-U+0E7F)
  - Implement Unicode character range checks for English (U+0041-U+005A, U+0061-U+007A)
  - Implement Unicode character range checks for Japanese (Hiragana U+3040-U+309F, Katakana U+30A0-U+30FF, Kanji U+4E00-U+9FAF)
  - Implement language detection function that returns Language enum
  - _Requirements: 3.5_

- [x] 2.2 Write property test for character-based language detection






  - **Property 13: Character-Based Language Detection**
  - **Validates: Requirements 3.5**

- [x] 2.3 Implement text segmentation for mixed languages

  - Create segmentation algorithm that splits text by language
  - Ensure each segment contains only one language
  - Ensure all characters are assigned to exactly one segment
  - _Requirements: 3.4_

- [x] 2.4 Write property test for mixed language segmentation






  - **Property 12: Mixed Language Segmentation**
  - **Validates: Requirements 3.4**

- [x] 3. Build dictionary infrastructure with Double-Array Trie



  

  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3.1 Implement Double-Array Trie (DAT) builder


  - Create Rust module for building DAT from word lists
  - Implement BASE and CHECK array construction
  - Add binary serialization (header + BASE + CHECK + values)
  - Test with small dictionary (100-1000 words)
  - _Requirements: 7.1_



- [x] 3.2 Prepare dictionary data sources




  - Download Thai Lexitron dictionary (NECTEC)
  - Download Japanese IPADIC or UniDic (compact version)
  - Download English Wiktionary + Hunspell dictionaries
  - Clean and normalize dictionary data


  - _Requirements: 7.3_

- [x] 3.3 Build DAT dictionaries for all languages





  - Convert Thai Lexitron to DAT binary format
  - Convert Japanese IPADIC to DAT binary format
  - Convert English dictionary to DAT binary format


  - Compress each DAT with Brotli (quality 11)
  - Verify dictionary sizes (target: <10MB per language compressed)
  - _Requirements: 7.1, 7.2_

- [x] 3.4 Implement IndexedDB dictionary storage





  - Create IndexedDB schema for dictionaries
  - Implement dictionary hydration on first install (load from bundle to IndexedDB)
  - Implement dictionary loading from IndexedDB
  - Add version checking for dictionary updates
  - _Requirements: 7.3_

- [x] 3.5 Write property test for dictionary memory usage





  - **Property: Memory Efficiency**
  - Verify total memory usage <= 50MB for all loaded dictionaries
  - **Validates: Requirements 7.4**

- [x] 3.6 Write property test for lazy dictionary loading





  - **Property: Lazy Loading**
  - Verify dictionaries are only loaded for detected languages
  - **Validates: Requirements 7.5**

- [x] 4. Create grammar rule system




  - _Requirements: 5.1, 5.2, 5.4_

- [x] 4.1 Design and implement grammar rule data structure


  - Create GrammarRule interface with pattern, errorType, message, correction, severity, enabled
  - Create JSON schema for rule files with version field
  - Implement rule loader that reads JSON files
  - Implement rule compilation (regex caching)
  - _Requirements: 5.4_

- [x] 4.2 Create initial grammar rules for Thai language


  - Write 10-15 common Thai grammar rules (spacing errors, word order, redundancy)
  - Store rules in rules/thai.json
  - _Requirements: 3.1, 5.2_

- [x] 4.3 Create initial grammar rules for English language


  - Write 15-20 common English grammar rules (subject-verb agreement, articles, spelling)
  - Store rules in rules/english.json
  - _Requirements: 3.2, 5.2_


- [x] 4.4 Create initial grammar rules for Japanese language

  - Write 10-15 common Japanese grammar rules (particle usage, hiragana/katakana consistency)
  - Store rules in rules/japanese.json
  - _Requirements: 3.3, 5.2_

- [x] 5. Build WebAssembly NLP Kernel





  - _Requirements: 6.5, 6.6_

- [x] 5.1 Set up Rust project for Wasm


  - Create Rust library crate with wasm32-unknown-unknown target
  - Add wasm-bindgen dependencies
  - Configure build script for Wasm compilation
  - Set up wasm-opt for optimization
  - _Requirements: 6.5_

- [x] 5.2 Implement DAT dictionary reader in Rust


  - Create binary parser for DAT format (header + BASE + CHECK)
  - Implement lookup function: BASE[s] + c = t, CHECK[t] = s
  - Add word existence check function
  - Add word metadata retrieval (POS, frequency)
  - Test with sample dictionaries
  - _Requirements: 7.1_

- [x] 5.3 Implement Thai tokenizer (Maximal Matching + Backtracking)


  - Port LibThai-compatible algorithm to Rust
  - Implement lookahead for longest match
  - Implement backtracking when path is blocked
  - Handle unknown words with heuristics
  - Test with Thai text samples
  - _Requirements: 3.1_

- [x] 5.4 Integrate Lindera for Japanese morphological analysis


  - Add Lindera crate dependency
  - Configure IPADIC dictionary
  - Implement tokenization function
  - Extract POS tags and morphological features
  - Test with Japanese text samples
  - _Requirements: 3.3_

- [x] 5.5 Implement English tokenizer with Brill POS tagger


  - Implement simple whitespace tokenizer
  - Port Brill Tagger algorithm (rule-based transformation)
  - Load transformation rules
  - Implement POS tagging function
  - Test with English text samples
  - _Requirements: 3.2_

- [x] 5.6 Implement Wasm interface functions


  - Create analyze() function (main entry point)
  - Create tokenize() function for each language
  - Create lookupWord() function
  - Add memory management functions (alloc, dealloc)
  - Add logging functions for debugging
  - _Requirements: 6.5_

- [x] 5.7 Build and optimize Wasm module


  - Compile Rust to Wasm with release profile
  - Run wasm-opt with -Oz flag
  - Verify module size (<2MB uncompressed)
  - Compress with Brotli
  - Test loading in browser
  - _Requirements: 6.5_

- [x] 5.8 Write property test for Wasm performance






  - **Property: WebAssembly Performance**
  - Verify analysis completes within 50ms after debounce
  - **Validates: Requirements 6.1, 6.5**

- [x] 6. Implement Rule Matcher in Wasm





  - _Requirements: 5.1, 5.2, 5.4_

- [x] 6.1 Create pattern matching engine using regex in Rust


  - Add regex crate dependency
  - Implement matchRules function that applies regex patterns to tokens
  - Implement identifyErrors function that converts matches to GrammarError objects
  - Cache compiled regex patterns for performance
  - _Requirements: 5.1, 5.4_

- [x] 6.2 Write property test for rule-based processing






  - **Property 15: Rule-Based Processing Only**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [x] 6.3 Implement language-specific rule application


  - Create function to select rules based on detected language
  - Ensure only appropriate language rules are applied to each segment
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6.4 Write property test for language-specific rule application






  - **Property 11: Language-Specific Rule Application**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 7. Build Web Worker wrapper for NLP Kernel




  - _Requirements: 6.6_

- [x] 7.1 Create Web Worker script


  - Set up worker message handling
  - Load Wasm module in worker
  - Load dictionaries from IndexedDB into Wasm memory
  - Implement analyze() wrapper function
  - Handle errors and timeouts
  - _Requirements: 6.6_

- [x] 7.2 Implement Grammar Engine interface


  - Create analyze function that sends text to Web Worker
  - Implement error detection that returns all matching errors
  - Implement correction generation for each error
  - Add performance monitoring (processing time)
  - _Requirements: 1.1, 2.1_

- [x] 7.3 Write property test for error detection completeness






  - **Property 1: Error Detection Completeness**
  - **Validates: Requirements 1.1, 1.3**

- [x] 7.4 Write property test for correction availability









  - **Property 4: Correction Availability**
  - **Validates: Requirements 2.1**

- [x] 7.5 Implement local processing without network calls


  - Ensure all operations are performed locally
  - Verify no HTTP requests or external API calls
  - _Requirements: 5.3_

- [x] 7.6 Write property test for local processing






  - **Property 16: Local Processing Without Network Calls**
  - **Validates: Requirements 5.3**

- [x] 7.7 Write property test for Web Worker non-blocking






  - **Property: Non-Blocking Web Worker**
  - Verify main thread is not blocked during analysis
  - **Validates: Requirements 6.6**

- [x] 8. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Input Monitor component





  - _Requirements: 1.1, 1.4, 6.2, 6.3_

- [x] 9.1 Create input field observer


  - Implement observeField function that attaches to input elements
  - Support textarea, input, and contenteditable elements
  - Implement text extraction from various input types
  - _Requirements: 1.1_

- [x] 9.2 Implement debouncing for performance

  - Add debounce logic with 300ms delay
  - Ensure only final event in rapid sequence triggers analysis
  - _Requirements: 6.2_

- [x] 9.3 Write property test for debounced input processing






  - **Property 18: Debounced Input Processing**
  - **Validates: Requirements 6.2**

- [x] 9.4 Implement active field tracking

  - Track currently active input field
  - Monitor only active field to conserve resources
  - _Requirements: 6.3_

- [x] 9.5 Implement re-analysis on text modification

  - Trigger analysis when text is modified
  - Handle input events efficiently
  - _Requirements: 1.4_

- [x] 9.6 Write property test for re-analysis triggers





  - **Property 3: Re-analysis Triggers on Modification**
  - **Validates: Requirements 1.4**

- [x] 10. Create UI Controller with advanced overlay techniques









  - _Requirements: 1.2, 1.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 10.1 Implement Mirror Div technique for textarea/input


  - Create createMirrorDiv function that clones CSS properties
  - Implement calculateErrorCoordinates using offsetLeft/offsetTop
  - Test with various textarea sizes and fonts
  - _Requirements: 1.2_

- [x] 10.2 Implement Range API technique for contenteditable


  - Create createRangeForError function
  - Use getBoundingClientRect() to get error coordinates
  - Test with Gmail, Google Docs, and other rich text editors
  - _Requirements: 1.2_

- [x] 10.3 Implement Shadow DOM overlay for CSS isolation


  - Create createShadowOverlay function (mode: 'closed')
  - Implement drawErrorUnderline function
  - Prevent CSS conflicts with host page
  - _Requirements: 1.2_

- [x] 10.4 Implement CSS Custom Highlight API (progressive enhancement)


  - Check browser support with supportsHighlightAPI()
  - Implement applyHighlightAPI using ::highlight(grammar-error)
  - Fallback to Shadow DOM for older browsers
  - _Requirements: 1.2_

- [x] 10.5 Implement error highlighting with all techniques


  - Create highlightErrors function that selects appropriate technique
  - Implement clearHighlights function
  - Test on various websites and input types
  - _Requirements: 1.2, 1.3_

- [x] 10.6 Write property test for error highlighting completeness






  - **Property 2: Error Highlighting Completeness**
  - **Validates: Requirements 1.2, 1.3**

- [x] 10.7 Implement inline correction application


  - Create applyInlineCorrection function
  - Replace error text with correction in input field
  - Preserve surrounding text unchanged
  - _Requirements: 2.4, 2.7_

- [x] 10.8 Write property test for inline correction application






  - **Property 6: Inline Correction Application**
  - **Validates: Requirements 2.4**

- [x] 10.9 Write property test for text preservation during inline correction






  - **Property 9: Text Preservation During Inline Correction**
  - **Validates: Requirements 2.7**

- [x] 10.10 Implement cursor position management


  - Create preserveCursor function
  - Adjust cursor position after correction based on length difference
  - Handle edge cases (cursor at start/end)
  - _Requirements: 2.8_

- [x] 10.11 Write property test for cursor position adjustment






  - **Property 10: Cursor Position Adjustment**
  - **Validates: Requirements 2.8**

- [x] 10.12 Implement clipboard correction request (delegates to Service Worker)


  - Create requestClipboardCorrection function
  - Send message to Service Worker to trigger Offscreen Document
  - Ensure text field is not modified in clipboard mode
  - _Requirements: 2.5, 2.6_

- [x] 10.13 Write property test for clipboard mode non-modification






  - **Property 8: Clipboard Mode Non-Modification**
  - **Validates: Requirements 2.6**

- [x] 11. Implement Offscreen Document for clipboard access





  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 11.1 Create offscreen.html and offscreen.ts


  - Create minimal HTML document
  - Implement message listener for WRITE_TO_CLIPBOARD
  - Implement writeToClipboard using navigator.clipboard.writeText()
  - Add text sanitization to prevent XSS
  - _Requirements: 8.1, 8.4_

- [x] 11.2 Implement auto-cleanup


  - Close Offscreen Document after successful write
  - Set 30-second timeout for cleanup
  - Handle errors gracefully
  - _Requirements: 8.3_

- [x] 11.3 Implement notification display


  - Show success notification after clipboard write
  - Show error notification on failure
  - _Requirements: 8.5_

- [ ]* 11.4 Write property test for Offscreen Document usage
  - **Property: Offscreen Document for Clipboard**
  - Verify Offscreen Document is created with reason 'CLIPBOARD'
  - **Validates: Requirements 8.1, 8.2**

- [ ]* 11.5 Write property test for clipboard sanitization
  - **Property: Clipboard Text Sanitization**
  - Verify text is sanitized before writing to clipboard
  - **Validates: Requirements 8.4**

- [ ]* 11.6 Write property test for clipboard correction application
  - **Property 7: Clipboard Correction Application**
  - Verify text is copied to clipboard and notification shown
  - **Validates: Requirements 2.5, 8.5**

- [x] 12. Implement settings and correction mode management




  - _Requirements: 2.2, 2.3_

- [x] 12.1 Create settings storage using chrome.storage API

  - Define ExtensionSettings interface
  - Implement getSettings and updateSettings functions
  - Set default correctionMode to 'inline'
  - Add performanceMode setting
  - _Requirements: 2.2, 2.3_

- [ ]** 12.2 Write property test for correction mode configuration
  - **Property 5: Correction Mode Configuration**
  - **Validates: Requirements 2.2, 2.3**

- [x] 12.3 Create settings UI (popup or options page)

  - Design simple UI for correction mode selection
  - Add radio buttons or toggle for Inline vs Copy to Clipboard
  - Add performance mode selector (balanced/fast/accurate)
  - Save settings on change
  - _Requirements: 2.2_

- [x] 13. Implement Content Script





  - _Requirements: 1.1, 1.4, 4.4_

- [x] 13.1 Create content script entry point


  - Initialize extension on page load
  - Inject into all web pages using manifest content_scripts
  - Attach to all text input fields on page
  - Establish Keep-Alive connection to Service Worker
  - _Requirements: 4.4_

- [ ]** 13.2 Write property test for content script injection
  - **Property 14: Content Script Injection**
  - **Validates: Requirements 4.4**

- [x] 13.3 Wire together all components in content script


  - Connect Input Monitor to Service Worker
  - Connect Service Worker responses to UI Controller
  - Handle user interactions (accepting corrections)
  - Implement correction mode switching logic
  - _Requirements: 1.1, 1.4, 2.4, 2.5_

- [x] 13.4 Implement performance monitoring


  - Track analysis time for each request
  - Log performance metrics to console (dev mode)
  - Ensure analysis completes within 50ms target
  - _Requirements: 6.1_

- [x] 13.5 Write property test for analysis performance bound






  - **Property 17: Analysis Performance Bound**
  - **Validates: Requirements 6.1**

- [x] 13.6 Write property test for non-blocking execution






  - **Property 19: Non-Blocking Execution**
  - **Validates: Requirements 6.3, 6.4**
 

- [x] 14. Create Background Service Worker (MV3 Ephemeral)







  - _Requirements: 4.3_

- [x] 14.1 Implement background service worker lifecycle


  - Create background.js with service worker event handlers
  - Implement onInstalled handler (dictionary hydration)
  - Implement onStartup handler
  - Handle extension updates
  - _Requirements: 4.3_

- [x] 14.2 Implement message routing

  - Handle messages from Content Script
  - Route analysis requests to Web Worker
  - Route clipboard requests to Offscreen Document
  - Return results to Content Script
  - _Requirements: 1.1_

- [x] 14.3 Implement Web Worker management

  - Create or reuse Web Worker instance
  - Handle worker termination on idle
  - Implement error recovery (restart worker on crash)
  - _Requirements: 6.6_

- [x] 14.4 Implement Offscreen Document management

  - Create Offscreen Document when needed (clipboard mode)
  - Close Offscreen Document after use
  - Handle multiple concurrent requests
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 14.5 Implement Keep-Alive strategy

  - Handle Port connections from Content Scripts
  - Keep Service Worker alive while Content Scripts are active
  - Clean up connections on tab close
  - _Requirements: 4.3_

- [x] 14.6 Implement Context Menu

  - Create context menu items for grammar checking
  - Handle context menu clicks
  - Trigger analysis on selected text
  - _Requirements: 4.3_

- [x] 14.7 Implement settings management in background

  - Store and retrieve settings from chrome.storage
  - Provide settings to content scripts via messaging
  - Handle settings updates
  - _Requirements: 2.2, 2.3_

- [x] 14.8 Implement grammar rules loading

  - Load grammar rules from JSON files
  - Cache compiled regex patterns
  - Provide rules to Web Worker
  - Support lazy loading by language
  - _Requirements: 5.1, 5.4_

- [x] 15. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [-] 16. Build and package extension





  - _Requirements: 4.1, 4.2, 4.3_

- [x] 16.1 Configure build process


  - Set up Vite to bundle TypeScript code
  - Configure Rust/Wasm build pipeline
  - Generate manifest.json in dist folder
  - Copy grammar rule JSON files to dist
  - Copy Wasm modules to dist
  - Copy compressed dictionaries to dist
  - Create offscreen.html in dist
  - Create production build script
  - _Requirements: 4.3_

- [x] 16.2 Optimize bundle size



  - Enable tree-shaking in Vite
  - Minify JavaScript code
  - Optimize Wasm modules with wasm-opt
  - Compress all assets with Brotli
  - Verify total extension size (<20MB)
  - _Requirements: 4.3_

- [x] 16.3 Test extension in Chrome







  - Load unpacked extension in Chrome
  - Verify all features work correctly
  - Test on common websites (Gmail, Google Docs, Twitter, Facebook)
  - Test textarea, input, and contenteditable elements
  - Test inline correction mode
  - Test clipboard correction mode
  - Verify performance (analysis < 50ms)
  - Verify memory usage (<50MB)
  - _Requirements: 4.1, 6.1, 7.4_

- [x] 16.4 Test extension in Edge


  - Load unpacked extension in Edge
  - Verify all features work correctly
  - Test on common websites
  - Verify cross-browser compatibility
  - _Requirements: 4.2_

- [x] 16.5 Test WebAssembly functionality





  - Verify Wasm modules load correctly
  - Test Thai tokenization accuracy
  - Test Japanese morphological analysis
  - Test English POS tagging
  - Verify dictionary lookups work
  - Test error handling (invalid Wasm, missing dictionaries)
  - _Requirements: 6.5_

- [x] 16.6 Test Offscreen Document functionality





  - Verify clipboard write works in both Chrome and Edge
  - Test without user gesture on page
  - Verify text sanitization
  - Verify auto-cleanup after 30 seconds
  - Test error handling (clipboard permission denied)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 17. Final checkpoint - Ensure all tests pass





  - Run all unit tests
  - Run all property-based tests (100+ iterations each)
  - Verify all 19 correctness properties pass
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.
