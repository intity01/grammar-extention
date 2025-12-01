# Promotional Materials Checklist

This checklist tracks the completion of all promotional materials required for Chrome Web Store and Microsoft Edge Add-ons submission.

## Icons (PNG Format)

- [ ] **icon16.png** - 16x16 pixels
  - Location: `promotional/icons/icon16.png`
  - Source: Convert from `public/icons/icon16.svg`
  - Requirements: PNG format, transparent background

- [ ] **icon48.png** - 48x48 pixels
  - Location: `promotional/icons/icon48.png`
  - Source: Convert from `public/icons/icon48.svg`
  - Requirements: PNG format, transparent background

- [ ] **icon128.png** - 128x128 pixels
  - Location: `promotional/icons/icon128.png`
  - Source: Convert from `public/icons/icon128.svg`
  - Requirements: PNG format, transparent background

### Icon Generation Methods

Choose one:
1. **Online Tool**: https://cloudconvert.com/svg-to-png
2. **ImageMagick**: `convert icon.svg -resize 128x128 icon128.png`
3. **Design Tool**: Export from Figma/Inkscape/Illustrator
4. **Node.js**: Install sharp library and use conversion script

## Promotional Images

- [ ] **Small Tile** - 440x280 pixels
  - Location: `promotional/images/small-tile-440x280.png`
  - Source: Generate from `promotional/images/generate-promo-images.html`
  - Requirements: PNG format, showcases extension branding

- [ ] **Marquee** - 1400x560 pixels
  - Location: `promotional/images/marquee-1400x560.png`
  - Source: Generate from `promotional/images/generate-promo-images.html`
  - Requirements: PNG format, featured placement banner

### Image Generation Steps

1. Open `promotional/images/generate-promo-images.html` in browser
2. Click "Generate" buttons for each image
3. Click "Download PNG" or right-click and "Save image as..."
4. Optionally customize in Figma/Canva before final export

## Screenshots (Minimum 5 Required)

- [ ] **Screenshot 1: Thai Grammar Checking**
  - Filename: `screenshot-1-thai-grammar-checking.png`
  - Shows: Text area with Thai text, errors highlighted, suggestions visible
  - Size: 1280x800 or larger
  - Example text: "ผมไปโรงเรียนเมื่อวานนี้ และ และ เจอเพื่อน"

- [ ] **Screenshot 2: English Grammar Checking**
  - Filename: `screenshot-2-english-grammar.png`
  - Shows: Gmail or similar with English text, inline corrections
  - Size: 1280x800 or larger
  - Example text: "She don't like apples. I seen him yesterday."

- [ ] **Screenshot 3: Japanese Grammar Checking**
  - Filename: `screenshot-3-japanese-grammar.png`
  - Shows: Contenteditable field with Japanese text, particle errors
  - Size: 1280x800 or larger
  - Example text: "私は学校に行きました。彼が本を読みます。"

- [ ] **Screenshot 4: Settings Panel**
  - Filename: `screenshot-4-settings-panel.png`
  - Shows: Extension popup with correction mode options
  - Size: 1280x800 or larger
  - Highlights: Inline/clipboard modes, language selection

- [ ] **Screenshot 5: Error Highlighting**
  - Filename: `screenshot-5-error-highlighting.png`
  - Shows: Multiple errors highlighted, hover tooltip with explanation
  - Size: 1280x800 or larger
  - Demonstrates: Visual feedback system

### Optional Screenshots

- [ ] **Screenshot 6: Clipboard Mode**
  - Filename: `screenshot-6-clipboard-mode.png`
  - Shows: Original text with errors, "Copy corrected text" button

- [ ] **Screenshot 7: Context Menu**
  - Filename: `screenshot-7-context-menu.png`
  - Shows: Right-click menu with "Check grammar" option

### Screenshot Capture Methods

1. **Test Page**: Open `promotional/screenshots/test-page.html` in browser
2. **Chrome DevTools**: F12 → Ctrl+Shift+P → "Capture screenshot"
3. **Browser Extension**: Awesome Screenshot, Nimbus, FireShot
4. **Manual**: PrtScn (Windows) or Cmd+Shift+4 (Mac)

## Quality Checks

### Icons
- [ ] All three PNG icons exist (16, 48, 128)
- [ ] Icons have transparent backgrounds
- [ ] Icons are clear and recognizable at all sizes
- [ ] File sizes are reasonable (< 100KB each)

### Promotional Images
- [ ] Small tile is exactly 440x280 pixels
- [ ] Marquee is exactly 1400x560 pixels
- [ ] Images showcase extension branding
- [ ] Text is readable and professional
- [ ] Colors are consistent with extension theme

### Screenshots
- [ ] At least 5 screenshots captured
- [ ] All screenshots are 1280x800 or larger
- [ ] Screenshots are clear and readable
- [ ] No personal information visible
- [ ] All three languages (Thai, English, Japanese) represented
- [ ] File format is PNG
- [ ] Total file size per screenshot < 5MB
- [ ] Descriptive filenames used

## Store Requirements Validation

### Chrome Web Store
- [ ] At least 1 screenshot (up to 5 recommended)
- [ ] Screenshots are 1280x800 or 640x400
- [ ] Icons in PNG format (16, 48, 128)
- [ ] Small tile 440x280 (optional but recommended)
- [ ] Marquee 1400x560 (optional, for featured placement)

### Microsoft Edge Add-ons
- [ ] At least 1 screenshot (up to 10 allowed)
- [ ] Screenshots are 1280x800 or 640x400
- [ ] Icons in PNG format (16, 48, 128)
- [ ] Promotional images similar to Chrome

## File Organization

```
promotional/
├── icons/
│   ├── icon16.png ✓
│   ├── icon48.png ✓
│   ├── icon128.png ✓
│   ├── icon16.svg (reference)
│   ├── icon48.svg (reference)
│   ├── icon128.svg (reference)
│   ├── INSTRUCTIONS.md
│   └── PNG-GENERATION.md
├── images/
│   ├── small-tile-440x280.png ✓
│   ├── marquee-1400x560.png ✓
│   ├── generate-promo-images.html
│   └── templates.html
├── screenshots/
│   ├── screenshot-1-thai-grammar-checking.png ✓
│   ├── screenshot-2-english-grammar.png ✓
│   ├── screenshot-3-japanese-grammar.png ✓
│   ├── screenshot-4-settings-panel.png ✓
│   ├── screenshot-5-error-highlighting.png ✓
│   ├── screenshot-6-clipboard-mode.png (optional)
│   ├── screenshot-7-context-menu.png (optional)
│   ├── GUIDE.md
│   └── test-page.html
├── CHECKLIST.md (this file)
└── README.md
```

## Next Steps After Completion

1. [ ] Review all materials for quality and consistency
2. [ ] Verify all file sizes are within limits
3. [ ] Test installation of extension with new icons
4. [ ] Prepare store listing text (Task 3)
5. [ ] Package extension for distribution (Task 5)

## Notes

- Keep original SVG files as source of truth
- Store high-resolution versions for future updates
- Consider creating variations for different themes
- Document any custom design decisions
- Save project files if using design tools (Figma, etc.)

## Completion Status

**Icons:** 0/3 completed
**Promotional Images:** 0/2 completed
**Screenshots:** 0/5 required (0/7 total)

**Overall Progress:** 0/10 required items completed

---

Last Updated: [Date]
Updated By: [Name]
