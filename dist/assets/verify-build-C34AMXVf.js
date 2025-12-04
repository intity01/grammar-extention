/**
 * Automated Build Verification Script
 * Verifies the extension build meets requirements before manual testing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

console.log("🔍 Verifying Extension Build...\n");

let allChecksPassed = true;

// Check 1: Verify dist folder exists
console.log("✓ Check 1: Dist folder exists");
if (!fs.existsSync(distPath)) {
  console.error('❌ FAIL: dist/ folder not found. Run "npm run build" first.');
  process.exit(1);
}

// Check 2: Verify manifest.json
console.log("✓ Check 2: Manifest.json validation");
const manifestPath = path.join(distPath, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("❌ FAIL: manifest.json not found");
  allChecksPassed = false;
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Verify Manifest V3
  if (manifest.manifest_version !== 3) {
    console.error("❌ FAIL: Not using Manifest V3");
    allChecksPassed = false;
  } else {
    console.log("  ✓ Manifest V3 format");
  }

  // Verify required permissions
  const requiredPermissions = [
    "storage",
    "activeTab",
    "offscreen",
    "clipboardWrite",
    "contextMenus",
  ];
  const hasAllPermissions = requiredPermissions.every((perm) =>
    manifest.permissions?.includes(perm),
  );
  if (!hasAllPermissions) {
    console.error("❌ FAIL: Missing required permissions");
    console.error("  Required:", requiredPermissions);
    console.error("  Found:", manifest.permissions);
    allChecksPassed = false;
  } else {
    console.log("  ✓ All required permissions present");
  }

  // Verify content scripts
  if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
    console.error("❌ FAIL: No content scripts defined");
    allChecksPassed = false;
  } else {
    console.log("  ✓ Content scripts configured");
  }

  // Verify background service worker
  if (!manifest.background?.service_worker) {
    console.error("❌ FAIL: No service worker defined");
    allChecksPassed = false;
  } else {
    console.log("  ✓ Service worker configured");
  }

  // Verify CSP for WebAssembly
  if (
    !manifest.content_security_policy?.extension_pages?.includes(
      "wasm-unsafe-eval",
    )
  ) {
    console.warn("⚠️  WARNING: CSP may not allow WebAssembly");
  } else {
    console.log("  ✓ CSP allows WebAssembly");
  }
}

// Check 3: Verify required files
console.log("\n✓ Check 3: Required files");
const requiredFiles = [
  "background.js",
  "content.js",
  "worker.js",
  "offscreen.js",
  "offscreen.html",
  "popup.html",
  "popup.js",
];

for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ FAIL: ${file} not found`);
    allChecksPassed = false;
  } else {
    const stats = fs.statSync(filePath);
    console.log(`  ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
}

// Check 4: Verify dictionaries
console.log("\n✓ Check 4: Dictionary files");
const dictionariesPath = path.join(distPath, "dictionaries");
if (!fs.existsSync(dictionariesPath)) {
  console.error("  ❌ FAIL: dictionaries/ folder not found");
  allChecksPassed = false;
} else {
  const requiredDictionaries = [
    "thai.dat.br",
    "english.dat.br",
    "japanese.dat.br",
  ];

  let totalDictSize = 0;
  for (const dict of requiredDictionaries) {
    const dictPath = path.join(dictionariesPath, dict);
    if (!fs.existsSync(dictPath)) {
      console.error(`  ❌ FAIL: ${dict} not found`);
      allChecksPassed = false;
    } else {
      const stats = fs.statSync(dictPath);
      const sizeMB = stats.size / (1024 * 1024);
      totalDictSize += sizeMB;
      console.log(`  ✓ ${dict} (${sizeMB.toFixed(2)} MB)`);
    }
  }

  console.log(`  Total dictionary size: ${totalDictSize.toFixed(2)} MB`);
  if (totalDictSize > 30) {
    console.warn("  ⚠️  WARNING: Dictionaries are large, may affect load time");
  }
}

// Check 5: Verify grammar rules
console.log("\n✓ Check 5: Grammar rule files");
const rulesPath = path.join(distPath, "rules");
if (!fs.existsSync(rulesPath)) {
  console.error("  ❌ FAIL: rules/ folder not found");
  allChecksPassed = false;
} else {
  const requiredRules = ["thai.json", "english.json", "japanese.json"];

  for (const ruleFile of requiredRules) {
    const rulePath = path.join(rulesPath, ruleFile);
    if (!fs.existsSync(rulePath)) {
      console.error(`  ❌ FAIL: ${ruleFile} not found`);
      allChecksPassed = false;
    } else {
      try {
        const rules = JSON.parse(fs.readFileSync(rulePath, "utf8"));
        const ruleCount = rules.rules?.length || 0;
        console.log(`  ✓ ${ruleFile} (${ruleCount} rules)`);
      } catch (error) {
        console.error(`  ❌ FAIL: ${ruleFile} is not valid JSON`);
        allChecksPassed = false;
      }
    }
  }
}

// Check 6: Verify WebAssembly modules
console.log("\n✓ Check 6: WebAssembly modules");
const wasmPath = path.join(distPath, "wasm");
if (!fs.existsSync(wasmPath)) {
  console.error("  ❌ FAIL: wasm/ folder not found");
  allChecksPassed = false;
} else {
  const wasmFiles = fs.readdirSync(wasmPath).filter((f) => f.endsWith(".wasm"));
  if (wasmFiles.length === 0) {
    console.error("  ❌ FAIL: No .wasm files found");
    allChecksPassed = false;
  } else {
    let totalWasmSize = 0;
    for (const wasmFile of wasmFiles) {
      const wasmFilePath = path.join(wasmPath, wasmFile);
      const stats = fs.statSync(wasmFilePath);
      const sizeMB = stats.size / (1024 * 1024);
      totalWasmSize += sizeMB;
      console.log(`  ✓ ${wasmFile} (${sizeMB.toFixed(2)} MB)`);
    }

    console.log(`  Total Wasm size: ${totalWasmSize.toFixed(2)} MB`);
    if (totalWasmSize > 5) {
      console.warn("  ⚠️  WARNING: Wasm modules are large");
    }
  }
}

// Check 7: Verify total extension size
console.log("\n✓ Check 7: Total extension size");
function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

const totalSize = getDirectorySize(distPath);
const totalSizeMB = totalSize / (1024 * 1024);
console.log(`  Total extension size: ${totalSizeMB.toFixed(2)} MB`);

if (totalSizeMB > 20) {
  console.error("  ❌ FAIL: Extension size exceeds 20MB limit");
  allChecksPassed = false;
} else {
  console.log("  ✓ Size within limits (<20MB)");
}

// Final summary
console.log("\n" + "=".repeat(50));
if (allChecksPassed) {
  console.log("✅ All checks passed! Extension is ready for testing.");
  console.log("\nNext steps:");
  console.log("1. Open Chrome and navigate to chrome://extensions/");
  console.log("2. Enable Developer mode");
  console.log('3. Click "Load unpacked" and select the dist/ folder');
  console.log("4. Follow the testing guide in CHROME_TESTING_GUIDE.md");
  process.exit(0);
} else {
  console.error("❌ Some checks failed. Please fix the issues before testing.");
  process.exit(1);
}
