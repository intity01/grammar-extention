# Requirements Document

## Introduction

Grammar Checker Extension เป็น browser extension สำหรับ Chrome และ Edge ที่ตรวจสอบและแก้ไขข้อผิดพลาดทางไวยากรณ์โดยอัตโนมัติสำหรับภาษาไทย อังกฤษ และญี่ปุ่น โดยไม่ใช้ AI ระบบจะใช้กฎไวยากรณ์ (grammar rules) และพсловารี (dictionary) ในการตรวจสอบและแก้ไข

## Glossary

- **Extension**: โปรแกรมเสริมที่ติดตั้งใน browser เพื่อเพิ่มความสามารถ
- **Grammar Checker**: ระบบตรวจสอบไวยากรณ์ที่ใช้กฎและรูปแบบที่กำหนดไว้
- **Content Script**: JavaScript ที่ทำงานในบริบทของหน้าเว็บ
- **Service Worker**: Background script ที่ทำงานแบบ ephemeral ใน Manifest V3
- **Web Worker**: JavaScript worker thread ที่ทำงานแยกจาก main thread
- **WebAssembly (Wasm)**: Binary instruction format ที่รันได้ในเบราว์เซอร์ด้วยประสิทธิภาพใกล้เคียง native code
- **NLP Kernel**: โมดูลประมวลผลภาษาธรรมชาติที่เขียนด้วย Rust และคอมไพล์เป็น WebAssembly
- **Double-Array Trie (DAT)**: โครงสร้างข้อมูลสำหรับเก็บพจนานุกรมอย่างมีประสิทธิภาพ
- **IndexedDB**: ฐานข้อมูลในเบราว์เซอร์สำหรับเก็บข้อมูลขนาดใหญ่
- **Offscreen Document**: Hidden HTML document ใน MV3 ที่ใช้เข้าถึง DOM APIs เช่น clipboard
- **Text Input Field**: ช่องกรอกข้อความใน web page เช่น textarea, input, contenteditable
- **Grammar Rule**: กฎไวยากรณ์ที่กำหนดรูปแบบที่ถูกต้องและผิดพลาด
- **Correction**: การแก้ไขข้อผิดพลาดที่ตรวจพบ
- **Inline Correction**: การแก้ไขข้อความโดยตรงในช่องกรอกข้อความ
- **Tokenization**: การแบ่งข้อความเป็นหน่วยคำหรือ token
- **POS Tagging**: Part-of-Speech tagging - การระบุหน้าที่ของคำ (noun, verb, etc.)
- **Morphological Analysis**: การวิเคราะห์โครงสร้างและรูปแบบของคำ
- **Maximal Matching**: อัลกอริทึมตัดคำที่เลือกคำที่ยาวที่สุดที่ตรงกับพจนานุกรม
- **Backtracking**: การย้อนกลับเมื่อพบทางตัน เพื่อลองทางเลือกอื่น

## Requirements

### Requirement 1

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ extension ตรวจสอบไวยากรณ์ในช่องกรอกข้อความ เพื่อให้ฉันเห็นข้อผิดพลาดทันทีขณะพิมพ์

#### Acceptance Criteria

1. WHEN a user types text in a Text Input Field THEN the Grammar Checker SHALL analyze the text for grammar errors
2. WHEN the Grammar Checker detects an error THEN the Extension SHALL highlight the error with a visual indicator
3. WHEN multiple errors exist in the text THEN the Grammar Checker SHALL identify and highlight all errors independently
4. WHEN the user modifies highlighted text THEN the Grammar Checker SHALL re-analyze the modified portion immediately

### Requirement 2

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการเลือกวิธีการแก้ไขคำผิดได้ว่าจะให้แก้ทันที (Inline) หรือคัดลอก (Copy/Paste) เพื่อให้ฉันสามารถควบคุมการแก้ไขข้อความได้ตามความถนัดหรือข้อจำกัดของเว็บไซต์นั้นๆ

#### Acceptance Criteria

1. WHEN the Grammar Checker detects an error THEN the Extension SHALL provide a correction suggestion
2. THE Extension SHALL provide a configuration setting for Correction Mode with two options: Inline Correction and Copy to Clipboard
3. THE Extension SHALL default the Correction Mode to Inline Correction upon installation
4. WHEN Inline Correction mode is active AND the user accepts a suggestion THEN the Extension SHALL replace the error with the correction directly in the Text Input Field
5. WHEN Copy to Clipboard mode is active AND the user accepts a suggestion THEN the Extension SHALL copy the corrected text to the system clipboard AND display a notification
6. WHEN Copy to Clipboard mode is active THEN the Extension SHALL NOT modify the content of the Text Input Field automatically
7. WHEN an inline correction is applied THEN the Extension SHALL preserve the remaining text content unchanged
8. WHEN an inline correction is applied THEN the Extension SHALL maintain the cursor position appropriately

