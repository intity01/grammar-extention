# Design Document

## Overview

Grammar Checker Extension เป็น browser extension ที่ใช้ rule-based approach ในการตรวจสอบและแก้ไขไวยากรณ์แบบ real-time สำหรับภาษาไทย อังกฤษ และญี่ปุ่น โดยไม่ใช้ AI และทำงานแบบออฟไลน์โดยสมบูรณ์ ระบบใช้ WebAssembly สำหรับการประมวลผล NLP ที่มีประสิทธิภาพสูง, Double-Array Trie สำหรับการจัดเก็บพจนานุกรม, IndexedDB สำหรับการจัดการข้อมูลขนาดใหญ่, และ Offscreen Documents API สำหรับการเข้าถึงคลิปบอร์ดภายใต้ Manifest V3

## Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser Extension (MV3)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐         ┌──────────────────────────────┐   │
│  │   Background    │         │      Content Script          │   │
│  │Service Worker   │◄───────►│  (Injected into web pages)   │   │
│  │  (Ephemeral)    │         │                              │   │
│  └────────┬────────┘         │  ┌─────────────────────────┐ │   │
│           │                  │  │   Input Monitor         │ │   │
│           │                  │  │   (Debounce 300ms)      │ │   │
│           │                  │  └──────────┬──────────────┘ │   │
│           │                  │             │                │   │
│           │                  │  ┌──────────▼──────────────┐ │   │
│           │                  │  │   UI Controller         │ │   │
│           │                  │  │  - Mirror Div (textarea)│ │   │
│           │                  │  │  - Range API (content-  │ │   │
│           │                  │  │    editable)            │ │   │
│           │                  │  │  - Shadow DOM Overlay   │ │   │
│           │                  │  │  - CSS Highlight API    │ │   │
│           │                  │  └─────────────────────────┘ │   │
│           │                  └──────────────────────────────┘   │
│           │                                                      │
│  ┌────────▼────────┐         ┌──────────────────────────────┐   │
│  │  Web Worker     │         │   Offscreen Document         │   │
│  │  (NLP Kernel)   │         │   (Clipboard Access)         │   │
│  │                 │         │                              │   │
│  │ ┌─────────────┐ │         │  - navigator.clipboard API   │   │
│  │ │ WebAssembly │ │         │  - Corrected text writer     │   │
│  │ │ NLP Engine  │ │         │  - Notification display      │   │
│  │ │             │ │         └──────────────────────────────┘   │
│  │ │ Thai:       │ │                                            │
│  │ │  LibThai    │ │         ┌──────────────────────────────┐   │
│  │ │  Maximal    │ │         │      IndexedDB               │   │
│  │ │  Matching   │ │         │                              │   │
│  │ │             │ │         │  - Dictionary Store (DAT)    │   │
│  │ │ Japanese:   │ │         │  - Thai: Lexitron (40K+)     │   │
│  │ │  Lindera    │ │         │  - Japanese: IPADIC          │   │
│  │ │  IPADIC     │ │         │  - English: Wiktionary       │   │
│  │ │             │ │         │  - Brotli compressed blobs   │   │
│  │ │ English:    │ │         └──────────────────────────────┘   │
│  │ │  Harper-like│ │                                            │
│  │ │  Brill POS  │ │         ┌──────────────────────────────┐   │
│  │ └─────────────┘ │         │   Grammar Rules Database     │   │
│  │                 │         │   (JSON + Compiled Regex)    │   │
│  │ ┌─────────────┐ │         │                              │   │
│  │ │Double-Array │ │         │  - Thai rules (10-15)        │   │
│  │ │Trie (DAT)   │ │         │  - English rules (15-20)     │   │
│  │ │Dictionary   │ │         │  - Japanese rules (10-15)    │   │
│  │ └─────────────┘ │         └──────────────────────────────┘   │
│  └─────────────────┘                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Input Monitoring**: Content Script ดักจับ input events จาก textarea, input, contenteditable (debounce 300ms)
2. **Message Passing**: ข้อความถูกส่งไปยัง Service Worker ผ่าน chrome.runtime.sendMessage
3. **Worker Delegation**: Service Worker ส่งต่อไปยัง Web Worker ที่รัน NLP Kernel (Wasm)
4. **Language Detection**: Wasm engine ตรวจจับภาษาด้วย Unicode character ranges (ไม่ใช้ AI)
5. **Text Segmentation**: แบ่งข้อความตามภาษา (สำหรับ mixed-language text)
6. **Dictionary Lookup**: ค้นหาคำในพจนานุกรม DAT ที่โหลดจาก IndexedDB
7. **Tokenization**: 
   - ไทย: Maximal Matching + Backtracking (LibThai-compatible)
   - ญี่ปุ่น: Morphological Analysis (Lindera + IPADIC)
   - อังกฤษ: Simple whitespace + POS Tagging (Brill Tagger)
8. **Rule Matching**: ใช้ compiled regex patterns ตรวจสอบกฎไวยากรณ์
9. **Error Detection**: สร้าง GrammarError objects พร้อมตำแหน่งและคำแนะนำ
10. **Result Return**: ส่งรายการข้อผิดพลาดกลับไปยัง Content Script
11. **Visual Feedback**: UI Controller วาด overlay (Mirror Div/Range API/Shadow DOM)
12. **Correction Application**:
    - **Inline Mode**: แก้ไขโดยตรงใน input field พร้อมปรับตำแหน่ง cursor
    - **Clipboard Mode**: Service Worker สร้าง Offscreen Document เพื่อเขียนลงคลิปบอร์ด

