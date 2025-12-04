# Edge Extension Testing Guide

## Task 16.4: Test Extension in Edge

This guide provides step-by-step instructions for manually testing the Grammar Checker Extension in Microsoft Edge.

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

3. **Microsoft Edge** installed (latest version recommended)

---

## Part 1: Load Extension in Edge

### Steps:

1. Open Microsoft Edge browser
2. Navigate to `edge://extensions/`
3. Enable **Developer mode** (toggle in bottom-left corner)
4. Click **Load unpacked**
5. Select the `dist/` folder from this project
6. Verify the extension appears in the list with:
   - Name: "Grammar Checker Extension"
   - Status: Enabled
   - No errors in the console

### Expected Result:

✅ Extension loads successfully without errors
✅ Extension icon appears in Edge toolbar

### Edge-Specific Notes:

- Edge uses the same Chromium engine as Chrome, so compatibility should be high
- Edge may show additional security prompts - approve them for testing
- Edge extensions page layout is slightly different from Chrome but functionality is the same

---

## Part 2: Test on Common Websites

### 2.1 Outlook Web (outlook.com)

**Test Scenarios:**

1. **Compose New Email**
   - Navigate to Outlook.com
   - Click "New message"
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
- [ ] No conflicts with Outlook's built-in editor

---

### 2.2 Microsoft Office Online (office.com)

**Test Scenarios:**

1. **Word Online**
   - Navigate to office.com
   - Open or create a Word document
   - Type test content (contenteditable element)

   **Test Mixed Languages:**

   ```
   Hello world ไป ที่ ไหน こんにちは
   ```

   Expected: Should detect and check each language segment separately

2. **OneNote Online**
   - Open OneNote
   - Create a new note
   - Test grammar checking

3. **Performance Test**
   - Type continuously for 30 seconds
   - Verify no lag or freezing
   - Check Edge task manager (Shift+Esc) for memory usage

**Checklist:**

- [ ] Grammar checking works in Word Online
- [ ] Grammar checking works in OneNote
- [ ] Mixed language detection works
- [ ] No typing lag
- [ ] Memory usage < 50MB (check in Edge Task Manager)
- [ ] No conflicts with Microsoft Editor

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

### 2.4 LinkedIn (linkedin.com)

**Test Scenarios:**

1. **Create Post**
   - Click "Start a post"
   - Type in post box (contenteditable)
   - Test with various languages

2. **Comment on Post**
   - Comment on any post
   - Verify grammar checking

3. **Send Message**
   - Open LinkedIn messaging
   - Test grammar checking in message compose

**Checklist:**

- [ ] Grammar checking works in post creation
- [ ] Grammar checking works in comments
- [ ] Grammar checking works in messages
- [ ] No conflicts with LinkedIn's UI

---

## Part 3: Test Different Input Element Types

### 3.1 Textarea Elements

**Test Page:** Use the provided `test-page.html`

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

**Test:**

1. Type text with grammar errors
2. Verify highlighting appears

**Checklist:**

- [ ] Grammar checking works in input fields
- [ ] Errors highlighted correctly

---

### 3.3 Contenteditable Elements

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

4. **Test Offscreen Document (Edge-Specific)**
   - Open Edge DevTools (F12)
   - Go to Application → Service Workers
   - Verify Offscreen Document is created and closed properly
   - **Note**: Edge may handle Offscreen Documents slightly differently than Chrome

**Checklist:**

- [ ] Clipboard mode does NOT modify original text
- [ ] Corrected text copied to clipboard
- [ ] Notification displayed
- [ ] Offscreen Document created with reason 'CLIPBOARD'
- [ ] Offscreen Document closes after operation
- [ ] Clipboard API works in Edge without user gesture

---

## Part 6: Verify Performance (Analysis < 50ms)

### Steps:

1. **Enable Performance Monitoring**
   - Open Edge DevTools (F12)
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

**Edge-Specific Performance Notes:**

- Edge may have slightly different performance characteristics than Chrome
- Monitor Edge-specific memory management
- Check for any Edge-specific optimizations or issues

