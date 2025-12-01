# Chrome Extension Testing Guide

## Task 16.3: Test Extension in Chrome

This guide provides step-by-step instructions for manually testing the Grammar Checker Extension in Chrome.

---

## Prerequisites

1. **Build the extension** (if not already built):
   ```bash
   npm run build
   ```

2. **Verify build output** in `dist/` folder contains:
   - manifest.json
   - background.js
   - content.js
   - worker.js
   - offscreen.js
   - dictionaries/ folder
   - rules/ folder
   - wasm/ folder

---

## Part 1: Load Extension in Chrome

### Steps:

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `dist/` folder from this project
6. Verify the extension appears in the list with:
   - Name: "Grammar Checker Extension"
   - Status: Enabled
   - No errors in the console

### Expected Result:
✅ Extension loads successfully without errors
✅ Extension icon appears in Chrome toolbar

---

## Part 2: Test on Common Websites

### 2.1 Gmail (gmail.com)

**Test Scenarios:**

1. **Compose New Email**
   - Navigate to Gmail
   - Click "Compose"
   - Type in the email body (contenteditable element)
   
   **Test Thai:**
   ```
   ไป ที่ ไหน
   ```
   Expected: Should highlight "ไป ที่ ไหน" as error (should be "ไปไหน")

   **Test English:**
   ```
   He go to school
   ```
   Expected: Should highlight "go" as error (should be "goes")

   **Test Japanese:**
   ```
   私はりんごを食べるです
   ```
   Expected: Should highlight grammar error if rules detect it

2. **Subject Line**
   - Type in subject field (input element)
   - Verify grammar checking works

3. **Reply to Email**
   - Open an email and click Reply
   - Test grammar checking in reply box

**Checklist:**
- [ ] Grammar checking works in compose body
- [ ] Grammar checking works in subject line
- [ ] Grammar checking works in reply box
- [ ] Errors are highlighted visually
- [ ] No performance lag while typing

---

### 2.2 Google Docs (docs.google.com)

**Test Scenarios:**

1. **Create New Document**
   - Navigate to Google Docs
   - Create a new document
   - Type test content (contenteditable element)

   **Test Mixed Languages:**
   ```
   Hello world ไป ที่ ไหน こんにちは
   ```
   Expected: Should detect and check each language segment separately

2. **Performance Test**
   - Type continuously for 30 seconds
   - Verify no lag or freezing
   - Check browser task manager (Shift+Esc) for memory usage

**Checklist:**
- [ ] Grammar checking works in Google Docs
- [ ] Mixed language detection works
- [ ] No typing lag
- [ ] Memory usage < 50MB (check in Chrome Task Manager)

---

### 2.3 Twitter/X (twitter.com or x.com)

**Test Scenarios:**

1. **Compose Tweet**
   - Click "Post" or "What's happening?"
   - Type in tweet box (contenteditable or textarea)
   
   **Test Thai:**
   ```
   ได้ รับ ข่าวสาร
   ```
   Expected: Should highlight "ได้ รับ" (should be "ได้รับ")

2. **Reply to Tweet**
   - Reply to any tweet
   - Test grammar checking

**Checklist:**
- [ ] Grammar checking works in tweet compose
- [ ] Grammar checking works in replies
- [ ] Highlights appear correctly over text

---

### 2.4 Facebook (facebook.com)

**Test Scenarios:**

1. **Create Post**
   - Click "What's on your mind?"
   - Type in post box (contenteditable)
   - Test with various languages

2. **Comment on Post**
   - Comment on any post
   - Verify grammar checking

**Checklist:**
- [ ] Grammar checking works in post creation
- [ ] Grammar checking works in comments
- [ ] No conflicts with Facebook's own UI

---

## Part 3: Test Different Input Element Types

### 3.1 Textarea Elements

**Test Page:** Create a simple HTML file or use JSFiddle

```html
<!DOCTYPE html>
<html>
<body>
  <h2>Textarea Test</h2>
  <textarea rows="10" cols="50" placeholder="Type here..."></textarea>
</body>
</html>
```

**Test:**
1. Type Thai text with errors
2. Type English text with errors
3. Type Japanese text with errors
4. Verify Mirror Div technique is used (check DevTools)

**Checklist:**
- [ ] Grammar checking works in textarea
- [ ] Errors highlighted correctly
- [ ] Mirror div created in DOM (inspect with DevTools)

---

### 3.2 Input Elements

**Test Page:**

```html
<!DOCTYPE html>
<html>
<body>
  <h2>Input Test</h2>
  <input type="text" placeholder="Type here..." style="width: 500px;">
</body>
</html>
```

**Test:**
1. Type text with grammar errors
2. Verify highlighting appears