## Components and Interfaces

### 1. Content Script

**Responsibilities:**
- Inject into web pages and monitor text input fields
- Capture user input events with debouncing
- Send text to Service Worker for analysis
- Coordinate between Service Worker and UI Controller
- Maintain Keep-Alive connection to prevent Service Worker termination

**Interface:**
```typescript
interface ContentScript {
  initialize(): void;
  attachToInputFields(): void;
  handleInput(event: InputEvent): void;
  detachFromInputFields(): void;
  sendToAnalysis(text: string): Promise<AnalysisResult>;
  maintainConnection(): chrome.runtime.Port; // Keep-Alive for Service Worker
}
```

### 2. Input Monitor

**Responsibilities:**
- Track active input fields
- Debounce input events for performance
- Extract text content from various input types

**Interface:**
```typescript
interface InputMonitor {
  observeField(element: HTMLElement): void;
  unobserveField(element: HTMLElement): void;
  getActiveField(): HTMLElement | null;
  extractText(element: HTMLElement): string;
  setText(element: HTMLElement, text: string, cursorPos: number): void;
}
```

### 3. NLP Kernel (WebAssembly)

**Responsibilities:**
- รันใน Web Worker แยกต่างหาก (non-blocking)
- Detect language of input text using Unicode ranges
- Tokenize text based on language-specific algorithms
- Apply grammar rules using compiled regex patterns
- Generate corrections with deterministic logic
- Access Double-Array Trie dictionaries in Wasm Linear Memory

**Technology Stack:**
- **Core**: Rust compiled to WebAssembly
- **Thai**: LibThai-compatible algorithm (Maximal Matching + Backtracking)
- **Japanese**: Lindera (Rust morphological analyzer) + IPADIC dictionary
- **English**: Harper-inspired engine + Brill Tagger for POS

**Interface:**
```typescript
interface NLPKernel {
  // Main entry point (called from Web Worker)
  analyze(text: string): Promise<AnalysisResult>;
  
  // Language detection (character-based, no AI)
  detectLanguage(text: string): Language[];
  
  // Tokenization (language-specific)
  tokenize(text: string, language: Language): Token[];
  
  // Dictionary lookup using DAT
  lookupWord(word: string, language: Language): DictionaryEntry | null;
  
  // Rule matching
  applyRules(tokens: Token[], language: Language): GrammarError[];
  
  // Correction generation
  generateCorrection(error: GrammarError): Correction;
  
  // Memory management
  loadDictionary(language: Language, datBlob: ArrayBuffer): void;
  unloadDictionary(language: Language): void;
}

interface AnalysisResult {
  errors: GrammarError[];
  corrections: Correction[];
  segments: LanguageSegment[];
  processingTime: number; // for performance monitoring
}

interface GrammarError {
  start: number;
  end: number;
  type: string;
  message: string;
  language: Language;
  ruleId: string; // for traceability
}

interface Correction {
  error: GrammarError;
  original: string;
  corrected: string;
  confidence: number; // deterministic score, not probabilistic
}

interface Token {
  text: string;
  start: number;
  end: number;
  pos?: string; // Part-of-Speech tag (for Japanese/English)
  features?: string[]; // Morphological features (for Japanese)
}

interface DictionaryEntry {
  word: string;
  pos: string;
  frequency?: number;
  features?: Record<string, any>;
}
```

### 4. Language Detector

**Responsibilities:**
- Identify language(s) in text using character ranges
- Segment mixed-language text

**Interface:**
```typescript
interface LanguageDetector {
  detect(text: string): Language[];
  segment(text: string): LanguageSegment[];
  isLanguage(char: string, language: Language): boolean;
}

interface LanguageSegment {
  text: string;
  start: number;
  end: number;
  language: Language;
}

enum Language {
  THAI = 'th',
  ENGLISH = 'en',
  JAPANESE = 'ja',
  UNKNOWN = 'unknown'
}
```

### 5. Rule Matcher

**Responsibilities:**
- Load and manage grammar rules
- Match text patterns against rules
- Identify grammar errors

**Interface:**
```typescript
interface RuleMatcher {
  loadRules(language: Language): GrammarRule[];
  matchRules(text: string, rules: GrammarRule[]): Match[];
  identifyErrors(matches: Match[]): GrammarError[];
}

interface GrammarRule {
  id: string;
  language: Language;
  pattern: RegExp;
  errorType: string;
  message: string;
  correction: string | ((match: string) => string);
}

interface Match {
  rule: GrammarRule;
  start: number;
  end: number;
  matched: string;
}
```

### 6. UI Controller

**Responsibilities:**
- Highlight errors in text using multiple techniques
- Apply corrections to input fields (inline mode)
- Trigger clipboard operations via Offscreen Document
- Manage visual feedback with Shadow DOM isolation
- Show notifications
- Preserve cursor position during corrections

**Techniques:**
- **textarea/input**: Mirror Div technique (hidden div with identical CSS)
- **contenteditable**: Range API + getBoundingClientRect()
- **Isolation**: Shadow DOM (mode: 'closed') to prevent CSS conflicts
- **Modern browsers**: CSS Custom Highlight API (::highlight(grammar-error))

