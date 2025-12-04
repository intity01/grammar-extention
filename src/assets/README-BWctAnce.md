# Promotional Materials for Extension Publishing

This directory contains all tools, templates, and documentation needed to create promotional materials for publishing the Grammar Checker Extension to Chrome Web Store and Microsoft Edge Add-ons.

## 📁 Directory Structure

```
promotional/
├── icons/              # PNG icons (16x16, 48x48, 128x128)
├── images/             # Promotional images (440x280, 1400x560)
├── screenshots/        # Feature demonstration screenshots (5+ required)
├── GETTING-STARTED.md  # Quick start guide (START HERE!)
├── CHECKLIST.md        # Detailed completion tracker
├── TASK-1-SUMMARY.md   # Technical implementation summary
└── README.md           # This file
```

## 🚀 Quick Start

**New here? Start with:** `GETTING-STARTED.md`

**Estimated time:** 30-45 minutes

### Three Simple Steps

1. **Generate Icons** (5 min)
   - Convert SVG to PNG using online tool or ImageMagick
   - See: `icons/PNG-GENERATION.md`

2. **Create Promotional Images** (5 min)
   - Open `images/generate-promo-images.html` in browser
   - Download generated images
   - See: `images/templates.html` for reference

3. **Capture Screenshots** (20 min)
   - Install extension in Chrome
   - Open `screenshots/test-page.html`
   - Capture 5 screenshots showing features
   - See: `screenshots/GUIDE.md`

### Validate Completion

```bash
npm run promo:validate
```

## 📋 What You Need to Create

### Required (10 items)

**Icons (3):**

- [ ] icon16.png (16x16)
- [ ] icon48.png (48x48)
- [ ] icon128.png (128x128)

**Promotional Images (2):**

- [ ] small-tile-440x280.png
- [ ] marquee-1400x560.png

**Screenshots (5):**

- [ ] Thai grammar checking
- [ ] English grammar checking
- [ ] Japanese grammar checking
- [ ] Settings panel
- [ ] Error highlighting

### Optional (2 items)

**Additional Screenshots:**

- [ ] Clipboard mode demonstration
- [ ] Context menu integration

## 🛠️ Tools Provided

### 1. Icon Generation

- **SVG Sources:** Ready in `icons/` directory
- **Conversion Guide:** `icons/PNG-GENERATION.md`
- **Methods:** Online tools, ImageMagick, Node.js, design software

### 2. Promotional Images

- **Generator:** `images/generate-promo-images.html`
- **Templates:** `images/templates.html`
- **Auto-generates:** Opens in browser, click download

### 3. Screenshots

- **Test Page:** `screenshots/test-page.html`
- **Guide:** `screenshots/GUIDE.md`
- **Pre-filled:** Example text in Thai, English, Japanese

### 4. Validation

- **Script:** `npm run promo:validate`
- **Checks:** All required files present and named correctly
- **Reports:** Progress and missing items

## 📚 Documentation

### For Users

- **GETTING-STARTED.md** - Quick start guide with step-by-step instructions
- **CHECKLIST.md** - Detailed checklist with requirements and verification

### For Developers

- **TASK-1-SUMMARY.md** - Technical implementation details
- **icons/PNG-GENERATION.md** - Icon conversion methods
- **screenshots/GUIDE.md** - Screenshot capture techniques

## 🎯 Store Requirements

### Chrome Web Store

- Minimum 1 screenshot (up to 5 recommended)
- Screenshot size: 1280x800 or 640x400
- Icons: PNG format (16, 48, 128)
- Small tile: 440x280 (optional)
- Marquee: 1400x560 (optional, for featured)

### Microsoft Edge Add-ons

- Minimum 1 screenshot (up to 10 allowed)
- Screenshot size: 1280x800 or 640x400
- Icons: PNG format (16, 48, 128)
- Similar promotional image requirements

## ✅ Quality Checklist

Before submitting, verify:

**Icons:**

- [ ] All three sizes present (16, 48, 128)
- [ ] PNG format with transparent background
- [ ] Clear and recognizable at all sizes
- [ ] File size < 100KB each

**Promotional Images:**

- [ ] Exact dimensions (440x280, 1400x560)
- [ ] Professional appearance
- [ ] Readable text
- [ ] Consistent branding

**Screenshots:**

- [ ] At least 5 screenshots
- [ ] Size 1280x800 or larger
- [ ] All three languages shown
- [ ] Clear demonstration of features
- [ ] No personal information visible
- [ ] PNG format
- [ ] File size < 5MB each

## 🔗 Quick Links

| Resource         | Location                            | Purpose               |
| ---------------- | ----------------------------------- | --------------------- |
| Quick Start      | `GETTING-STARTED.md`                | 30-minute setup guide |
| Checklist        | `CHECKLIST.md`                      | Track completion      |
| Icon Guide       | `icons/PNG-GENERATION.md`           | Convert SVG to PNG    |
| Image Generator  | `images/generate-promo-images.html` | Create promo images   |
| Screenshot Guide | `screenshots/GUIDE.md`              | Capture instructions  |
| Test Page        | `screenshots/test-page.html`        | Test extension        |
| Validation       | Run `npm run promo:validate`        | Check completion      |

## 💡 Tips

1. **Icons:** Use online converter (cloudconvert.com) for quickest results
2. **Images:** Generated templates are production-ready
3. **Screenshots:** Capture at 1280x800 for best quality
4. **Testing:** Open test page in browser with extension installed
5. **Validation:** Run frequently to track progress

## 🆘 Troubleshooting

### Icons look blurry

- Ensure SVG source is high quality
- Try different conversion tool
- Export at 2x size then downscale

### Can't capture screenshots

- Verify extension is installed and active
- Check browser console for errors
- Use Chrome DevTools screenshot feature
- Ensure test text contains actual errors

### Validation fails

- Check file names match exactly
- Verify files are in correct directories
- Ensure PNG format (not JPG or other)
- Run `npm run promo:validate` for details

## 📞 Support

- **Documentation:** Check guides in this directory
- **Validation:** Run `npm run promo:validate` to see status
- **Store Policies:** Review Chrome Web Store and Edge Add-ons guidelines

## ⏭️ Next Steps

After completing promotional materials:

1. ✅ Validate with `npm run promo:validate`
2. 📝 Proceed to Task 2: Write privacy policy
3. 📝 Then Task 3: Write store listing content
4. 📦 Finally Task 5: Package extension

---

**Status:** Infrastructure Complete ✅
**Action Required:** Create promotional materials (30 min)
**Validation:** `npm run promo:validate`

**Good luck! 🚀**