**Checklist:**

- [ ] Analysis completes in < 50ms (after debounce)
- [ ] No typing lag
- [ ] Main thread not blocked
- [ ] Web Worker used for processing
- [ ] Performance comparable to Chrome

---

## Part 7: Verify Memory Usage (<50MB)

### Steps:

1. **Open Edge Task Manager**
   - Press Shift+Esc in Edge
   - Or: Menu (•••) → More tools → Browser task manager

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

**Edge-Specific Memory Notes:**

- Edge may report memory usage slightly differently than Chrome
- Monitor for Edge-specific memory leaks
- Verify IndexedDB implementation works correctly in Edge

**Checklist:**

- [ ] Memory usage < 50MB
- [ ] Lazy dictionary loading works
- [ ] No memory leaks over time
- [ ] IndexedDB contains dictionaries
- [ ] Memory usage comparable to Chrome

---

## Part 8: Cross-Browser Compatibility Tests

### 8.1 Compare with Chrome Behavior

**Test:**

1. Load extension in both Chrome and Edge
2. Test same scenarios in both browsers
3. Compare results

**Verify:**

- [ ] Same features work in both browsers
- [ ] Performance is comparable
- [ ] UI rendering is consistent
- [ ] No Edge-specific bugs

---

### 8.2 Edge-Specific Features

**Test:**

1. **Edge Collections**
   - Add page to collection
   - Verify extension still works

2. **Edge Sidebar**
   - Open Edge sidebar
   - Test grammar checking in sidebar apps

3. **Edge Reading Mode**
   - Enter reading mode
   - Verify extension behavior

**Checklist:**

- [ ] Extension works with Edge Collections
- [ ] Extension works in Edge sidebar
- [ ] Extension handles reading mode gracefully

---

### 8.3 Test Language Detection

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
- [ ] Same behavior as Chrome

---

### 8.4 Test Debouncing

**Steps:**

1. Type rapidly without pausing
2. Verify analysis doesn't trigger on every keystroke
3. Stop typing
4. Wait 300ms
5. Verify analysis triggers once

**Checklist:**

- [ ] Debouncing works (300ms delay)
- [ ] Only final input triggers analysis
- [ ] Same behavior as Chrome

---

### 8.5 Test Multiple Input Fields

**Steps:**

1. Open test-page.html with multiple fields
2. Click in field1, type text
3. Click in field2, type text
4. Click in field3, type text
5. Verify only active field is monitored

**Checklist:**

- [ ] Only active field monitored
- [ ] Switching fields works correctly
- [ ] No resource waste on inactive fields

---

## Part 9: Test Error Scenarios

### 9.1 Edge-Specific Error Handling

**Test:**

1. **Edge Enhanced Security Mode**
   - Enable Enhanced Security in Edge settings
   - Verify extension still works

2. **Edge Tracking Prevention**
   - Test with different tracking prevention levels
   - Verify no interference with extension

3. **Edge SmartScreen**
   - Verify SmartScreen doesn't block extension functionality

**Checklist:**

- [ ] Works with Enhanced Security enabled
- [ ] Works with Tracking Prevention
- [ ] No SmartScreen conflicts

---

### 9.2 General Error Scenarios

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

## Part 10: Browser Compatibility Verification

### Steps:

1. **Check Manifest V3 Compliance**
   - Open `dist/manifest.json`
   - Verify `"manifest_version": 3`
   - Verify Edge-compatible permissions

2. **Check Service Worker**
   - Go to `edge://extensions/`
   - Click "Service Worker" link under extension
   - Verify no errors in console

3. **Check Permissions**
   - Verify extension requests appropriate permissions
   - No excessive permissions
   - Edge accepts all requested permissions

4. **Check WebAssembly Support**
   - Verify Wasm modules load correctly in Edge
   - Check CSP allows 'wasm-unsafe-eval'
   - Test Wasm performance

**Checklist:**

- [ ] Manifest V3 format compatible with Edge
- [ ] Service Worker runs without errors in Edge
- [ ] All permissions granted by Edge
- [ ] WebAssembly works correctly in Edge