**Interface:**
```typescript
interface UIController {
  // Highlighting (multiple strategies)
  highlightErrors(element: HTMLElement, errors: GrammarError[]): void;
  clearHighlights(element: HTMLElement): void;
  
  // Mirror Div technique for textarea/input
  createMirrorDiv(element: HTMLTextAreaElement | HTMLInputElement): HTMLDivElement;
  calculateErrorCoordinates(mirrorDiv: HTMLDivElement, error: GrammarError): Rect;
  
  // Range API for contenteditable
  createRangeForError(element: HTMLElement, error: GrammarError): Range;
  getErrorBoundingRect(range: Range): DOMRect;
  
  // Shadow DOM overlay
  createShadowOverlay(element: HTMLElement): ShadowRoot;
  drawErrorUnderline(shadowRoot: ShadowRoot, rect: Rect): void;
  
  // CSS Highlight API (progressive enhancement)
  supportsHighlightAPI(): boolean;
  applyHighlightAPI(element: HTMLElement, errors: GrammarError[]): void;
  
  // Inline correction
  applyInlineCorrection(element: HTMLElement, correction: Correction): void;
  preserveCursor(element: HTMLElement, offset: number): void;
  
  // Clipboard correction (delegates to Service Worker)
  requestClipboardCorrection(text: string): Promise<void>;
  
  // Notifications
  showNotification(message: string, type: 'success' | 'error' | 'info'): void;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 7. Background Service Worker (MV3 Ephemeral)

**Responsibilities:**
- Manage extension lifecycle (ephemeral, can terminate anytime)
- Coordinate between Content Script and Web Worker
- Manage Offscreen Document for clipboard access
- Store and retrieve settings from chrome.storage
- Handle Context Menu interactions
- Maintain Keep-Alive connections from Content Scripts

**Challenges:**
- Service Worker ใน MV3 เป็นแบบ ephemeral (ไม่สามารถเก็บ state ใน global variables)
- ต้องใช้ Keep-Alive strategy (Port connections) เพื่อรักษาการทำงานต่อเนื่อง
- ต้องโหลดพจนานุกรมจาก IndexedDB ทุกครั้งที่ตื่นขึ้นมา (ใช้ Web Worker เป็น cache)

**Interface:**
```typescript
interface BackgroundService {
  // Lifecycle
  initialize(): void;
  onInstalled(details: chrome.runtime.InstalledDetails): void;
  onStartup(): void;
  
  // Message handling
  handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<any>;
  
  // Web Worker management
  getOrCreateWorker(): Worker;
  terminateWorker(): void;
  
  // Offscreen Document management
  createOffscreenDocument(): Promise<void>;
  closeOffscreenDocument(): Promise<void>;
  sendToOffscreen(message: OffscreenMessage): Promise<void>;
  
  // Settings
  getSettings(): Promise<ExtensionSettings>;
  updateSettings(settings: Partial<ExtensionSettings>): Promise<void>;
  
  // Grammar rules
  loadGrammarRules(): Promise<Map<Language, GrammarRule[]>>;
  
  // Context Menu
  createContextMenus(): void;
  handleContextMenuClick(info: chrome.contextMenus.OnClickData): void;
  
  // Keep-Alive
  handlePortConnection(port: chrome.runtime.Port): void;
}

interface ExtensionSettings {
  enabled: boolean;
  correctionMode: 'inline' | 'clipboard';
  languages: Language[];
  debounceDelay: number;
  performanceMode: 'balanced' | 'fast' | 'accurate';
}

interface Message {
  type: 'ANALYZE_TEXT' | 'GET_SETTINGS' | 'UPDATE_SETTINGS' | 'APPLY_CORRECTION';
  payload: any;
}

