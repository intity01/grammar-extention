const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Function to copy directory recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy all files from src to dist
console.log('Building extension...');
try {
    copyDir(srcDir, distDir);

    // Read and modify manifest.json for dist
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
    
    // Update paths for dist (remove src/ prefix)
    manifest.background.service_worker = manifest.background.service_worker.replace('src/', '');
    manifest.content_scripts[0].js = manifest.content_scripts[0].js.map(js => js.replace('src/', ''));
    manifest.action.default_popup = manifest.action.default_popup.replace('src/', '');
    manifest.action.default_icon = Object.fromEntries(
        Object.entries(manifest.action.default_icon).map(([k, v]) => [k, v.replace('src/', '')])
    );
    manifest.icons = Object.fromEntries(
        Object.entries(manifest.icons).map(([k, v]) => [k, v.replace('src/', '')])
    );
    manifest.options_page = manifest.options_page.replace('src/', '');
    manifest.web_accessible_resources[0].resources = manifest.web_accessible_resources[0].resources.map(
        r => r.replace('src/', '')
    );

    fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    console.log('Build complete! Output in dist/');
} catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
}
