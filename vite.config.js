import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Plugin to copy static assets
const copyAssets = () => {
    return {
        name: 'copy-assets',
        closeBundle: async () => {
            const assets = [
                'manifest.json',
                'src/icons',
                'src/wasm',
                'src/dictionaries',
                'src/rules',
                'src/chunks',
                'src/assets',
                'src/offscreen.html',
                'src/offscreen.js',
                'src/worker.js'
            ];

            for (const asset of assets) {
                const src = resolve(__dirname, asset);
                const dest = resolve(__dirname, asset.replace('src/', 'dist/').replace('manifest.json', 'dist/manifest.json'));

                if (fs.existsSync(src)) {
                    if (fs.lstatSync(src).isDirectory()) {
                        fs.cpSync(src, dest, { recursive: true });
                    } else {
                        fs.cpSync(src, dest);
                    }
                }
            }
        }
    }
};

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup.html'),
                options: resolve(__dirname, 'src/options.html'),
                background: resolve(__dirname, 'src/background.js'),
                content: resolve(__dirname, 'src/content.js')
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            }
        }
    },
    plugins: [/* copyAssets() */]
});
