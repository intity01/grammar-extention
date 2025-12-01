# Chrome Extension Testing Checklist - Task 16.3

## Testing Date: _______________
## Tester: _______________
## Chrome Version: _______________

---

## ✅ Pre-Testing Setup

- [ ] Extension built successfully (`npm run build`)
- [ ] Build verification passed (`node scripts/verify-build.js`)
- [ ] Extension loaded in Chrome (`chrome://extensions/`)
- [ ] Developer mode enabled
- [ ] No errors in extension console

---

## 📋 Part 1: Load Extension in Chrome

- [ ] Extension appears in extensions list
- [ ] Extension icon visible in toolbar
- [ ] Extension name: "Grammar Checker Extension"
- [ ] Status: Enabled
- [ ] No console errors

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 🌐 Part 2: Test on Common Websites

### Gmail (gmail.com)

- [ ] Grammar checking works in compose body
- [ ] Grammar checking works in subject line
- [ ] Grammar checking works in reply box
- [ ] Errors highlighted visually
- [ ] No performance lag while typing

**Test Results:**
- Thai text test: ☐ Pass ☐ Fail
- English text test: ☐ Pass ☐ Fail
- Japanese text test: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Google Docs (docs.google.com)

- [ ] Grammar checking works in document
- [ ] Mixed language detection works
- [ ] No typing lag
- [ ] Memory usage < 50MB (Chrome Task Manager)

**Test Results:**
- Mixed language test: ☐ Pass ☐ Fail
- Performance test: ☐ Pass ☐ Fail
- Memory usage: _______ MB

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Twitter/X (twitter.com or x.com)

- [ ] Grammar checking works in tweet compose
- [ ] Grammar checking works in replies
- [ ] Highlights appear correctly

**Test Results:**
- Tweet compose: ☐ Pass ☐ Fail
- Reply: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Facebook (facebook.com)

- [ ] Grammar checking works in post creation
- [ ] Grammar checking works in comments
- [ ] No conflicts with Facebook UI

**Test Results:**
- Post creation: ☐ Pass ☐ Fail
- Comments: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 📝 Part 3: Test Different Input Element Types

### Textarea Elements

- [ ] Grammar checking works
- [ ] Errors highlighted correctly
- [ ] Mirror div created (check DevTools)

**Test Results:**
- Thai: ☐ Pass ☐ Fail
- English: ☐ Pass ☐ Fail
- Japanese: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Input Elements

- [ ] Grammar checking works
- [ ] Errors highlighted correctly

**Test Results:**
- Single-line input: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Contenteditable Elements

- [ ] Grammar checking works
- [ ] Errors highlighted correctly
- [ ] Range API used (check DevTools)

**Test Results:**
- Contenteditable: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## ✏️ Part 4: Test Inline Correction Mode

- [ ] Default mode is inline correction
- [ ] Clicking error shows correction
- [ ] Text replaced inline
- [ ] Cursor position adjusted correctly
- [ ] Surrounding text preserved

**Test Cases:**
1. Simple correction: ☐ Pass ☐ Fail
2. Cursor position: ☐ Pass ☐ Fail
3. Text preservation: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 📋 Part 5: Test Clipboard Correction Mode

- [ ] Can switch to clipboard mode
- [ ] Original text unchanged after correction
- [ ] Notification displayed
- [ ] Corrected text in clipboard
- [ ] Can paste corrected text
- [ ] Offscreen Document created
- [ ] Offscreen Document closes properly

**Test Cases:**
1. Clipboard copy: ☐ Pass ☐ Fail
2. Text preservation: ☐ Pass ☐ Fail
3. Notification: ☐ Pass ☐ Fail
4. Offscreen Document: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## ⚡ Part 6: Verify Performance (Analysis < 50ms)

- [ ] Performance monitoring enabled in console
- [ ] Analysis completes in < 50ms (after debounce)
- [ ] No typing lag with large text
- [ ] Main thread not blocked
- [ ] Web Worker used for processing

**Performance Metrics:**
- Average analysis time: _______ ms
- Max analysis time: _______ ms
- Large text (500+ words): _______ ms

**Test Results:**
- Performance target met: ☐ Yes ☐ No

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 💾 Part 7: Verify Memory Usage (<50MB)

- [ ] Chrome Task Manager opened (Shift+Esc)
- [ ] Extension process identified
- [ ] Memory usage < 50MB
- [ ] Lazy dictionary loading works
- [ ] No memory leaks over time
- [ ] IndexedDB contains dictionaries

**Memory Metrics:**
- Initial memory: _______ MB
- After Thai text: _______ MB
- After English text: _______ MB
- After Japanese text: _______ MB
- After 10 minutes: _______ MB

**Test Results:**
- Memory target met: ☐ Yes ☐ No

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 🌍 Part 8: Additional Tests

### Language Detection

- [ ] Thai detected correctly
- [ ] English detected correctly
- [ ] Japanese detected correctly
- [ ] Mixed languages segmented correctly
- [ ] Appropriate rules applied per segment

**Test Results:**
- Language detection: ☐ Pass ☐ Fail
- Mixed language: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Debouncing

- [ ] No analysis during rapid typing
- [ ] Analysis triggers after 300ms pause
- [ ] Only one analysis per typing session

**Test Results:**
- Debouncing: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Multiple Input Fields

- [ ] Only active field monitored
- [ ] Switching fields works correctly
- [ ] No resource waste on inactive fields

**Test Results:**
- Multiple fields: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

### Error Scenarios

- [ ] Readonly fields handled gracefully
- [ ] Dynamic fields detected
- [ ] Field removal doesn't cause errors

**Test Results:**
- Error handling: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 🔧 Part 9: Browser Compatibility Check

- [ ] Manifest V3 format used
- [ ] Service Worker runs without errors
- [ ] Appropriate permissions only
- [ ] No excessive permissions

**Test Results:**
- Manifest V3: ☐ Pass ☐ Fail
- Service Worker: ☐ Pass ☐ Fail
- Permissions: ☐ Pass ☐ Fail

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 📊 Final Summary

### Total Tests: _______
### Passed: _______
### Failed: _______
### Pass Rate: _______%

### Critical Issues Found:
```
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________
```

### Minor Issues Found:
```
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________
```

### Performance Summary:
- Analysis time: ☐ Met target (<50ms) ☐ Failed
- Memory usage: ☐ Met target (<50MB) ☐ Failed
- No typing lag: ☐ Yes ☐ No

### Requirements Validation:
- **Requirement 4.1** (Chrome compatibility): ☐ Pass ☐ Fail
- **Requirement 6.1** (Performance <50ms): ☐ Pass ☐ Fail
- **Requirement 7.4** (Memory <50MB): ☐ Pass ☐ Fail

---

## 🎯 Overall Assessment

☐ **PASS** - Extension ready for Edge testing (Task 16.4)
☐ **FAIL** - Issues must be fixed before proceeding

### Recommendation:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 📝 Additional Notes

```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Tester Signature:** _______________
**Date:** _______________
