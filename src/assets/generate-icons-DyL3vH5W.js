// Simple icon generator for the extension
// Creates placeholder icons in PNG format

const fs = require("fs");
const path = require("path");

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4A90E2" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">G</text>
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.15}" fill="#50E3C2"/>
</svg>`;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const sizes = [16, 48, 128];
sizes.forEach((size) => {
  const svg = createSVGIcon(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log("\nSVG icons created successfully!");
console.log(
  "Note: For production, convert these to PNG using an image editor or online tool.",
);
console.log(
  "Or install sharp: npm install sharp, and use it to convert SVG to PNG.",
);
