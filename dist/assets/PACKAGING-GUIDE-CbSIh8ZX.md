# Extension Packaging Guide

Complete guide for packaging the Grammar Checker Extension for store submission.

## 🚀 Quick Start

### One Command Packaging

```bash
npm run build
npm run package
```

This will:

1. Build the extension (if not already built)
2. Validate manifest.json
3. Check required files
4. Verify package size
5. Create `grammar-checker-extension.zip`

## 📋 Prerequisites

### Before Packaging

1. **Build the extension:**

   ```bash
   npm run build
   ```

2. **Verify build succeeded:**
   - Check that `dist/` directory exists
   - Verify `dist/manifest.json` is present
   - Ensure all scripts are compiled

3. **Test the extension:**
   ```bash
   # Load dist/ folder in Chrome
   # chrome://extensions → Load unpacked → Select dist/
   ```

## 📦 Packaging Process

### Automated Packaging (Recommended)

```bash
npm run package
```

The script will:

- ✅ Check if dist/ directory exists
- ✅ Validate manifest.json
- ✅ Verify all required files are present
- ✅ Check package size (<20MB)
- ✅ Create ZIP file
- ✅ Verify ZIP file integrity

### Manual Packaging (Alternative)

If automated packaging fails:

**Windows (PowerShell):**

```powershell
cd dist
Compress-Archive -Path * -DestinationPath ../grammar-checker-extension.zip -Force
```

**macOS/Linux:**

```bash
cd dist
zip -r ../grammar-checker-extension.zip .
```

## ✅ Package Validation

### Required Files Checklist

The package must include:

- [x] `manifest.json` - Extension manifest
- [x] `background.js` - Service worker
- [x] `content.js` - Content script
- [x] `popup.html` - Extension popup
- [x] `popup.js` - Popup script
- [x] `offscreen.html` - Offscreen document (if used)
- [x] `offscreen.js` - Offscreen script (if used)
- [x] `worker.js` - Web worker (if used)
- [x] `icons/` - Extension icons (16, 48, 128)
- [x] `wasm/` - WebAssembly modules
- [x] `dictionaries/` - Language dictionaries
- [x] `rules/` - Grammar rules

### Files to EXCLUDE

Do NOT include these in the package:

- ❌ `node_modules/` - Development dependencies
- ❌ `src/` - Source TypeScript files
- ❌ `tests/` - Test files
- ❌ `.git/` - Git repository
- ❌ `.env` - Environment variables
- ❌ `*.map` - Source maps (optional, can include for debugging)
- ❌ `package.json` - NPM package file
- ❌ `tsconfig.json` - TypeScript config
- ❌ `vite.config.ts` - Build config

### Manifest Validation

The `manifest.json` must have:

```json
{
  "manifest_version": 3,
  "name": "Grammar Checker Extension",
  "version": "1.0.0",
  "description": "...",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [...],
  "background": {...},
  "content_scripts": [...],
  "action": {...}
}
```

### Size Validation

- **Maximum size:** 20MB (Chrome Web Store limit)
- **Recommended size:** <10MB for faster installation
- **Current size:** Check with `npm run package`

If package is too large:

1. Compress dictionaries further (Brotli)
2. Remove unused assets
3. Optimize images
4. Minify code (already done by Vite)

## 🔍 Testing the Package

### Before Submission

1. **Extract and test:**

   ```bash
   # Extract ZIP to a test directory
   unzip grammar-checker-extension.zip -d test-extension

   # Load in Chrome
   # chrome://extensions → Load unpacked → Select test-extension/
   ```

2. **Verify functionality:**
   - [ ] Extension loads without errors
   - [ ] Icon appears in toolbar
   - [ ] Popup opens correctly
   - [ ] Grammar checking works
   - [ ] All three languages work
   - [ ] Settings persist
   - [ ] No console errors

3. **Test on multiple sites:**
   - [ ] Gmail
   - [ ] Google Docs
   - [ ] Twitter
   - [ ] Facebook
   - [ ] Generic textarea

### Common Issues

**Issue: "Manifest file is missing or unreadable"**

- Solution: Ensure manifest.json is in the root of the ZIP
- Check: ZIP should contain files directly, not a folder

**Issue: "Package size exceeds limit"**

- Solution: Compress dictionaries, remove unused files
- Check: Run `npm run package` to see size

**Issue: "Invalid manifest"**

- Solution: Validate JSON syntax
- Check: Use online JSON validator

**Issue: "Icons not found"**

- Solution: Ensure icons are PNG format (not SVG)
- Check: Icons should be in `icons/` directory

## 📤 Submission Process

### Chrome Web Store

1. **Go to Developer Dashboard:**
   https://chrome.google.com/webstore/devconsole