**Checklist:**
- [ ] Grammar checking works in input fields
- [ ] Errors highlighted correctly

---

### 3.3 Contenteditable Elements

**Test Page:**

```html
<!DOCTYPE html>
<html>
<body>
  <h2>Contenteditable Test</h2>
  <div contenteditable="true" style="border: 1px solid black; padding: 10px; min-height: 200px;">
    Type here...
  </div>
</body>
</html>
```

**Test:**
1. Type text with grammar errors
2. Verify Range API technique is used (check DevTools)

**Checklist:**
- [ ] Grammar checking works in contenteditable
- [ ] Errors highlighted correctly
- [ ] Range API used for positioning

---

## Part 4: Test Inline Correction Mode

### Steps:

1. **Verify Default Mode**
   - Extension should default to inline correction mode
   - Check settings (click extension icon → settings)

2. **Test Inline Correction**
   - Type text with error: `ไป ที่ ไหน`
   - Click on the highlighted error
   - Select the correction suggestion
   - Verify text is replaced inline: `ไปไหน`

3. **Test Cursor Position**
   - Place cursor before error
   - Apply correction
   - Verify cursor moves appropriately

4. **Test Text Preservation**
   - Type: `Hello ไป ที่ ไหน world`
   - Apply correction to middle error
   - Verify: `Hello ไปไหน world` (surrounding text unchanged)

**Checklist:**
- [ ] Inline correction replaces text directly
- [ ] Cursor position adjusted correctly
- [ ] Surrounding text preserved
- [ ] No page refresh or reload

---

## Part 5: Test Clipboard Correction Mode

### Steps:

1. **Switch to Clipboard Mode**
   - Click extension icon
   - Open settings/popup
   - Change correction mode to "Copy to Clipboard"

2. **Test Clipboard Correction**
   - Type text with error: `ได้ รับ`
   - Click on the highlighted error
   - Select the correction suggestion
   - Verify:
     - Notification appears: "Copied to clipboard"
     - Original text in field is UNCHANGED
     - Clipboard contains corrected text: `ได้รับ`

3. **Test Clipboard Content**
   - After correction, paste (Ctrl+V) in another field
   - Verify pasted text is the corrected version

4. **Test Offscreen Document**
   - Open Chrome DevTools
   - Go to Application → Service Workers
   - Verify Offscreen Document is created and closed properly

**Checklist:**
- [ ] Clipboard mode does NOT modify original text
- [ ] Corrected text copied to clipboard
- [ ] Notification displayed
- [ ] Offscreen Document created with reason 'CLIPBOARD'
- [ ] Offscreen Document closes after operation

---

## Part 6: Verify Performance (Analysis < 50ms)

### Steps:

1. **Enable Performance Monitoring**
   - Open Chrome DevTools (F12)
   - Go to Console tab
   - Look for performance logs from extension

2. **Test Analysis Speed**
   - Type text in any input field
   - Wait for debounce (300ms)
   - Check console for analysis time
   - Verify: Analysis completes in < 50ms

3. **Test with Large Text**
   - Paste a large block of text (500+ words)
   - Verify analysis still completes quickly
   - Check for any lag or freezing

4. **Performance Profiling**
   - Open DevTools → Performance tab
   - Start recording
   - Type text and trigger grammar check
   - Stop recording
   - Verify main thread is not blocked

**Checklist:**
- [ ] Analysis completes in < 50ms (after debounce)
- [ ] No typing lag
- [ ] Main thread not blocked
- [ ] Web Worker used for processing

---

## Part 7: Verify Memory Usage (<50MB)

### Steps:

1. **Open Chrome Task Manager**
   - Press Shift+Esc in Chrome
   - Or: Menu → More tools → Task Manager

2. **Find Extension Process**
   - Look for "Extension: Grammar Checker Extension"
   - Note the memory usage

3. **Test Memory Under Load**
   - Open multiple tabs with text fields
   - Type in various languages
   - Check memory usage periodically
   - Verify: Total memory < 50MB

4. **Test Dictionary Loading**
   - Type Thai text → Thai dictionary loads
   - Type English text → English dictionary loads
   - Type Japanese text → Japanese dictionary loads
   - Verify: Only detected language dictionaries are loaded (lazy loading)

5. **Check IndexedDB**
   - Open DevTools → Application → IndexedDB
   - Verify dictionaries are stored in IndexedDB
   - Check sizes are reasonable

**Checklist:**
- [ ] Memory usage < 50MB
- [ ] Lazy dictionary loading works
- [ ] No memory leaks over time
- [ ] IndexedDB contains dictionaries

---

## Part 8: Additional Tests

### 8.1 Test Language Detection

