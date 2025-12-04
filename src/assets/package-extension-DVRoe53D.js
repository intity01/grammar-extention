#!/usr/bin/env node

/**
 * Package extension for Chrome Web Store and Edge Add-ons submission
 * Creates a production-ready .zip file
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const packageDir = path.join(projectRoot, "package");
const outputZip = path.join(projectRoot, "grammar-checker-extension.zip");

console.log("📦 Packaging Grammar Checker Extension...\n");

// Step 1: Check if dist directory exists
console.log("1️⃣ Checking build directory...");
if (!fs.existsSync(distDir)) {
  console.error("❌ Error: dist/ directory not found");
  console.error('   Please run "npm run build" first');
  process.exit(1);
}
console.log("✅ Build directory found\n");

// Step 2: Validate manifest.json
console.log("2️⃣ Validating manifest.json...");
const manifestPath = path.join(distDir, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("❌ Error: manifest.json not found in dist/");
  process.exit(1);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Manifest Version: ${manifest.manifest_version}`);

  // Validate required fields
  const requiredFields = ["name", "version", "manifest_version", "description"];
  const missingFields = requiredFields.filter((field) => !manifest[field]);

  if (missingFields.length > 0) {
    console.error(
      `❌ Error: Missing required fields: ${missingFields.join(", ")}`,
    );
    process.exit(1);
  }

  console.log("✅ Manifest is valid\n");
} catch (error) {
  console.error("❌ Error: Invalid manifest.json");
  console.error(`   ${error.message}`);
  process.exit(1);
}

// Step 3: Check required files
console.log("3️⃣ Checking required files...");
const requiredFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.js",
];

const missingFiles = requiredFiles.filter(
  (file) => !fs.existsSync(path.join(distDir, file)),
);

if (missingFiles.length > 0) {
  console.error("❌ Error: Missing required files:");
  missingFiles.forEach((file) => console.error(`   - ${file}`));
  process.exit(1);
}
console.log("✅ All required files present\n");

// Step 4: Check file sizes
console.log("4️⃣ Checking file sizes...");
const getDirectorySize = (dirPath) => {
  let totalSize = 0;

  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    }
  }

  return totalSize;
};

const totalSize = getDirectorySize(distDir);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

console.log(`   Total size: ${sizeMB} MB`);

if (totalSize > 20 * 1024 * 1024) {
  console.error("❌ Error: Package size exceeds 20MB limit");
  console.error(`   Current size: ${sizeMB} MB`);
  process.exit(1);
}
console.log("✅ Package size within limits\n");

// Step 5: Create package directory
console.log("5️⃣ Creating package...");
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true, force: true });
}
fs.mkdirSync(packageDir, { recursive: true });

// Copy dist contents to package
const copyRecursive = (src, dest) => {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach((file) => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursive(distDir, packageDir);
console.log("✅ Files copied to package directory\n");

// Step 6: Create ZIP file
console.log("6️⃣ Creating ZIP file...");

// Remove old zip if exists
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

try {
  // Use PowerShell Compress-Archive on Windows
  if (process.platform === "win32") {
    const psCommand = `Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${outputZip}" -Force`;
    execSync(psCommand, { shell: "powershell.exe", stdio: "inherit" });
  } else {
    // Use zip command on Unix-like systems
    execSync(`cd "${packageDir}" && zip -r "${outputZip}" .`, {
      stdio: "inherit",
    });
  }

  console.log("✅ ZIP file created\n");
} catch (error) {
  console.error("❌ Error creating ZIP file");
  console.error(`   ${error.message}`);
  process.exit(1);
}

// Step 7: Verify ZIP file
console.log("7️⃣ Verifying ZIP file...");
if (!fs.existsSync(outputZip)) {
  console.error("❌ Error: ZIP file was not created");
  process.exit(1);
}

const zipStats = fs.statSync(outputZip);
const zipSizeMB = (zipStats.size / (1024 * 1024)).toFixed(2);

console.log(`   ZIP file size: ${zipSizeMB} MB`);
console.log(`   Location: ${outputZip}`);

if (zipStats.size > 20 * 1024 * 1024) {
  console.error("❌ Warning: ZIP file exceeds 20MB limit");
  console.error(`   Size: ${zipSizeMB} MB`);
}

console.log("✅ ZIP file verified\n");

// Step 8: Clean up package directory
console.log("8️⃣ Cleaning up...");
fs.rmSync(packageDir, { recursive: true, force: true });
console.log("✅ Cleanup complete\n");

// Summary
console.log("=".repeat(60));
console.log("✅ PACKAGING COMPLETE!");
console.log("=".repeat(60));
console.log(`\n📦 Package: ${path.basename(outputZip)}`);
console.log(`📏 Size: ${zipSizeMB} MB`);
console.log(`📍 Location: ${outputZip}`);
console.log("\n📝 Next steps:");
console.log("  1. Test the extension by loading the ZIP file");
console.log("  2. Submit to Chrome Web Store");
console.log("  3. Submit to Microsoft Edge Add-ons");
console.log("\n🔗 Submission URLs:");
console.log("  Chrome: https://chrome.google.com/webstore/devconsole");
console.log("  Edge: https://partner.microsoft.com/dashboard/microsoftedge");
console.log("");
