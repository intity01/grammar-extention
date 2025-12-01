import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  publicDir: false, // Disable automatic public directory copying
  plugins: [
    viteStaticCopy({
      targets: [
        // Copy grammar rules
        {
          src: 'rules/*.json',
          dest: 'rules'
        },
        // Copy only the necessary Wasm files
        {
          src: 'wasm/pkg/grammar_checker_wasm_bg.wasm',
          dest: 'wasm'
        },
        {
          src: 'wasm/pkg/grammar_checker_wasm.js',
          dest: 'wasm'
        },
        // Copy compressed dictionaries
        {
          src: 'dictionaries/*.dat.br',
          dest: 'dictionaries'
        },
        // Copy manifest and other public files
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'public/popup.html',
          dest: '.'
        },
        {
          src: 'public/popup.js',
          dest: '.'
        },
        {
          src: 'public/offscreen.html',
          dest: '.'
        },
        {
          src: 'public/icons/*.svg',
          dest: 'icons'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background/index.ts'),
        content: path.resolve(__dirname, 'src/content/index.ts'),
        offscreen: path.resolve(__dirname, 'src/offscreen/index.ts'),
        worker: path.resolve(__dirname, 'src/worker/index.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Don't copy test files, build artifacts, or unnecessary files
          const name = assetInfo.name || '';
          if (name.includes('.test.') || 
              name.includes('.spec.') ||
              name.endsWith('.o') ||
              name.endsWith('.d') ||
              name.endsWith('.rmeta') ||
              name.endsWith('.rlib') ||
              name.endsWith('.pdb') ||
              name.endsWith('.exe') ||
              name.endsWith('.dll') ||
              name.endsWith('.lib') ||
              name.endsWith('.bin') ||
              name.endsWith('.yaml') ||
              name.endsWith('.lock')) {
            return 'excluded/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
      external: (id) => {
        // Exclude test files and build artifacts from bundling
        return id.includes('.test.') || 
               id.includes('.spec.') ||
               id.includes('wasm/target/') ||
               id.includes('wasm/src/');
      }
    },
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    assetsInlineLimit: 0 // Don't inline any assets
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    exclude: ['*.wasm']
  }
});