---

## Part 11: Final Verification

### Complete Feature Checklist:

- [ ] Extension loads in Edge without errors
- [ ] Grammar checking works on Outlook Web
- [ ] Grammar checking works on Office Online
- [ ] Grammar checking works on Twitter/X
- [ ] Grammar checking works on LinkedIn
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
- [ ] Cross-browser compatibility with Chrome verified
- [ ] Edge-specific features don't interfere

---

## Troubleshooting

### Extension Won't Load in Edge

- Check for errors in `edge://extensions/`
- Verify all files exist in `dist/` folder
- Rebuild: `npm run build`
- Check Edge version (should be latest)

### Grammar Checking Not Working

- Check Service Worker console for errors
- Verify dictionaries loaded in IndexedDB
- Check Web Worker is running
- Compare with Chrome behavior

### Performance Issues

- Check Edge Task Manager for memory usage
- Verify Web Worker is being used
- Check for console errors
- Compare with Chrome performance

### Clipboard Mode Not Working in Edge

- Verify Offscreen Document permission in manifest
- Check Service Worker console for errors
- Verify clipboard permission granted
- Test if Edge handles clipboard API differently

### Edge-Specific Issues

- Check Edge version compatibility
- Verify Enhanced Security mode settings
- Check Tracking Prevention settings
- Review Edge-specific console errors

---

## Reporting Results

After completing all tests, document:

1. **Passed Tests**: List all features that work correctly in Edge
2. **Failed Tests**: List any features that don't work in Edge
3. **Performance Metrics**:
   - Average analysis time
   - Memory usage
   - Comparison with Chrome
4. **Edge-Specific Issues**: Any Edge-only bugs or differences
5. **Cross-Browser Compatibility**: How Edge compares to Chrome
6. **Browser Version**: Edge version used for testing

---

## Requirements Validation

This testing validates:

- **Requirement 4.2**: Extension functions on Edge browser ✓
- **Cross-browser compatibility**: Works consistently across Chrome and Edge ✓

---

## Comparison with Chrome

### Expected Similarities:

- Same core functionality
- Same performance characteristics
- Same UI rendering
- Same API support (Chromium-based)

### Potential Differences:

- Edge-specific UI elements
- Slightly different extension management
- Edge-specific security features
- Different default settings

---

## Next Steps

After completing Edge testing:

- Proceed to Task 16.5: Test WebAssembly functionality
- Document any Edge-specific issues found
- Fix critical cross-browser bugs
- Update documentation with Edge-specific notes

---

## Quick Start Commands

```bash
# Verify build is ready
node scripts/verify-build.js

# Open test page in Edge
start msedge test-page.html

# Open Edge extensions page
start edge://extensions/
```

---

## Testing Resources

- **This Guide**: `EDGE_TESTING_GUIDE.md`
- **Test Page**: `test-page.html`
- **Checklist**: `TESTING_CHECKLIST.md` (can be reused)
- **Build Verification**: `scripts/verify-build.js`
- **Chrome Comparison**: `CHROME_TESTING_GUIDE.md`

---

## Important Notes

1. **Edge uses Chromium engine** - Most features should work identically to Chrome
2. **Test Edge-specific features** - Collections, sidebar, reading mode, etc.
3. **Compare with Chrome** - Document any differences in behavior
4. **Monitor Edge-specific security** - Enhanced Security, SmartScreen, etc.
5. **Document everything** - Use checklist to track all results

---

## Support

If you encounter issues during testing:

1. Check the Troubleshooting section above
2. Compare behavior with Chrome
3. Review Service Worker console for errors
4. Check Web Worker console for processing errors
5. Verify IndexedDB contains dictionaries
6. Ensure all files are present in `dist/` folder
7. Check Edge-specific settings and features

---

## Conclusion

The extension has been tested in Chrome and is ready for Edge testing. Since Edge uses the Chromium engine, compatibility should be high, but Edge-specific features and settings need verification.

**Status**: Ready for manual testing in Edge
**Next Task**: 16.5 Test WebAssembly functionality (after completing this task)