### Requirement 3

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ extension รองรับภาษาไทย อังกฤษ และญี่ปุ่น เพื่อให้ฉันสามารถใช้งานกับหลายภาษาได้

#### Acceptance Criteria

1. WHEN the text contains Thai language THEN the Grammar Checker SHALL apply Thai Grammar Rules
2. WHEN the text contains English language THEN the Grammar Checker SHALL apply English Grammar Rules
3. WHEN the text contains Japanese language THEN the Grammar Checker SHALL apply Japanese Grammar Rules
4. WHEN the text contains mixed languages THEN the Grammar Checker SHALL detect each language segment and apply appropriate Grammar Rules to each segment
5. WHEN analyzing text THEN the Grammar Checker SHALL identify the language without using AI-based detection

### Requirement 4

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ extension ทำงานบน Chrome และ Edge เพื่อให้ฉันสามารถใช้งานบน browser ที่ฉันชอบได้

#### Acceptance Criteria

1. WHEN installed on Chrome browser THEN the Extension SHALL function with all specified features
2. WHEN installed on Edge browser THEN the Extension SHALL function with all specified features
3. WHEN the Extension loads THEN the Extension SHALL use Manifest V3 format for compatibility
4. WHEN the Extension runs THEN the Extension SHALL inject Content Script into web pages to monitor Text Input Fields

### Requirement 5

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ระบบตรวจสอบไวยากรณ์โดยไม่ใช้ AI เพื่อให้การทำงานรวดเร็วและไม่ต้องพึ่งพาบริการภายนอก

#### Acceptance Criteria

1. WHEN the Grammar Checker analyzes text THEN the Extension SHALL use rule-based pattern matching exclusively
2. WHEN the Grammar Checker detects errors THEN the Extension SHALL apply predefined Grammar Rules without machine learning
3. WHEN the Extension processes text THEN the Extension SHALL perform all operations locally without external API calls
4. WHEN grammar rules are evaluated THEN the Extension SHALL use regular expressions and dictionary lookups only

### Requirement 6

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ extension ทำงานได้รวดเร็ว เพื่อไม่ให้รบกวนการพิมพ์ของฉัน

#### Acceptance Criteria

1. WHEN the user types continuously THEN the Grammar Checker SHALL complete analysis within 50 milliseconds after debounce period
2. WHEN processing large text blocks THEN the Extension SHALL use debouncing with 300ms delay to optimize performance
3. WHEN multiple Text Input Fields exist on a page THEN the Extension SHALL monitor only the active field to conserve resources
4. WHEN the Grammar Checker runs THEN the Extension SHALL not block user input or cause typing lag
5. WHEN the NLP Kernel processes text THEN the Extension SHALL use WebAssembly for performance-critical operations
6. WHEN the Extension runs THEN the NLP processing SHALL occur in a Web Worker separate from the main thread

### Requirement 7

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้ extension ใช้หน่วยความจำอย่างมีประสิทธิภาพ เพื่อไม่ให้กระทบต่อประสิทธิภาพของเบราว์เซอร์

#### Acceptance Criteria

1. WHEN dictionaries are loaded THEN the Extension SHALL use Double-Array Trie (DAT) data structure for memory efficiency
2. WHEN dictionaries are stored THEN the Extension SHALL compress them with Brotli compression
3. WHEN dictionaries are needed THEN the Extension SHALL load them from IndexedDB instead of bundled files after first installation
4. WHEN the Extension is idle THEN the total memory usage SHALL not exceed 50 MB for all loaded dictionaries
5. WHEN a language is not detected in text THEN the Extension SHALL NOT load the dictionary for that language

### Requirement 8

**User Story:** ในฐานะผู้ใช้งาน ฉันต้องการให้โหมดคัดลอกไปยังคลิปบอร์ดทำงานได้อย่างปลอดภัยภายใต้ Manifest V3 เพื่อให้ฉันสามารถใช้งานได้โดยไม่มีปัญหาด้านความปลอดภัย

#### Acceptance Criteria

1. WHEN Copy to Clipboard mode is active AND the user accepts a correction THEN the Extension SHALL use Offscreen Documents API to access the clipboard
2. WHEN writing to clipboard THEN the Extension SHALL create an Offscreen Document with reason 'CLIPBOARD'
3. WHEN clipboard operation completes THEN the Extension SHALL close the Offscreen Document within 30 seconds to free resources
4. WHEN text is copied to clipboard THEN the Extension SHALL sanitize the text to prevent XSS attacks
5. WHEN clipboard write fails THEN the Extension SHALL display an error notification to the user
6. WHEN the Extension writes to clipboard THEN the Extension SHALL NOT require user gesture on the current page
