#!/usr/bin/env node

/**
 * Validate that all required promotional materials are present
 * Run this after creating icons, images, and screenshots
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "..");
const promoDir = path.join(projectRoot, "promotional");

console.log("🔍 Validating Promotional Materials...\n");

let allValid = true;
let completedCount = 0;
let totalRequired = 10;

// Check icons
console.log("📦 Icons:");
const iconSizes = [16, 48, 128];
iconSizes.forEach((size) => {
  const iconPath = path.join(promoDir, "icons", `icon${size}.png`);
  const exists = fs.existsSync(iconPath);

  if (exists) {
    const stats = fs.statSync(iconPath);
    console.log(`  ✅ icon${size}.png (${(stats.size / 1024).toFixed(2)} KB)`);
    completedCount++;
  } else {
    console.log(`  ❌ icon${size}.png - MISSING`);
    allValid = false;
  }
});

// Check promotional images
console.log("\n🎨 Promotional Images:");
const promoImages = [
  { name: "small-tile-440x280.png", width: 440, height: 280 },
  { name: "marquee-1400x560.png", width: 1400, height: 560 },
];

promoImages.forEach((img) => {
  const imgPath = path.join(promoDir, "images", img.name);
  const exists = fs.existsSync(imgPath);

  if (exists) {
    const stats = fs.statSync(imgPath);
    console.log(`  ✅ ${img.name} (${(stats.size / 1024).toFixed(2)} KB)`);
    completedCount++;
  } else {
    console.log(`  ❌ ${img.name} - MISSING`);
    allValid = false;
  }
});

// Check screenshots
console.log("\n📸 Screenshots:");
const requiredScreenshots = [
  "screenshot-1-thai-grammar-checking.png",
  "screenshot-2-english-grammar.png",
  "screenshot-3-japanese-grammar.png",
  "screenshot-4-settings-panel.png",
  "screenshot-5-error-highlighting.png",
];

const optionalScreenshots = [
  "screenshot-6-clipboard-mode.png",
  "screenshot-7-context-menu.png",
];

requiredScreenshots.forEach((screenshot) => {
  const screenshotPath = path.join(promoDir, "screenshots", screenshot);
  const exists = fs.existsSync(screenshotPath);

  if (exists) {
    const stats = fs.statSync(screenshotPath);
    console.log(`  ✅ ${screenshot} (${(stats.size / 1024).toFixed(2)} KB)`);
    completedCount++;
  } else {
    console.log(`  ❌ ${screenshot} - MISSING`);
    allValid = false;
  }
});

console.log("\n📋 Optional Screenshots:");
optionalScreenshots.forEach((screenshot) => {
  const screenshotPath = path.join(promoDir, "screenshots", screenshot);
  const exists = fs.existsSync(screenshotPath);

  if (exists) {
    const stats = fs.statSync(screenshotPath);
    console.log(`  ✅ ${screenshot} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ⚪ ${screenshot} - Not created (optional)`);
  }
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(
  `📊 Summary: ${completedCount}/${totalRequired} required items completed`,
);
console.log("=".repeat(60));

if (allValid) {
  console.log("\n✅ All required promotional materials are present!");
  console.log("\n📝 Next steps:");
  console.log("  1. Review all materials for quality");
  console.log("  2. Verify screenshots show features clearly");
  console.log("  3. Proceed to Task 2: Write privacy policy and documentation");
  process.exit(0);
} else {
  console.log("\n⚠️  Some required materials are missing.");
  console.log("\n📝 To complete:");
  console.log("  1. Follow instructions in promotional/GETTING-STARTED.md");
  console.log(
    "  2. Generate missing icons using promotional/icons/PNG-GENERATION.md",
  );
  console.log(
    "  3. Create promotional images from promotional/images/generate-promo-images.html",
  );
  console.log(
    "  4. Capture screenshots using promotional/screenshots/GUIDE.md",
  );
  console.log("  5. Run this script again to validate");
  process.exit(1);
}