**Test Mixed Languages:**
```
Hello world ไปไหน 私は学生です
```

Expected:
- "Hello world" → English rules
- "ไปไหน" → Thai rules
- "私は学生です" → Japanese rules

**Checklist:**
- [ ] Each language segment detected correctly
- [ ] Appropriate rules applied to each segment

---

### 8.2 Test Debouncing

**Steps:**
1. Type rapidly without pausing
2. Verify analysis doesn't trigger on every keystroke
3. Stop typing
4. Wait 300ms
5. Verify analysis triggers once

**Checklist:**
- [ ] Debouncing works (300ms delay)
- [ ] Only final input triggers analysis

---

### 8.3 Test Multiple Input Fields

**Test Page:**
```html
<!DOCTYPE html>
<html>
<body>
  <textarea id="field1"></textarea>
  <textarea id="field2"></textarea>
  <textarea id="field3"></textarea>
</body>
</html>
```

**Steps:**
1. Click in field1, type text
2. Click in field2, type text
3. Click in field3, type text
4. Verify only active field is monitored

**Checklist:**
- [ ] Only active field monitored
- [ ] Switching fields works correctly
- [ ] No resource waste on inactive fields

---

### 8.4 Test Error Scenarios

**Test:**
1. **Readonly Fields**
   - Try grammar checking on readonly input
   - Verify graceful handling

2. **Dynamically Added Fields**
   - Load page
   - Add new textarea via JavaScript
   - Verify extension attaches to new field

3. **Field Removal**
   - Remove input field from DOM
   - Verify no errors in console

**Checklist:**
- [ ] Readonly fields handled gracefully
- [ ] Dynamic fields detected
- [ ] Field removal doesn't cause errors

---

## Part 9: Browser Compatibility Check

### Steps:

1. **Check Manifest V3 Compliance**
   - Open `dist/manifest.json`
   - Verify `"manifest_version": 3`

2. **Check Service Worker**
   - Go to `chrome://extensions/`
   - Click "Service Worker" link under extension
   - Verify no errors in console

3. **Check Permissions**
   - Verify extension requests appropriate permissions
   - No excessive permissions

**Checklist:**
- [ ] Manifest V3 format used
- [ ] Service Worker runs without errors
- [ ] Appropriate permissions only

---

## Part 10: Final Verification

### Complete Feature Checklist:

- [ ] Extension loads in Chrome without errors
- [ ] Grammar checking works on Gmail
- [ ] Grammar checking works on Google Docs
- [ ] Grammar checking works on Twitter/X
- [ ] Grammar checking works on Facebook
- [ ] Textarea elements supported
- [ ] Input elements supported
- [ ] Contenteditable elements supported
- [ ] Inline correction mode works
- [ ] Clipboard correction mode works
- [ ] Performance < 50ms analysis time
- [ ] Memory usage < 50MB
- [ ] Language detection works (Thai, English, Japanese)
- [ ] Mixed language support works
- [ ] Debouncing works (300ms)
- [ ] No typing lag or UI blocking
- [ ] Error highlighting visible and accurate
- [ ] Cursor position maintained during corrections
- [ ] Text preservation during inline corrections
- [ ] Offscreen Document used for clipboard
- [ ] Lazy dictionary loading works
- [ ] IndexedDB storage works
- [ ] WebAssembly modules load correctly
- [ ] Web Worker used for processing
- [ ] No console errors during normal operation

---

## Troubleshooting

### Extension Won't Load
- Check for errors in `chrome://extensions/`
- Verify all files exist in `dist/` folder
- Rebuild: `npm run build`

### Grammar Checking Not Working
- Check Service Worker console for errors
- Verify dictionaries loaded in IndexedDB
- Check Web Worker is running

### Performance Issues
- Check Chrome Task Manager for memory usage
- Verify Web Worker is being used
- Check for console errors

### Clipboard Mode Not Working
- Verify Offscreen Document permission in manifest
- Check Service Worker console for errors
- Verify clipboard permission granted

---

## Reporting Results

After completing all tests, document:

1. **Passed Tests**: List all features that work correctly
2. **Failed Tests**: List any features that don't work
3. **Performance Metrics**: 
   - Average analysis time
   - Memory usage
4. **Issues Found**: Any bugs or unexpected behavior
5. **Browser Version**: Chrome version used for testing

---

## Requirements Validation

This testing validates:
- **Requirement 4.1**: Extension functions on Chrome browser ✓
- **Requirement 6.1**: Analysis completes within 50ms ✓
- **Requirement 7.4**: Memory usage ≤ 50MB ✓

---

## Next Steps

After completing Chrome testing:
- Proceed to Task 16.4: Test extension in Edge
- Document any issues found
- Fix critical bugs before Edge testing