2. **Create new item:**
   - Click "New Item"
   - Upload `grammar-checker-extension.zip`

3. **Fill in store listing:**
   - Use content from `store-listing/CHROME-WEB-STORE.txt`
   - Upload screenshots from `promotional/screenshots/`
   - Upload promotional images from `promotional/images/`

4. **Add privacy policy:**
   - URL: https://intity01.github.io/grammar-extention/

5. **Submit for review:**
   - Review time: 1-3 business days

### Microsoft Edge Add-ons

1. **Go to Partner Center:**
   https://partner.microsoft.com/dashboard/microsoftedge

2. **Create new extension:**
   - Click "New extension"
   - Upload `grammar-checker-extension.zip`

3. **Fill in store listing:**
   - Use content from `store-listing/EDGE-ADD-ONS.txt`
   - Upload screenshots from `promotional/screenshots/`
   - Upload promotional images from `promotional/images/`

4. **Add privacy policy:**
   - URL: https://intity01.github.io/grammar-extention/

5. **Submit for review:**
   - Review time: 3-7 business days

## 🔄 Update Process

### For Future Updates

1. **Update version in manifest.json:**

   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Build and package:**

   ```bash
   npm run build
   npm run package
   ```

3. **Test the update:**
   - Load in Chrome to verify
   - Test all functionality

4. **Submit update:**
   - Upload new ZIP to store dashboards
   - Update release notes
   - Submit for review

### Version Numbering

Follow semantic versioning:

- **Major (1.x.x):** Breaking changes
- **Minor (x.1.x):** New features
- **Patch (x.x.1):** Bug fixes

Examples:

- `1.0.0` → Initial release
- `1.0.1` → Bug fix
- `1.1.0` → New language support
- `2.0.0` → Major redesign

## 📊 Package Contents

### Expected Structure

```
grammar-checker-extension.zip
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── offscreen.html
├── offscreen.js
├── worker.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── wasm/
│   ├── grammar_checker_wasm.wasm
│   └── grammar_checker_wasm.js
├── dictionaries/
│   ├── thai.dat.br
│   ├── english.dat.br
│   └── japanese.dat.br
└── rules/
    ├── thai.json
    ├── english.json
    └── japanese.json
```

## 🛠️ Troubleshooting

### Build Issues

**Problem:** `dist/` directory not found

```bash
# Solution: Run build first
npm run build
```

**Problem:** Build fails with TypeScript errors

```bash
# Solution: Fix TypeScript errors
npm run build:check
```

### Packaging Issues

**Problem:** ZIP creation fails

```bash
# Solution: Use manual packaging
cd dist
# Windows
Compress-Archive -Path * -DestinationPath ../grammar-checker-extension.zip -Force
# macOS/Linux
zip -r ../grammar-checker-extension.zip .
```

**Problem:** Package too large

```bash
# Solution: Check what's taking space
du -sh dist/*
# Remove unnecessary files
# Compress dictionaries further
```

### Testing Issues

**Problem:** Extension doesn't load

- Check manifest.json syntax
- Verify all referenced files exist
- Check browser console for errors

**Problem:** Features not working

- Test in incognito mode
- Clear extension data
- Reinstall extension

## 📝 Checklist

### Pre-Packaging

- [ ] Code is complete and tested
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Extension works in Chrome
- [ ] Extension works in Edge
- [ ] No console errors
- [ ] Version number updated

### Packaging

- [ ] Run `npm run package`
- [ ] ZIP file created successfully
- [ ] Package size < 20MB
- [ ] All required files included
- [ ] No development files included

### Post-Packaging

- [ ] Extract and test ZIP
- [ ] Extension loads correctly
- [ ] All features work
- [ ] Test on multiple websites
- [ ] Screenshots captured
- [ ] Store listing prepared
- [ ] Privacy policy live

### Submission

- [ ] Chrome Web Store account ready
- [ ] Edge Add-ons account ready
- [ ] $5 Chrome developer fee paid
- [ ] Store listing content ready
- [ ] Screenshots ready
- [ ] Promotional images ready
- [ ] Privacy policy URL ready

## 🔗 Resources

- **Packaging Script:** `scripts/package-extension.js`
- **Store Listing:** `store-listing/`
- **Promotional Materials:** `promotional/`
- **Privacy Policy:** `docs/PRIVACY.md`
- **Release Notes:** `docs/RELEASE-NOTES.md`

## 📞 Support

If you encounter issues:

1. Check this guide
2. Review error messages
3. Test manually
4. Open an issue on GitHub

---

**Last Updated:** December 1, 2024
**Version:** 1.0.0
**Status:** Ready for packaging
