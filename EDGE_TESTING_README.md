# Edge Browser Testing - Quick Start Guide

## Overview

This guide helps you quickly get started with testing the Grammar Checker Extension in Microsoft Edge.

---

## Prerequisites

✅ **Completed**: Chrome testing (Task 16.3)  
✅ **Required**: Microsoft Edge browser (latest version)  
✅ **Required**: Extension built (`npm run build`)

---

## Quick Start (5 Minutes)

### 1. Verify Build
```bash
node scripts/verify-build.js
```

### 2. Load Extension in Edge
1. Open Edge: `start edge://extensions/`
2. Enable **Developer mode** (bottom-left toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Verify no errors

### 3. Quick Test
1. Open test page: `start msedge test-page.html`
2. Type in any text field: `ไป ที่ ไหน`
3. Verify error is highlighted
4. Click error and apply correction
5. Verify text changes to: `ไปไหน`

✅ **If this works, the extension is functioning correctly in Edge!**

---

## Full Testing (1.5-2 Hours)

### Step 1: Core Functionality (30 minutes)
Follow `EDGE_TESTING_GUIDE.md` sections:
- Part 1: Load Extension
- Part 2: Test on Websites
- Part 3: Test Input Types
- Part 4: Test Inline Correction
- Part 5: Test Clipboard Correction

### Step 2: Performance Testing (20 minutes)
- Part 6: Verify Performance
- Part 7: Verify Memory Usage

### Step 3: Edge-Specific Testing (20 minutes)
- Part 8: Cross-Browser Compatibility
- Test Edge Collections
- Test Edge Sidebar
- Test Reading Mode
- Test Enhanced Security

### Step 4: Documentation (15 minutes)
- Fill out `EDGE_TESTING_CHECKLIST.md`
- Compare with Chrome results
- Document any issues

---

## What to Test

### ✅ Must Test (Critical)
- [ ] Extension loads without errors
- [ ] Grammar checking works
- [ ] Error highlighting visible
- [ ] Inline correction works
- [ ] Clipboard correction works
- [ ] Performance < 50ms
- [ ] Memory < 50MB

### ✅ Should Test (Important)
- [ ] Works on Outlook Web
- [ ] Works on Office Online
- [ ] Works on LinkedIn
- [ ] Language detection accurate
- [ ] No typing lag

### ✅ Nice to Test (Edge-Specific)
- [ ] Edge Collections compatible
- [ ] Edge Sidebar compatible
- [ ] Reading Mode compatible
- [ ] Enhanced Security compatible

---

## Expected Results

### Should Work Identically to Chrome
- ✓ All core features
- ✓ Performance metrics
- ✓ Memory usage
- ✓ User experience

### Edge-Specific Expectations
- ✓ Works with Edge features
- ✓ No Edge-only bugs
- ✓ Good integration with Microsoft sites

---

## Common Issues & Solutions

### Issue: Extension won't load
**Solution**: 
- Check Edge version (should be 88+)
- Verify Developer mode enabled
- Rebuild: `npm run build`

### Issue: Grammar checking not working
**Solution**:
- Check Service Worker console
- Verify dictionaries in IndexedDB
- Compare with Chrome behavior

### Issue: Performance slower than Chrome
**Solution**:
- Check Edge Task Manager
- Verify Web Worker running
- Document performance difference

### Issue: Clipboard mode not working
**Solution**:
- Check Offscreen Document permission
- Verify Edge clipboard API support
- Test without Enhanced Security first

---

## Testing Resources

| Resource | Purpose | Location |
|----------|---------|----------|
| **Comprehensive Guide** | Detailed testing instructions | `EDGE_TESTING_GUIDE.md` |
| **Checklist** | Track testing progress | `EDGE_TESTING_CHECKLIST.md` |
| **Test Page** | Interactive testing | `test-page.html` |
| **Comparison** | Chrome vs Edge | `CROSS_BROWSER_TESTING_COMPARISON.md` |
| **Build Verification** | Verify build ready | `scripts/verify-build.js` |

---

## Quick Commands

```bash
# Verify build
node scripts/verify-build.js

# Open Edge extensions page
start edge://extensions/

# Open test page in Edge
start msedge test-page.html

# Open Edge Task Manager
# Press Shift+Esc in Edge
```

---

## Testing Checklist Summary

### Core Features
- [ ] Extension loads
- [ ] Grammar checking works
- [ ] Error highlighting
- [ ] Inline correction
- [ ] Clipboard correction

### Performance
- [ ] Analysis < 50ms
- [ ] Memory < 50MB
- [ ] No typing lag

### Edge-Specific
- [ ] Collections compatible
- [ ] Sidebar compatible
- [ ] Reading Mode compatible
- [ ] Enhanced Security compatible

### Cross-Browser
- [ ] Same as Chrome behavior
- [ ] Performance comparable
- [ ] No Edge-only bugs

---

## Success Criteria

### ✅ Pass Criteria
- All core features work
- Performance within targets
- No critical bugs
- Cross-browser compatible

### ⚠️ Acceptable with Notes
- Minor Edge-specific differences
- Slight performance variations
- Cosmetic UI differences

### ❌ Fail Criteria
- Core features broken
- Performance significantly worse
- Critical Edge-only bugs
- Major incompatibilities

---

## After Testing

### If All Tests Pass ✅
1. Mark task 16.4 as complete
2. Proceed to task 16.5 (WebAssembly testing)
3. Document any minor notes

### If Issues Found ⚠️
1. Document issues in checklist
2. Determine severity (critical/major/minor)
3. Fix critical issues
4. Re-test affected functionality

### If Major Incompatibilities ❌
1. Document all issues in detail
2. Compare with Chrome behavior
3. Investigate Edge-specific causes
4. Implement fixes
5. Re-test completely

---

## Key Differences from Chrome

### UI Differences
- Extension management interface
- Developer mode toggle location
- Settings page layout

### Feature Differences
- Edge Collections (unique to Edge)
- Edge Sidebar (unique to Edge)
- Reading Mode (unique to Edge)
- Enhanced Security (unique to Edge)

### Expected Similarities
- All Chrome Extension APIs
- WebAssembly support
- Service Worker behavior
- Performance characteristics

---

## Testing Tips

### 💡 Tip 1: Compare with Chrome
Load extension in both browsers side-by-side to compare behavior

### 💡 Tip 2: Test Microsoft Sites
Edge works best with Outlook, Office Online, LinkedIn

### 💡 Tip 3: Check Edge Features
Test Collections, Sidebar, Reading Mode to ensure no interference

### 💡 Tip 4: Monitor Performance
Use Edge Task Manager (Shift+Esc) to track memory and CPU

### 💡 Tip 5: Document Everything
Use the checklist to track all results and issues

---

## Support & Help

### If You Need Help
1. Check `EDGE_TESTING_GUIDE.md` Troubleshooting section
2. Compare with Chrome behavior
3. Check Service Worker console for errors
4. Review `CROSS_BROWSER_TESTING_COMPARISON.md`

### Common Questions

**Q: Do I need to test everything again?**  
A: Yes, but it should be faster since you know what to expect from Chrome testing.

**Q: What if Edge behaves differently?**  
A: Document the difference and determine if it's acceptable or needs fixing.

**Q: How long should testing take?**  
A: 1.5-2 hours for thorough testing, 30 minutes for quick verification.

**Q: What if I find Edge-specific bugs?**  
A: Document them in the checklist and determine severity before proceeding.

---

## Next Steps

After completing Edge testing:

1. **Task 16.5**: Test WebAssembly functionality
2. **Task 16.6**: Test Offscreen Document functionality
3. **Task 17**: Final checkpoint - ensure all tests pass

---

## Estimated Timeline

| Phase | Time | Description |
|-------|------|-------------|
| **Setup** | 5 min | Load extension, verify build |
| **Core Testing** | 30 min | Basic functionality |
| **Performance** | 20 min | Speed and memory |
| **Edge Features** | 20 min | Collections, Sidebar, etc. |
| **Documentation** | 15 min | Fill out checklist |
| **Total** | ~1.5 hours | Complete testing |

---

## Final Checklist

Before you start:
- [ ] Chrome testing completed (Task 16.3)
- [ ] Extension built successfully
- [ ] Build verified (no errors)
- [ ] Edge browser installed (latest)
- [ ] Testing guides reviewed
- [ ] Checklist ready
- [ ] Ready to begin!

**Ready?** Open `EDGE_TESTING_GUIDE.md` and start testing! 🚀

---

## Requirements Being Validated

- **Requirement 4.2**: Extension functions on Edge browser ✓
- **Cross-browser compatibility**: Works consistently across Chrome and Edge ✓

---

## Contact & Feedback

After testing, document:
- What worked well
- What didn't work
- Edge-specific issues
- Performance comparison
- Recommendations

This feedback helps improve the extension and documentation!