interface OffscreenMessage {
  type: 'WRITE_TO_CLIPBOARD';
  text: string;
}
```

### 8. Offscreen Document

**Purpose:**
- เข้าถึง navigator.clipboard API ภายใต้ข้อจำกัดของ MV3
- Service Worker ไม่สามารถเข้าถึง DOM APIs ได้โดยตรง
- Offscreen Document เป็น "hidden page" ที่มีสิทธิ์ clipboardWrite

**Responsibilities:**
- รับข้อความที่แก้ไขแล้วจาก Service Worker
- เขียนข้อความลงคลิปบอร์ดด้วย navigator.clipboard.writeText()
- แสดง notification เมื่อคัดลอกสำเร็จ
- ปิดตัวเองหลังจากทำงานเสร็จ (resource cleanup)

**Manifest Configuration:**
```json
{
  "permissions": ["offscreen", "clipboardWrite"],
  "background": {
    "service_worker": "background.js"
  }
}
```

**Interface:**
```typescript
interface OffscreenDocument {
  initialize(): void;
  handleMessage(message: OffscreenMessage): Promise<void>;
  writeToClipboard(text: string): Promise<void>;
  sanitizeText(text: string): string; // prevent XSS
  notifySuccess(): void;
  cleanup(): void;
}
```

**Implementation:**
```typescript
// offscreen.ts
chrome.runtime.onMessage.addListener((message: OffscreenMessage, sender, sendResponse) => {
  if (message.type === 'WRITE_TO_CLIPBOARD') {
    navigator.clipboard.writeText(message.text)
      .then(() => {
        sendResponse({ success: true });
        // Auto-close after 30 seconds
        setTimeout(() => window.close(), 30000);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // async response
  }
});
```

## Data Models

### Double-Array Trie (DAT) Structure

พจนานุกรมถูกเก็บในรูปแบบ Double-Array Trie เพื่อประสิทธิภาพสูงสุด:

**Principle:**
- DAT ยุบโครงสร้าง Trie ลงเป็น 2 arrays: BASE และ CHECK
- `BASE[s] + c = t`: คำนวณ next state จาก current state `s` ด้วยตัวอักษร `c`
- `CHECK[t] = s`: ตรวจสอบความถูกต้องของการเปลี่ยน state
- Time complexity: O(1) per character (effectively constant w.r.t. dictionary size)
- Space efficiency: ~20-30% ของ Hash Map

**Binary Format:**
```typescript
interface DATBinaryFormat {
  header: {
    magic: number;        // 0x44415400 ('DAT\0')
    version: number;      // Format version
    language: string;     // 'th', 'en', 'ja'
    entryCount: number;   // Number of words
    baseSize: number;     // Size of BASE array
    checkSize: number;    // Size of CHECK array
  };
  base: Int32Array;       // BASE array
  check: Int32Array;      // CHECK array
  values: Uint32Array;    // Word metadata (POS, frequency, etc.)
}
```

**Compression:**
- Binary DAT ถูกบีบอัดด้วย Brotli (20-30% ดีกว่า Gzip)
- ไฟล์ถูก bundle มาพร้อมส่วนขยาย (ไม่ดาวน์โหลดจากภายนอก)
- โหลดเข้า IndexedDB ครั้งแรกที่ติดตั้ง (hydration)
- โหลดเข้า Wasm Linear Memory เมื่อต้องใช้งาน

**Dictionary Sources:**
- **Thai**: Lexitron (NECTEC) - 40,000+ words
- **Japanese**: IPADIC or UniDic (compact version)
- **English**: Wiktionary + Hunspell dictionaries (filtered)

### Grammar Rule Structure

Grammar rules are stored as JSON files, one per language:

```json
{
  "language": "th",
  "version": "1.0.0",
  "rules": [
    {
      "id": "th_001",
      "pattern": "\\bไป\\s+ที่\\s+ไหน\\b",
      "errorType": "word_order",
      "message": "ควรใช้ 'ไปไหน' แทน 'ไป ที่ ไหน'",
      "correction": "ไปไหน",
      "severity": "warning",
      "enabled": true
    },
    {
      "id": "th_002",
      "pattern": "\\bได้\\s+รับ\\b",
      "errorType": "redundancy",
      "message": "'ได้รับ' ไม่ต้องเว้นวรรค",
      "correction": "ได้รับ",
      "severity": "error",
      "enabled": true
    }
  ]
}
```

**Rule Compilation:**
- Regex patterns ถูก compile ล่วงหน้าและ cache ไว้
- Rules ถูกโหลดเฉพาะภาษาที่ตรวจพบ (lazy loading)
- Rules สามารถ enable/disable ได้ผ่าน settings

### Language Detection Patterns

Language detection uses Unicode character ranges:

- **Thai**: U+0E00 to U+0E7F
- **English**: U+0041 to U+005A, U+0061 to U+007A
- **Japanese**: 
  - Hiragana: U+3040 to U+309F
  - Katakana: U+30A0 to U+30FF
  - Kanji: U+4E00 to U+9FAF

### Text Segment Model

```typescript
interface TextSegment {
  text: string;
  start: number;
  end: number;
  language: Language;
  errors: GrammarError[];
  corrections: Correction[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Error Detection Completeness
*For any* text input containing grammar errors matching defined rules, the Grammar Checker should detect and return all matching errors.
**Validates: Requirements 1.1, 1.3**

### Property 2: Error Highlighting Completeness
*For any* set of detected grammar errors, the UI Controller should create visual indicators for all errors in the DOM.
**Validates: Requirements 1.2, 1.3**

### Property 3: Re-analysis Triggers on Modification
*For any* text modification event in a monitored input field, the Grammar Checker should trigger a new analysis of the modified text.
**Validates: Requirements 1.4**

### Property 4: Correction Availability
*For any* detected grammar error, the Grammar Engine should generate at least one correction suggestion.
**Validates: Requirements 2.1**

### Property 5: Correction Mode Configuration
*For any* extension installation, the settings should include a correctionMode field with value 'inline' or 'clipboard', defaulting to 'inline'.
**Validates: Requirements 2.2, 2.3**

### Property 6: Inline Correction Application
*For any* correction suggestion, when correctionMode is 'inline' and user accepts, the UI Controller should apply the correction to the input field directly.
**Validates: Requirements 2.4**

### Property 7: Clipboard Correction Application
*For any* correction suggestion, when correctionMode is 'clipboard' and user accepts, the corrected text should be copied to clipboard and a notification should be shown.
**Validates: Requirements 2.5**

### Property 8: Clipboard Mode Non-Modification
*For any* correction in clipboard mode, the original text in the input field should remain unchanged after user accepts the suggestion.
**Validates: Requirements 2.6**

### Property 9: Text Preservation During Inline Correction
*For any* text with an error at position [start, end], applying an inline correction should only modify the substring [start, end] and preserve all other text unchanged.
**Validates: Requirements 2.7**

### Property 10: Cursor Position Adjustment
*For any* inline correction applied at position [start, end], the cursor position should be adjusted by the difference in length between the original and corrected text.
**Validates: Requirements 2.8**

### Property 11: Language-Specific Rule Application
*For any* text segment identified as a specific language (Thai, English, or Japanese), only grammar rules for that language should be applied to that segment.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 12: Mixed Language Segmentation
*For any* text containing multiple languages, the Language Detector should segment the text such that each segment contains only one language and all characters are assigned to exactly one segment.
**Validates: Requirements 3.4**

### Property 13: Character-Based Language Detection
*For any* character in the input text, language detection should determine its language using only Unicode character range checks without AI or ML algorithms.
**Validates: Requirements 3.5**

### Property 14: Content Script Injection
*For any* web page loaded with the extension enabled, content scripts should be injected and attach event listeners to all text input fields.
**Validates: Requirements 4.4**

### Property 15: Rule-Based Processing Only
*For any* text analysis operation, the Grammar Engine should use only pattern matching (regular expressions) and dictionary lookups, with no calls to ML/AI libraries or models.
**Validates: Requirements 5.1, 5.2, 5.4**

### Property 16: Local Processing Without Network Calls
*For any* grammar checking operation, the Extension should complete all processing locally without making HTTP requests or external API calls.
**Validates: Requirements 5.3**

### Property 17: Analysis Performance Bound
*For any* text input event, the Grammar Checker should complete analysis and return results within 100 milliseconds.
**Validates: Requirements 6.1**

### Property 18: Debounced Input Processing
*For any* sequence of rapid input events within the debounce delay period, only the final event should trigger grammar analysis.
**Validates: Requirements 6.2**

### Property 19: Non-Blocking Execution
*For any* grammar checking operation, user input events should continue to be processed without delay or blocking.
**Validates: Requirements 6.3, 6.4**

### Property 20: WebAssembly Performance
*For any* text analysis operation using the NLP Kernel, the processing should complete within 50 milliseconds after the debounce period.
**Validates: Requirements 6.1, 6.5**

### Property 21: Web Worker Isolation
*For any* NLP processing operation, the computation should occur in a Web Worker separate from the main thread, ensuring the UI remains responsive.
**Validates: Requirements 6.6**

### Property 22: Dictionary Memory Efficiency
*For any* set of loaded dictionaries, the total memory usage should not exceed 50 MB.
**Validates: Requirements 7.4**

### Property 23: Lazy Dictionary Loading
*For any* text analysis, dictionaries should only be loaded for languages detected in the text, not all available languages.
**Validates: Requirements 7.5**

### Property 24: Offscreen Document Creation
*For any* clipboard correction operation, the Extension should create an Offscreen Document with reason 'CLIPBOARD' to access the clipboard API.
**Validates: Requirements 8.1, 8.2**

### Property 25: Offscreen Document Cleanup
*For any* Offscreen Document created, it should be closed within 30 seconds after completing its task to free resources.
**Validates: Requirements 8.3**

### Property 26: Clipboard Text Sanitization
*For any* text written to the clipboard, the Extension should sanitize the text to remove potentially malicious content (XSS prevention).
**Validates: Requirements 8.4**

### Property 27: Clipboard Error Handling
*For any* clipboard write operation that fails, the Extension should display an error notification to the user.
**Validates: Requirements 8.5**

### Property 28: Clipboard Access Without User Gesture
*For any* clipboard write operation in clipboard mode, the Extension should successfully write to the clipboard without requiring a user gesture on the current page.
**Validates: Requirements 8.6**

## Error Handling

### Input Field Errors

**Scenario**: Input field becomes unavailable during processing
- **Handling**: Gracefully abort current analysis and remove event listeners
- **Recovery**: Re-attach listeners when field becomes available again

**Scenario**: Input field contains non-text content (images, rich media)
- **Handling**: Skip grammar checking for non-text content
- **Recovery**: Process only text portions if mixed content

### Grammar Rule Errors

**Scenario**: Grammar rule pattern is invalid (malformed regex)
- **Handling**: Log error to console and skip the invalid rule
- **Recovery**: Continue processing with remaining valid rules

**Scenario**: Grammar rules fail to load
- **Handling**: Disable grammar checking and show notification
- **Recovery**: Retry loading rules on next extension restart

### Language Detection Errors

**Scenario**: Text contains unsupported language
- **Handling**: Mark segment as UNKNOWN language and skip grammar checking
- **Recovery**: Process other segments normally

**Scenario**: Unable to segment mixed-language text
- **Handling**: Treat entire text as single segment with dominant language
- **Recovery**: Apply rules for detected dominant language

### Performance Errors

**Scenario**: Analysis exceeds 50ms timeout
- **Handling**: Abort current analysis and return partial results
- **Recovery**: Switch to "fast" performance mode temporarily

**Scenario**: Too many input fields on page (>50)
- **Handling**: Monitor only visible input fields
- **Recovery**: Attach to additional fields as they become visible

**Scenario**: Web Worker crashes or becomes unresponsive
- **Handling**: Terminate worker and create new instance
- **Recovery**: Reload dictionaries and retry analysis

### WebAssembly Errors

**Scenario**: Wasm module fails to load
- **Handling**: Log error and disable grammar checking
- **Recovery**: Show notification to user, suggest browser update or extension reinstall

**Scenario**: Wasm module throws runtime error
- **Handling**: Catch error in Web Worker, log details
- **Recovery**: Restart Web Worker and retry with fallback (JavaScript-only mode if available)

**Scenario**: Dictionary fails to load into Wasm memory
- **Handling**: Disable checking for that language
- **Recovery**: Retry loading from IndexedDB, or re-hydrate from bundle

**Scenario**: Wasm memory exhausted
- **Handling**: Unload unused dictionaries
- **Recovery**: Request memory growth or switch to single-language mode

### IndexedDB Errors

**Scenario**: IndexedDB not available (private browsing mode)
- **Handling**: Load dictionaries directly from bundle (slower)
- **Recovery**: Show warning about reduced performance

**Scenario**: Dictionary corruption in IndexedDB
- **Handling**: Delete corrupted data
- **Recovery**: Re-hydrate from bundle

**Scenario**: Quota exceeded
- **Handling**: Clear old dictionary versions
- **Recovery**: Request persistent storage permission

### Offscreen Document Errors

**Scenario**: Offscreen Document fails to create
- **Handling**: Log error and show notification
- **Recovery**: Retry once, then fallback to showing correction in popup

**Scenario**: Clipboard write permission denied
- **Handling**: Show error notification with instructions
- **Recovery**: Suggest user to manually copy text from popup

**Scenario**: Offscreen Document doesn't respond
- **Handling**: Timeout after 5 seconds
- **Recovery**: Force close document and show error

**Scenario**: Multiple clipboard requests simultaneously
- **Handling**: Queue requests and process sequentially
- **Recovery**: Reuse existing Offscreen Document if still open

### Correction Application Errors

**Scenario**: Unable to apply correction (field is readonly)
- **Handling**: Show correction suggestion without auto-applying
- **Recovery**: Allow manual copy of correction

**Scenario**: Cursor position cannot be determined
- **Handling**: Apply correction and place cursor at end of corrected text
- **Recovery**: No recovery needed, acceptable fallback behavior

## Testing Strategy

### Unit Testing

The extension will use **Jest** as the testing framework for unit tests. Unit tests will cover:

1. **Language Detection**
   - Test character range detection for Thai, English, Japanese
   - Test segmentation of mixed-language text
   - Test edge cases: empty strings, special characters, emojis

2. **Rule Matching**
   - Test regex pattern matching for each language
   - Test rule loading and parsing
   - Test error identification from matches

3. **Correction Generation**
   - Test correction logic for different error types
   - Test correction string generation
   - Test confidence scoring

4. **Correction Mode Handling**
   - Test inline correction application
   - Test clipboard correction with notification
   - Test mode switching behavior
   - Test default mode initialization

5. **Input Monitoring**
   - Test field observation and text extraction
   - Test debouncing logic
   - Test cursor position tracking

6. **UI Controller**
   - Test highlight creation and removal
   - Test inline correction application
   - Test clipboard operations
   - Test notification display
   - Test cursor position preservation

### Property-Based Testing

The extension will use **fast-check** (JavaScript/TypeScript property-based testing library) for property-based tests. Each property-based test will run a minimum of 100 iterations.

**Property-Based Test Requirements:**
- Each test must be tagged with a comment referencing the correctness property: `// Feature: grammar-checker-extension, Property X: [property text]`
- Each correctness property must be implemented by a single property-based test
- Tests should generate random inputs covering the full input space
- Tests should verify universal properties hold across all generated inputs

**Property-Based Tests to Implement:**

1. **Error Detection Completeness** (Property 1)
   - Generate random text with known grammar errors
   - Verify all errors matching rules are detected

2. **Error Highlighting Completeness** (Property 2)
   - Generate random error sets
   - Verify all errors have corresponding DOM highlights

3. **Re-analysis Triggers** (Property 3)
   - Generate random text modifications
   - Verify analysis is triggered for each modification

4. **Correction Availability** (Property 4)
   - Generate random grammar errors
   - Verify each error has at least one correction

5. **Correction Mode Configuration** (Property 5)
   - Verify settings include correctionMode field
   - Verify default value is 'inline'

6. **Inline Correction Application** (Property 6)
   - Generate random errors with inline mode
   - Verify corrections are applied to input field

7. **Clipboard Correction Application** (Property 7)
   - Generate random errors with clipboard mode
   - Verify text is copied to clipboard and notification shown

8. **Clipboard Mode Non-Modification** (Property 8)
   - Generate random corrections in clipboard mode
   - Verify original text remains unchanged

9. **Text Preservation During Inline Correction** (Property 9)
   - Generate random text with errors at random positions
   - Verify only error portion is modified after inline correction

10. **Cursor Position Adjustment** (Property 10)
    - Generate random inline corrections with length changes
    - Verify cursor position is adjusted correctly

11. **Language-Specific Rules** (Property 11)
    - Generate random text in each language
    - Verify only appropriate language rules are applied

12. **Mixed Language Segmentation** (Property 12)
    - Generate random mixed-language text
    - Verify complete and non-overlapping segmentation

13. **Character-Based Detection** (Property 13)
    - Generate random characters from different Unicode ranges
    - Verify language detection uses only character range checks

14. **Content Script Injection** (Property 14)
    - Generate random DOM structures with input fields
    - Verify content scripts attach to all fields

15. **Rule-Based Processing** (Property 15)
    - Monitor Grammar Engine operations
    - Verify no ML/AI library calls are made

16. **Local Processing** (Property 16)
    - Monitor network activity during grammar checking
    - Verify no external API calls are made

17. **Performance Bound** (Property 17)
    - Generate random text inputs of varying lengths
    - Verify analysis completes within 50ms after debounce

18. **Debounced Processing** (Property 18)
    - Generate rapid input event sequences
    - Verify only final event triggers analysis

19. **Non-Blocking Execution** (Property 19)
    - Generate grammar checking operations
    - Verify input events are not delayed

20. **WebAssembly Performance** (Property 20)
    - Generate text inputs of varying complexity
    - Verify Wasm-based analysis completes within 50ms

21. **Web Worker Isolation** (Property 21)
    - Monitor main thread during analysis
    - Verify no blocking operations on main thread

22. **Dictionary Memory Efficiency** (Property 22)
    - Load all dictionaries
    - Verify total memory usage <= 50MB

23. **Lazy Dictionary Loading** (Property 23)
    - Analyze text with single language
    - Verify only that language's dictionary is loaded

24. **Offscreen Document Creation** (Property 24)
    - Trigger clipboard correction
    - Verify Offscreen Document created with reason 'CLIPBOARD'

25. **Offscreen Document Cleanup** (Property 25)
    - Create Offscreen Document
    - Verify it closes within 30 seconds

26. **Clipboard Text Sanitization** (Property 26)
    - Generate text with potential XSS payloads
    - Verify sanitization before clipboard write

27. **Clipboard Error Handling** (Property 27)
    - Simulate clipboard write failure
    - Verify error notification is displayed

28. **Clipboard Access Without User Gesture** (Property 28)
    - Trigger clipboard write without page interaction
    - Verify successful write via Offscreen Document

### Integration Testing

Integration tests will verify:
- Extension loads correctly in Chrome and Edge
- Content scripts inject into real web pages
- Grammar checking works on common websites (Gmail, Google Docs, etc.)
- Settings persist across browser sessions
- Extension updates don't break functionality

### Browser Compatibility Testing

Manual testing will verify:
- Chrome (latest version) - all features work
- Edge (latest version) - all features work
- Manifest V3 compatibility
- Extension permissions are minimal and appropriate

## WebAssembly Integration

### Compilation and Loading

**Build Process:**
```bash
# Compile Rust to Wasm
cargo build --target wasm32-unknown-unknown --release

# Optimize with wasm-opt
wasm-opt -Oz -o nlp_kernel.wasm target/wasm32-unknown-unknown/release/nlp_kernel.wasm

# Compress with Brotli
brotli -q 11 nlp_kernel.wasm
```

**Loading in Extension:**
```typescript
// In Web Worker
async function loadWasmModule() {
  const response = await fetch(chrome.runtime.getURL('wasm/nlp_kernel.wasm'));
  const buffer = await response.arrayBuffer();
  const module = await WebAssembly.instantiate(buffer, {
    env: {
      // Import functions for logging, memory allocation, etc.
      log: (ptr: number, len: number) => console.log(readString(ptr, len)),
    }
  });
  return module.instance.exports;
}
```

**Content Security Policy (CSP):**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
}
```

### Memory Management

- **Linear Memory**: Wasm module มี linear memory สำหรับเก็บพจนานุกรม DAT
- **SharedArrayBuffer**: ใช้สำหรับแชร์ข้อมูลระหว่าง Web Worker และ Wasm (ถ้าเบราว์เซอร์รองรับ)
- **Memory Growth**: กำหนด initial memory และ maximum memory ใน Wasm module
- **Garbage Collection**: JavaScript wrapper จัดการ lifecycle ของ Wasm instances

## Implementation Notes

### Performance Optimizations

1. **WebAssembly for NLP**: ใช้ Wasm สำหรับ tokenization และ rule matching (10-100x เร็วกว่า JS)
2. **Double-Array Trie**: O(1) dictionary lookup per character (vs O(log n) for trees)
3. **Lazy Dictionary Loading**: โหลดพจนานุกรมเฉพาะภาษาที่ตรวจพบ
4. **Incremental Analysis**: วิเคราะห์เฉพาะส่วนที่แก้ไข (ถ้าเป็นไปได้)
5. **Web Worker**: ประมวลผลหนักใน worker แยก (non-blocking UI)
6. **Rule Caching**: Cache compiled regex patterns ใน memory
7. **Debouncing**: รอ 300ms หลังจากพิมพ์สุดท้ายก่อนวิเคราะห์
8. **Keep-Alive Strategy**: รักษา Service Worker และ Web Worker ให้ทำงานต่อเนื่อง
9. **IndexedDB Caching**: เก็บพจนานุกรมใน IndexedDB แทนการโหลดจาก bundle ทุกครั้ง
10. **Brotli Compression**: บีบอัดพจนานุกรมและ Wasm modules (20-30% ดีกว่า Gzip)

### Language-Specific Implementation Details

#### Thai Language Processing

**Tokenization Algorithm**: Maximal Matching with Backtracking
```rust
fn tokenize_thai(text: &str, dict: &DAT) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut pos = 0;
    
    while pos < text.len() {
        let mut best_match = None;
        let mut best_len = 0;
        
        // Lookahead: find longest match
        for len in (1..=MAX_WORD_LEN).rev() {
            if pos + len > text.len() { continue; }
            let candidate = &text[pos..pos+len];
            if dict.lookup(candidate).is_some() {
                // Verify: can we continue after this match?
                if can_continue(text, pos + len, dict) {
                    best_match = Some(candidate);
                    best_len = len;
                    break;
                }
            }
        }
        
        if let Some(word) = best_match {
            tokens.push(Token { text: word.to_string(), start: pos, end: pos + best_len });
            pos += best_len;
        } else {
            // Unknown word: take single character
            tokens.push(Token { text: text[pos..pos+1].to_string(), start: pos, end: pos + 1 });
            pos += 1;
        }
    }
    
    tokens
}
```

**Grammar Rules (10-15 rules)**:
- Spacing errors (e.g., "ได้ รับ" → "ได้รับ")
- Common word order mistakes (e.g., "ไป ที่ ไหน" → "ไปไหน")
- Redundant words (e.g., "ได้ทำการ" → "ทำ")
- Incorrect tone marks
- Wrong vowel placement

**Dictionary**: Lexitron (NECTEC) - 40,000+ words
- Stored as DAT: ~8MB compressed
- Includes POS tags and frequency data

#### Japanese Language Processing

**Tokenization**: Lindera (Rust morphological analyzer)
```rust
use lindera::tokenizer::Tokenizer;

fn tokenize_japanese(text: &str) -> Vec<Token> {
    let tokenizer = Tokenizer::new().unwrap();
    let tokens = tokenizer.tokenize(text).unwrap();
    
    tokens.iter().map(|t| Token {
        text: t.text.clone(),
        start: t.byte_start,
        end: t.byte_end,
        pos: Some(t.detail[0].clone()), // Part-of-speech
        features: Some(t.detail.clone()), // Full morphological features
    }).collect()
}
```

**Grammar Rules (10-15 rules)**:
- Particle usage errors (e.g., "を" vs "が")
- Double particle errors (e.g., "には" repeated)
- Hiragana/Katakana consistency
- Common kanji mistakes
- Verb conjugation errors
- Honorific usage

**Dictionary**: IPADIC (compact version)
- Stored as DAT: ~12MB compressed
- Includes detailed morphological information

#### English Language Processing

**Tokenization**: Simple whitespace + punctuation
**POS Tagging**: Brill Tagger (rule-based transformation)
```rust
fn tag_english(tokens: &[Token]) -> Vec<Token> {
    let mut tagged = initial_tag(tokens); // Assign most common POS
    
    // Apply transformation rules
    for rule in TRANSFORMATION_RULES {
        apply_rule(&mut tagged, rule);
    }
    
    tagged
}

// Example transformation rule:
// "If previous word is 'the', change tag from VB to NN"
```

**Grammar Rules (15-20 rules)**:
- Subject-verb agreement (e.g., "He go" → "He goes")
- Article usage (a/an/the)
- Common spelling mistakes
- Double spaces
- Comma splices
- Sentence fragments
- Passive voice detection (optional)

**Dictionary**: Wiktionary + Hunspell
- Stored as DAT: ~6MB compressed
- Includes word frequency and common misspellings

### Grammar Rule Development

Rules are stored as JSON and compiled to regex patterns at runtime. Each rule includes:
- **id**: Unique identifier (e.g., "th_001", "en_015")
- **pattern**: Regex pattern (compiled and cached)
- **errorType**: Category (spacing, word_order, agreement, etc.)
- **message**: User-friendly explanation
- **correction**: Replacement string or function
- **severity**: "error" or "warning"
- **enabled**: Boolean flag for easy disable

Rules can be expanded over time based on user feedback and common error patterns. The modular design allows adding new rules without modifying core code.

### Extension Manifest V3 Structure

```json
{
  "manifest_version": 3,
  "name": "Grammar Checker",
  "version": "1.0.0",
  "description": "Offline grammar checker for Thai, English, and Japanese (no AI)",
  
  "permissions": [
    "storage",
    "activeTab",
    "offscreen",
    "clipboardWrite",
    "contextMenus"
  ],
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": [
        "rules/*.json",
        "wasm/*.wasm",
        "dictionaries/*.dat.br",
        "offscreen.html"
      ],
      "matches": ["<all_urls>"]
    }
  ],
  
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Technology Stack

**Frontend (Extension):**
- **Language**: TypeScript
- **Build Tool**: Vite (faster than Webpack, better Wasm support)
- **Testing**: Jest + fast-check (property-based testing)
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Package Manager**: pnpm (faster, more efficient)

**NLP Kernel (WebAssembly):**
- **Language**: Rust
- **Target**: wasm32-unknown-unknown
- **Libraries**:
  - Thai: Custom implementation based on LibThai algorithm
  - Japanese: Lindera (Rust morphological analyzer)
  - English: Custom rule-based engine
- **Build**: cargo + wasm-pack or wasm-bindgen
- **Optimization**: wasm-opt (Binaryen)

**Data Processing:**
- **Dictionary Format**: Double-Array Trie (DAT)
- **Compression**: Brotli
- **Storage**: IndexedDB (via idb library)
- **Binary Parsing**: DataView / TypedArrays

**Development Tools:**
- **Wasm Debugging**: Chrome DevTools + source maps
- **Performance Profiling**: Chrome Performance tab + Wasm profiler
- **Extension Testing**: Chrome Extension Test Framework
