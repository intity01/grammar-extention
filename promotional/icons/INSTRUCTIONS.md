# Icon Generation Instructions

## Using Node.js (Recommended)

Install dependencies:
```bash
npm install sharp
```

Then run:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 48, 128];
const svgPath = '../public/icons/icon128.svg';

sizes.forEach(size => {
  sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(`icon${size}.png`)
    .then(() => console.log(`Generated icon${size}.png`))
    .catch(err => console.error(err));
});
```

## Using ImageMagick

```bash
convert ../public/icons/icon128.svg -resize 16x16 icon16.png
convert ../public/icons/icon128.svg -resize 48x48 icon48.png
convert ../public/icons/icon128.svg -resize 128x128 icon128.png
```

## Using Online Tools

1. Go to https://cloudconvert.com/svg-to-png
2. Upload icon128.svg
3. Set output size (16x16, 48x48, or 128x128)
4. Download PNG

## Manual Creation

If SVG conversion doesn't work well:
1. Open SVG in design tool (Figma, Inkscape, Illustrator)
2. Export as PNG at required sizes
3. Ensure transparent background
4. Save with correct filenames
