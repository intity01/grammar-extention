# PNG Icon Generation

## Current Status

✓ SVG icons have been copied to this directory
⚠ PNG conversion requires additional tools

## Option 1: Using Online Tools (Easiest)

1. Go to https://cloudconvert.com/svg-to-png
2. Upload each SVG file (icon16.svg, icon48.svg, icon128.svg)
3. Set output dimensions to match (16x16, 48x48, 128x128)
4. Download the PNG files
5. Save them in this directory as:
   - icon16.png
   - icon48.png
   - icon128.png

## Option 2: Using ImageMagick (Command Line)

Install ImageMagick, then run:

```bash
convert icon16.svg -resize 16x16 icon16.png
convert icon48.svg -resize 48x48 icon48.png
convert icon128.svg -resize 128x128 icon128.png
```

## Option 3: Using Node.js (sharp library)

Install sharp:
```bash
npm install sharp
```

Then run:
```bash
node ../scripts/convert-svg-to-png.js
```

## Option 4: Manual Export

1. Open each SVG in a design tool (Figma, Inkscape, Illustrator)
2. Export as PNG at the correct size
3. Ensure transparent background
4. Save with correct filename

## Verification

After generating PNGs, verify:
- [ ] icon16.png exists and is 16x16 pixels
- [ ] icon48.png exists and is 48x48 pixels
- [ ] icon128.png exists and is 128x128 pixels
- [ ] All PNGs have transparent backgrounds
- [ ] Icons are clear and recognizable at all sizes

## For Store Submission

Chrome Web Store and Edge Add-ons require PNG format icons.
The manifest.json will need to be updated to reference .png files instead of .svg files.
