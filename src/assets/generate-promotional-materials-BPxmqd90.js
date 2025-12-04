#!/usr/bin/env node

/**
 * Generate promotional materials for Chrome Web Store and Edge Add-ons
 * This script creates:
 * - PNG icons (16x16, 48x48, 128x128)
 * - Promotional images (440x280, 1400x560)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create promotional directory
const promoDir = path.join(__dirname, "..", "promotional");
if (!fs.existsSync(promoDir)) {
  fs.mkdirSync(promoDir, { recursive: true });
}

// Create subdirectories
const iconsDir = path.join(promoDir, "icons");
const imagesDir = path.join(promoDir, "images");
const screenshotsDir = path.join(promoDir, "screenshots");

[iconsDir, imagesDir, screenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log("✓ Created promotional materials directory structure");

// Create README with instructions
const readmeContent = `# Promotional Materials

This directory contains all promotional materials for the Grammar Checker Extension.

## Icons

PNG versions of extension icons for store submission:
- \`icon16.png\` - 16x16 pixels
- \`icon48.png\` - 48x48 pixels  
- \`icon128.png\` - 128x128 pixels

## Promotional Images

Store listing images:
- \`small-tile-440x280.png\` - Small promotional tile (440x280)
- \`marquee-1400x560.png\` - Large marquee banner (1400x560)

## Screenshots

At least 5 screenshots demonstrating:
1. Thai grammar checking in action
2. English grammar checking (e.g., in Gmail)
3. Japanese grammar checking
4. Settings panel with correction modes
5. Error highlighting with suggestions
6. Clipboard mode (optional)
7. Context menu integration (optional)

## How to Generate

### Icons (PNG from SVG)

You can convert SVG to PNG using:
- Online tools: https://cloudconvert.com/svg-to-png
- Command line: \`convert icon.svg -resize 128x128 icon128.png\` (ImageMagick)
- Node.js: Use sharp or canvas libraries

### Promotional Images

Create using design tools:
- Figma, Canva, or Photoshop
- Use extension brand colors
- Include text: "Grammar Checker: Thai, English, Japanese"
- Add visual elements: checkmarks, language flags, text symbols

### Screenshots

1. Install the extension in Chrome
2. Open test pages with Thai, English, Japanese text
3. Trigger grammar checking
4. Use browser screenshot tools or extensions
5. Annotate with arrows/highlights if needed
6. Save as PNG with descriptive names

## Store Requirements

### Chrome Web Store
- At least 1 screenshot (1280x800 or 640x400)
- Up to 5 screenshots
- Small tile: 440x280 (optional)
- Marquee: 1400x560 (optional, for featured placement)

### Microsoft Edge Add-ons
- At least 1 screenshot (1280x800 or 640x400)
- Up to 10 screenshots
- Promotional images similar to Chrome

## Checklist

- [ ] Generate PNG icons (16, 48, 128)
- [ ] Create small tile (440x280)
- [ ] Create marquee (1400x560)
- [ ] Capture Thai grammar checking screenshot
- [ ] Capture English grammar checking screenshot
- [ ] Capture Japanese grammar checking screenshot
- [ ] Capture settings panel screenshot
- [ ] Capture error highlighting screenshot
- [ ] Add annotations to screenshots if needed
- [ ] Verify all images meet size requirements
`;

fs.writeFileSync(path.join(promoDir, "README.md"), readmeContent);
console.log("✓ Created promotional materials README");

// Create icon generation instructions
const iconInstructions = `# Icon Generation Instructions

## Using Node.js (Recommended)

Install dependencies:
\`\`\`bash
npm install sharp
\`\`\`

Then run:
\`\`\`javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 48, 128];
const svgPath = '../public/icons/icon128.svg';

sizes.forEach(size => {
  sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(\`icon\${size}.png\`)
    .then(() => console.log(\`Generated icon\${size}.png\`))
    .catch(err => console.error(err));
});
\`\`\`

## Using ImageMagick

\`\`\`bash
convert ../public/icons/icon128.svg -resize 16x16 icon16.png
convert ../public/icons/icon128.svg -resize 48x48 icon48.png
convert ../public/icons/icon128.svg -resize 128x128 icon128.png
\`\`\`

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
`;

fs.writeFileSync(path.join(iconsDir, "INSTRUCTIONS.md"), iconInstructions);
console.log("✓ Created icon generation instructions");

// Create promotional image templates (HTML/CSS for reference)
const promoTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Promotional Image Templates</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    
    .template {
      margin: 20px 0;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .small-tile {
      width: 440px;
      height: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .marquee {
      width: 1400px;
      height: 560px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .title {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .subtitle {
      font-size: 24px;
      opacity: 0.9;
      text-align: center;
    }
    
    .features {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    
    .features li {
      font-size: 20px;
      margin: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    
    .features li:before {
      content: '✓';
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    .languages {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    
    .language {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <h1>Promotional Image Templates</h1>
  <p>Use these as reference to create promotional images in your design tool.</p>
  
  <div class="template">
    <h2>Small Tile (440x280)</h2>
    <div class="small-tile">
      <div class="title" style="font-size: 36px;">Grammar Checker</div>
      <div class="subtitle" style="font-size: 18px;">Thai • English • Japanese</div>
      <div class="languages" style="margin-top: 20px;">
        <div class="language">🇹🇭 ไทย</div>
        <div class="language">🇬🇧 EN</div>
        <div class="language">🇯🇵 日本語</div>
      </div>
    </div>
  </div>
  
  <div class="template">
    <h2>Marquee (1400x560)</h2>
    <div class="marquee">
      <div style="flex: 1;">
        <div class="title">Grammar Checker</div>
        <div class="subtitle" style="text-align: left; font-size: 28px; margin-bottom: 30px;">
          Check grammar in Thai, English & Japanese
        </div>
        <ul class="features">
          <li>100% Offline & Private</li>
          <li>Real-time Checking</li>
          <li>Works Everywhere</li>
          <li>No AI Required</li>
        </ul>
      </div>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <div style="font-size: 120px; opacity: 0.3;">✓</div>
      </div>
    </div>
  </div>
  
  <div class="template">
    <h2>Instructions</h2>
    <ol>
      <li>Open this HTML file in a browser</li>
      <li>Take screenshots of the templates above</li>
      <li>Or recreate in Figma/Canva with these dimensions</li>
      <li>Customize colors, fonts, and content as needed</li>
      <li>Export as PNG at exact dimensions</li>
    </ol>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(imagesDir, "templates.html"), promoTemplate);
console.log("✓ Created promotional image templates");

// Create screenshot guide
const screenshotGuide = `# Screenshot Capture Guide

## Required Screenshots (Minimum 5)

### 1. Thai Grammar Checking
**What to show:**
- Text area with Thai text
- Grammar errors highlighted
- Correction suggestions visible

**Example text:**
\`\`\`
ผมไปโรงเรียนเมื่อวานนี้ และ และ เจอเพื่อน
(Contains redundant "และ และ")
\`\`\`

### 2. English Grammar Checking
**What to show:**
- Gmail compose window or similar
- English text with errors
- Inline corrections or suggestions

**Example text:**
\`\`\`
She don't like apples. I seen him yesterday.
(Subject-verb agreement errors)
\`\`\`

### 3. Japanese Grammar Checking
**What to show:**
- Contenteditable field with Japanese text
- Particle errors highlighted
- Suggestions panel

**Example text:**
\`\`\`
私は学校に行きました。彼が本を読みます。
(Particle usage examples)
\`\`\`

### 4. Settings Panel
**What to show:**
- Extension popup with settings
- Correction mode options (inline/clipboard)
- Language selection

### 5. Error Highlighting
**What to show:**
- Text with multiple errors highlighted
- Different error types in different colors
- Hover tooltip with explanation

## Optional Screenshots

### 6. Clipboard Mode
**What to show:**
- Original text with errors
- "Copy corrected text" button
- Corrected text in clipboard

### 7. Context Menu
**What to show:**
- Right-click menu
- "Check grammar" option
- Extension icon

## Capture Instructions

### Using Chrome DevTools
1. Open DevTools (F12)
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type "screenshot"
4. Choose "Capture screenshot" or "Capture full size screenshot"

### Using Browser Extensions
- Awesome Screenshot
- Nimbus Screenshot
- FireShot

### Manual Capture
1. Press PrtScn (Windows) or Cmd+Shift+4 (Mac)
2. Crop to relevant area
3. Save as PNG

## Post-Processing

### Annotations (Optional)
- Add arrows pointing to key features
- Add text labels for clarity
- Highlight important UI elements
- Use tools: Snagit, Skitch, or online editors

### Requirements
- Format: PNG
- Minimum size: 640x400
- Recommended: 1280x800
- Maximum file size: 5MB per screenshot
- Clear, readable text
- No personal information visible

## Naming Convention

Use descriptive names:
- \`screenshot-1-thai-grammar-checking.png\`
- \`screenshot-2-english-gmail.png\`
- \`screenshot-3-japanese-contenteditable.png\`
- \`screenshot-4-settings-panel.png\`
- \`screenshot-5-error-highlighting.png\`

## Checklist

- [ ] Screenshot 1: Thai grammar checking
- [ ] Screenshot 2: English grammar checking
- [ ] Screenshot 3: Japanese grammar checking
- [ ] Screenshot 4: Settings panel
- [ ] Screenshot 5: Error highlighting
- [ ] All screenshots are 1280x800 or larger
- [ ] All screenshots are clear and readable
- [ ] No personal information visible
- [ ] Files saved as PNG
- [ ] Descriptive filenames used
`;

fs.writeFileSync(path.join(screenshotsDir, "GUIDE.md"), screenshotGuide);
console.log("✓ Created screenshot capture guide");

// Create test page for screenshots
const testPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grammar Checker - Screenshot Test Page</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .section {
      background: white;
      padding: 30px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h2 {
      color: #667eea;
      margin-top: 0;
    }
    
    textarea, [contenteditable] {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      font-size: 16px;
      line-height: 1.6;
      font-family: inherit;
      resize: vertical;
    }
    
    textarea:focus, [contenteditable]:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .instructions {
      background: #f0f4ff;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
      color: #555;
    }
    
    .example-text {
      background: #f9f9f9;
      padding: 10px;
      border-left: 3px solid #667eea;
      margin: 10px 0;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>📝 Grammar Checker Extension - Screenshot Test Page</h1>
  <p>Use this page to capture screenshots for the store listing.</p>
  
  <div class="section">
    <h2>🇹🇭 Thai Grammar Checking</h2>
    <div class="instructions">
      <strong>Instructions:</strong> Type or paste Thai text with grammar errors. 
      The extension will highlight errors and show suggestions.
    </div>
    <div class="example-text">
      Example text with errors:<br>
      ผมไปโรงเรียนเมื่อวานนี้ และ และ เจอเพื่อน<br>
      เขาเป็นคนดีมากมาก มากมาก<br>
      วันนี้อากาศดีดี
    </div>
    <textarea placeholder="Type Thai text here...">ผมไปโรงเรียนเมื่อวานนี้ และ และ เจอเพื่อน</textarea>
  </div>
  
  <div class="section">
    <h2>🇬🇧 English Grammar Checking</h2>
    <div class="instructions">
      <strong>Instructions:</strong> Type or paste English text with grammar errors.
      Test subject-verb agreement, article usage, etc.
    </div>
    <div class="example-text">
      Example text with errors:<br>
      She don't like apples. I seen him yesterday.<br>
      He go to school every day. They was happy.<br>
      A apple is red. An orange are sweet.
    </div>
    <textarea placeholder="Type English text here...">She don't like apples. I seen him yesterday.</textarea>
  </div>
  
  <div class="section">
    <h2>🇯🇵 Japanese Grammar Checking</h2>
    <div class="instructions">
      <strong>Instructions:</strong> Type or paste Japanese text.
      Test particle usage, verb forms, etc.
    </div>
    <div class="example-text">
      Example text:<br>
      私は学校に行きました。<br>
      彼が本を読みます。<br>
      今日は天気がいいです。
    </div>
    <div contenteditable="true" placeholder="Type Japanese text here...">私は学校に行きました。彼が本を読みます。</div>
  </div>
  
  <div class="section">
    <h2>📋 Mixed Content</h2>
    <div class="instructions">
      <strong>Instructions:</strong> Test with mixed language content to show language detection.
    </div>
    <textarea placeholder="Type mixed language text here...">Hello world! สวัสดีครับ 今日はいい天気ですね。</textarea>
  </div>
  
  <div class="section">
    <h2>📸 Screenshot Checklist</h2>
    <ul>
      <li>✓ Thai grammar checking with errors highlighted</li>
      <li>✓ English grammar checking (preferably in Gmail or similar)</li>
      <li>✓ Japanese grammar checking in contenteditable</li>
      <li>✓ Extension popup showing settings</li>
      <li>✓ Error highlighting with correction suggestions</li>
      <li>Optional: Clipboard mode demonstration</li>
      <li>Optional: Context menu integration</li>
    </ul>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(screenshotsDir, "test-page.html"), testPage);
console.log("✓ Created screenshot test page");

console.log("\n✅ Promotional materials structure created successfully!");
console.log("\nNext steps:");
console.log(
  "1. Generate PNG icons from SVG (see promotional/icons/INSTRUCTIONS.md)",
);
console.log(
  "2. Create promotional images (see promotional/images/templates.html)",
);
console.log("3. Capture screenshots (see promotional/screenshots/GUIDE.md)");
console.log(
  "4. Open promotional/screenshots/test-page.html in browser to test extension",
);
