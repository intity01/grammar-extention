# Getting Started with Promotional Materials

This guide will help you create all the promotional materials needed for publishing the Grammar Checker Extension to Chrome Web Store and Microsoft Edge Add-ons.

## 📋 What You Need to Create

### Required (10 items)

1. **3 PNG Icons** (16x16, 48x48, 128x128)
2. **2 Promotional Images** (440x280, 1400x560)
3. **5 Screenshots** showing key features

### Optional (2 items)

4. **2 Additional Screenshots** (clipboard mode, context menu)

## 🚀 Quick Start (30 minutes)

### Step 1: Generate Icons (5 minutes)

**Easiest Method - Online Conversion:**

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `promotional/icons/icon16.svg`
3. Set output size to 16x16
4. Download as `icon16.png`
5. Repeat for icon48.svg (48x48) and icon128.svg (128x128)
6. Save all PNGs in `promotional/icons/` directory

**Alternative - ImageMagick (if installed):**

```bash
cd promotional/icons
convert icon16.svg -resize 16x16 icon16.png
convert icon48.svg -resize 48x48 icon48.png
convert icon128.svg -resize 128x128 icon128.png
```

### Step 2: Generate Promotional Images (5 minutes)

1. Open `promotional/images/generate-promo-images.html` in your browser
2. The images will auto-generate on page load
3. Click "Download PNG" button for Small Tile
4. Click "Download PNG" button for Marquee
5. Save both files in `promotional/images/` directory

**Files created:**

- `small-tile-440x280.png`
- `marquee-1400x560.png`

### Step 3: Capture Screenshots (20 minutes)

**Setup:**

1. Build and install the extension in Chrome
2. Open `promotional/screenshots/test-page.html` in browser
3. Ensure extension is active and working

**Capture Process:**

**Screenshot 1 - Thai Grammar Checking:**

1. Type Thai text with errors in the test page: "ผมไปโรงเรียนเมื่อวานนี้ และ และ เจอเพื่อน"
2. Wait for errors to be highlighted
3. Press F12 → Ctrl+Shift+P → type "screenshot" → "Capture screenshot"
4. Save as `screenshot-1-thai-grammar-checking.png`

**Screenshot 2 - English Grammar Checking:**

1. Open Gmail or similar website
2. Type English text with errors: "She don't like apples. I seen him yesterday."
3. Capture screenshot showing errors highlighted
4. Save as `screenshot-2-english-grammar.png`

**Screenshot 3 - Japanese Grammar Checking:**

1. Use test page contenteditable section
2. Type Japanese text: "私は学校に行きました。彼が本を読みます。"
3. Capture screenshot
4. Save as `screenshot-3-japanese-grammar.png`

**Screenshot 4 - Settings Panel:**

1. Click extension icon in browser toolbar
2. Popup should show settings
3. Capture screenshot of popup
4. Save as `screenshot-4-settings-panel.png`

**Screenshot 5 - Error Highlighting:**

1. Create text with multiple errors in different languages
2. Show errors highlighted with different colors/styles
3. Hover over error to show tooltip (if applicable)
4. Save as `screenshot-5-error-highlighting.png`

## 📁 File Organization

After completion, your structure should look like:

```
promotional/
├── icons/
│   ├── icon16.png ✅
│   ├── icon48.png ✅
│   ├── icon128.png ✅
│   └── [reference files]
├── images/
│   ├── small-tile-440x280.png ✅
│   ├── marquee-1400x560.png ✅
│   └── [generation tools]
└── screenshots/
    ├── screenshot-1-thai-grammar-checking.png ✅
    ├── screenshot-2-english-grammar.png ✅
    ├── screenshot-3-japanese-grammar.png ✅
    ├── screenshot-4-settings-panel.png ✅
    ├── screenshot-5-error-highlighting.png ✅
    └── [optional screenshots]
```

## ✅ Verification Checklist

Before proceeding to the next task, verify:

### Icons

- [ ] icon16.png exists and is 16x16 pixels
- [ ] icon48.png exists and is 48x48 pixels
- [ ] icon128.png exists and is 128x128 pixels
- [ ] All icons have transparent backgrounds
- [ ] Icons are clear at all sizes

### Promotional Images

- [ ] small-tile-440x280.png is exactly 440x280 pixels
- [ ] marquee-1400x560.png is exactly 1400x560 pixels
- [ ] Images look professional
- [ ] Text is readable

### Screenshots

- [ ] At least 5 screenshots captured
- [ ] All are 1280x800 or larger
- [ ] Thai, English, and Japanese all represented
- [ ] Screenshots are clear and demonstrate features
- [ ] No personal information visible

## 🎨 Customization (Optional)

If you want to customize the promotional images:

1. **Use the HTML templates as reference**
   - Open `promotional/images/generate-promo-images.html`
   - Screenshot the generated images
2. **Import into design tool**
   - Figma: Import PNG and edit
   - Canva: Use as background and add elements
   - Photoshop: Open and enhance
3. **Maintain dimensions**
   - Small tile: 440x280
   - Marquee: 1400x560
4. **Keep branding consistent**
   - Use extension colors (#667eea, #764ba2)
   - Include language indicators (🇹🇭 🇬🇧 🇯🇵)
   - Emphasize key features (offline, private, multilingual)

## 🔧 Troubleshooting

### Icons look blurry

- Ensure SVG source is high quality
- Try different conversion tool
- Export at 2x size then downscale

### Screenshots too large

- Compress using TinyPNG or similar
- Ensure < 5MB per screenshot
- Use PNG format (not JPG)

### Extension not showing errors in screenshots

- Verify extension is installed and active
- Check that test text contains actual errors
- Ensure language detection is working
- Check browser console for errors

### Can't capture good screenshots

- Use higher resolution display
- Zoom browser to 100%
- Use browser's built-in screenshot tool
- Try screen recording then extract frames

## 📚 Additional Resources

- **Icon Generation**: `promotional/icons/PNG-GENERATION.md`
- **Screenshot Guide**: `promotional/screenshots/GUIDE.md`
- **Full Checklist**: `promotional/CHECKLIST.md`
- **Test Page**: `promotional/screenshots/test-page.html`

## ⏭️ Next Steps

After completing all promotional materials:

1. Review `promotional/CHECKLIST.md` and mark items complete
2. Proceed to **Task 2**: Write privacy policy and documentation
3. Then **Task 3**: Write store listing content
4. Finally **Task 5**: Package extension for distribution

## 💡 Tips

- **Take your time with screenshots** - they're the first thing users see
- **Show real functionality** - don't fake or mock features
- **Highlight unique features** - multilingual, offline, privacy-focused
- **Keep it simple** - clear, uncluttered screenshots work best
- **Test on different screens** - ensure readability on various displays

## 🆘 Need Help?

If you encounter issues:

1. Check the detailed guides in each subdirectory
2. Review the CHECKLIST.md for requirements
3. Refer to Chrome Web Store and Edge Add-ons documentation
4. Ask for assistance with specific technical issues

---

**Estimated Time:** 30-45 minutes for all materials
**Difficulty:** Easy to Moderate
**Tools Needed:** Web browser, optional design software

Good luck! 🚀
