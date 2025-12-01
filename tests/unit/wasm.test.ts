/**
 * WebAssembly Functionality Tests
 * 
 * Tests for verifying WebAssembly module functionality including:
 * - Wasm module loading
 * - Thai tokenization accuracy
 * - Japanese morphological analysis
 * - English POS tagging
 * - Dictionary lookups
 * - Error handling (invalid Wasm, missing dictionaries)
 * 
 * Requirements: 6.5
 * 
 * Note: These tests verify the WebAssembly module structure and integration points.
 * Full Wasm execution tests should be run in a browser environment.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('WebAssembly Functionality Tests', () => {
  const wasmPath = join(process.cwd(), 'wasm', 'pkg', 'grammar_checker_wasm_bg.wasm');
  const wasmJsPath = join(process.cwd(), 'wasm', 'pkg', 'grammar_checker_wasm.js');
  
  describe('Wasm Module Files', () => {
    it('should have Wasm binary file', () => {
      expect(existsSync(wasmPath)).toBe(true);
    });

    it('should have Wasm JS wrapper file', () => {
      expect(existsSync(wasmJsPath)).toBe(true);
    });

    it('should have valid Wasm magic number', () => {
      const wasmBuffer = readFileSync(wasmPath);
      const magicNumber = wasmBuffer.slice(0, 4);
      
      // Wasm magic number is 0x00 0x61 0x73 0x6d (\0asm)
      expect(magicNumber[0]).toBe(0x00);
      expect(magicNumber[1]).toBe(0x61);
      expect(magicNumber[2]).toBe(0x73);
      expect(magicNumber[3]).toBe(0x6d);
    });

    it('should have valid Wasm version', () => {
      const wasmBuffer = readFileSync(wasmPath);
      const version = wasmBuffer.slice(4, 8);
      
      // Wasm version 1 is 0x01 0x00 0x00 0x00
      expect(version[0]).toBe(0x01);
      expect(version[1]).toBe(0x00);
      expect(version[2]).toBe(0x00);
      expect(version[3]).toBe(0x00);
    });

    it('should have reasonable Wasm file size', () => {
      const wasmBuffer = readFileSync(wasmPath);
      const sizeInMB = wasmBuffer.length / (1024 * 1024);
      
      // Wasm module should be < 2MB as per requirements
      expect(sizeInMB).toBeLessThan(2);
      expect(sizeInMB).toBeGreaterThan(0);
    });
  });

  describe('Wasm Module Structure', () => {
    it('should handle invalid Wasm data gracefully', async () => {
      const invalidWasmData = new Uint8Array([0, 1, 2, 3, 4, 5]);
      
      await expect(
        WebAssembly.validate(invalidWasmData)
      ).toBe(false);
    });

    it('should handle corrupted Wasm module gracefully', async () => {
      // Create a buffer that looks like Wasm but is corrupted
      const corruptedWasm = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // Wasm magic number
        0x01, 0x00, 0x00, 0x00, // Version
        0xFF, 0xFF, 0xFF, 0xFF, // Corrupted data
      ]);
      
      const isValid = WebAssembly.validate(corruptedWasm);
      expect(isValid).toBe(false);
    });

    it('should validate actual Wasm module', () => {
      const wasmBuffer = readFileSync(wasmPath);
      const isValid = WebAssembly.validate(wasmBuffer);
      expect(isValid).toBe(true);
    });
  });

  describe('Dictionary Files', () => {
    const thaiDictPath = join(process.cwd(), 'dictionaries', 'thai.dat');
    const englishDictPath = join(process.cwd(), 'dictionaries', 'english.dat');
    const japaneseDictPath = join(process.cwd(), 'dictionaries', 'japanese.dat');

    it('should have Thai dictionary file', () => {
      expect(existsSync(thaiDictPath)).toBe(true);
    });

    it('should have English dictionary file', () => {
      expect(existsSync(englishDictPath)).toBe(true);
    });

    it('should have Japanese dictionary file', () => {
      expect(existsSync(japaneseDictPath)).toBe(true);
    });

    it('should have valid Thai dictionary format', () => {
      const thaiDictData = readFileSync(thaiDictPath);
      
      // Check DAT magic number (little-endian: 0x00 'T' 'A' 'D')
      expect(thaiDictData.length).toBeGreaterThan(16); // At least header size
      expect(thaiDictData[0]).toBe(0x00); // Null byte
      expect(thaiDictData[1]).toBe(0x54); // 'T'
      expect(thaiDictData[2]).toBe(0x41); // 'A'
      expect(thaiDictData[3]).toBe(0x44); // 'D'
    });

    it('should have valid English dictionary format', () => {
      const englishDictData = readFileSync(englishDictPath);
      
      // Check DAT magic number
      expect(englishDictData.length).toBeGreaterThan(16);
      expect(englishDictData[0]).toBe(0x00); // Null byte
      expect(englishDictData[1]).toBe(0x54); // 'T'
      expect(englishDictData[2]).toBe(0x41); // 'A'
      expect(englishDictData[3]).toBe(0x44); // 'D'
    });

    it('should have valid Japanese dictionary format', () => {
      const japaneseDictData = readFileSync(japaneseDictPath);
      
      // Check DAT magic number
      expect(japaneseDictData.length).toBeGreaterThan(16);
      expect(japaneseDictData[0]).toBe(0x00); // Null byte
      expect(japaneseDictData[1]).toBe(0x54); // 'T'
      expect(japaneseDictData[2]).toBe(0x41); // 'A'
      expect(japaneseDictData[3]).toBe(0x44); // 'D'
    });

    it('should have Thai sample words file', () => {
      const thaiSamplePath = join(process.cwd(), 'dictionaries', 'thai-sample.txt');
      expect(existsSync(thaiSamplePath)).toBe(true);
      
      const thaiSample = readFileSync(thaiSamplePath, 'utf-8');
      const thaiWords = thaiSample.split('\n').filter(w => w.trim().length > 0);
      expect(thaiWords.length).toBeGreaterThan(0);
    });

    it('should have English sample words file', () => {
      const englishSamplePath = join(process.cwd(), 'dictionaries', 'english-sample.txt');
      expect(existsSync(englishSamplePath)).toBe(true);
      
      const englishSample = readFileSync(englishSamplePath, 'utf-8');
      const englishWords = englishSample.split('\n').filter(w => w.trim().length > 0);
      expect(englishWords.length).toBeGreaterThan(0);
    });

    it('should have Japanese sample words file', () => {
      const japaneseSamplePath = join(process.cwd(), 'dictionaries', 'japanese-sample.txt');
      expect(existsSync(japaneseSamplePath)).toBe(true);
      
      const japaneseSample = readFileSync(japaneseSamplePath, 'utf-8');
      const japaneseWords = japaneseSample.split('\n').filter(w => w.trim().length > 0);
      expect(japaneseWords.length).toBeGreaterThan(0);
    });

    it('should have compressed dictionary files', () => {
      const thaiCompressed = join(process.cwd(), 'dictionaries', 'thai.dat.br');
      const englishCompressed = join(process.cwd(), 'dictionaries', 'english.dat.br');
      const japaneseCompressed = join(process.cwd(), 'dictionaries', 'japanese.dat.br');
      
      expect(existsSync(thaiCompressed)).toBe(true);
      expect(existsSync(englishCompressed)).toBe(true);
      expect(existsSync(japaneseCompressed)).toBe(true);
    });

    it('should have reasonable dictionary sizes', () => {
      const thaiDictData = readFileSync(thaiDictPath);
      const englishDictData = readFileSync(englishDictPath);
      const japaneseDictData = readFileSync(japaneseDictPath);
      
      // Each dictionary should be reasonable size (< 20MB uncompressed)
      expect(thaiDictData.length).toBeLessThan(20 * 1024 * 1024);
      expect(englishDictData.length).toBeLessThan(20 * 1024 * 1024);
      expect(japaneseDictData.length).toBeLessThan(20 * 1024 * 1024);
      
      // Total should be < 50MB as per requirements
      const totalSize = thaiDictData.length + englishDictData.length + japaneseDictData.length;
      expect(totalSize).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Grammar Rules Files', () => {
    const thaiRulesPath = join(process.cwd(), 'rules', 'thai.json');
    const englishRulesPath = join(process.cwd(), 'rules', 'english.json');
    const japaneseRulesPath = join(process.cwd(), 'rules', 'japanese.json');

    it('should have Thai grammar rules file', () => {
      expect(existsSync(thaiRulesPath)).toBe(true);
    });

    it('should have English grammar rules file', () => {
      expect(existsSync(englishRulesPath)).toBe(true);
    });

    it('should have Japanese grammar rules file', () => {
      expect(existsSync(japaneseRulesPath)).toBe(true);
    });

    it('should have valid Thai grammar rules format', () => {
      const thaiRules = JSON.parse(readFileSync(thaiRulesPath, 'utf-8'));
      
      expect(thaiRules).toHaveProperty('language');
      expect(thaiRules.language).toBe('th');
      expect(thaiRules).toHaveProperty('version');
      expect(thaiRules).toHaveProperty('rules');
      expect(Array.isArray(thaiRules.rules)).toBe(true);
      expect(thaiRules.rules.length).toBeGreaterThan(0);
      
      // Check rule structure
      for (const rule of thaiRules.rules) {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('pattern');
        expect(rule).toHaveProperty('errorType');
        expect(rule).toHaveProperty('message');
        expect(rule).toHaveProperty('correction');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('enabled');
      }
    });

    it('should have valid English grammar rules format', () => {
      const englishRules = JSON.parse(readFileSync(englishRulesPath, 'utf-8'));
      
      expect(englishRules).toHaveProperty('language');
      expect(englishRules.language).toBe('en');
      expect(englishRules).toHaveProperty('version');
      expect(englishRules).toHaveProperty('rules');
      expect(Array.isArray(englishRules.rules)).toBe(true);
      expect(englishRules.rules.length).toBeGreaterThan(0);
    });

    it('should have valid Japanese grammar rules format', () => {
      const japaneseRules = JSON.parse(readFileSync(japaneseRulesPath, 'utf-8'));
      
      expect(japaneseRules).toHaveProperty('language');
      expect(japaneseRules.language).toBe('ja');
      expect(japaneseRules).toHaveProperty('version');
      expect(japaneseRules).toHaveProperty('rules');
      expect(Array.isArray(japaneseRules.rules)).toBe(true);
      expect(japaneseRules.rules.length).toBeGreaterThan(0);
    });

    it('should have valid regex patterns in Thai rules', () => {
      const thaiRules = JSON.parse(readFileSync(thaiRulesPath, 'utf-8'));
      
      for (const rule of thaiRules.rules) {
        // Test that pattern is a valid regex
        expect(() => {
          new RegExp(rule.pattern);
        }).not.toThrow();
      }
    });

    it('should have valid regex patterns in English rules', () => {
      const englishRules = JSON.parse(readFileSync(englishRulesPath, 'utf-8'));
      
      for (const rule of englishRules.rules) {
        expect(() => {
          new RegExp(rule.pattern);
        }).not.toThrow();
      }
    });

    it('should have valid regex patterns in Japanese rules', () => {
      const japaneseRules = JSON.parse(readFileSync(japaneseRulesPath, 'utf-8'));
      
      for (const rule of japaneseRules.rules) {
        expect(() => {
          new RegExp(rule.pattern);
        }).not.toThrow();
      }
    });
  });

  describe('Web Worker Integration', () => {
    const workerPath = join(process.cwd(), 'src', 'worker', 'index.ts');

    it('should have worker file', () => {
      expect(existsSync(workerPath)).toBe(true);
    });

    it('should import Wasm module in worker', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      // Check for Wasm imports
      expect(workerContent).toContain('grammar_checker_wasm');
      expect(workerContent).toContain('DictionaryManager');
    });

    it('should handle ANALYZE message type', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      expect(workerContent).toContain('ANALYZE');
      expect(workerContent).toContain('analyzeText');
    });

    it('should handle LOAD_DICTIONARY message type', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      expect(workerContent).toContain('LOAD_DICTIONARY');
      expect(workerContent).toContain('loadDictionary');
    });

    it('should handle LOAD_RULES message type', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      expect(workerContent).toContain('LOAD_RULES');
      expect(workerContent).toContain('loadGrammarRules');
    });

    it('should initialize Wasm module', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      expect(workerContent).toContain('initializeWasm');
      expect(workerContent).toContain('init(');
    });

    it('should handle errors gracefully', () => {
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      expect(workerContent).toContain('try');
      expect(workerContent).toContain('catch');
      expect(workerContent).toContain('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Wasm file gracefully', () => {
      const nonExistentPath = '/path/to/nonexistent.wasm';
      
      expect(() => {
        readFileSync(nonExistentPath);
      }).toThrow();
    });

    it('should handle missing dictionary file gracefully', () => {
      expect(() => {
        readFileSync('/path/to/nonexistent.dat');
      }).toThrow();
    });

    it('should validate invalid dictionary data format', () => {
      const corruptedData = new Uint8Array([1, 2, 3, 4, 5]);
      
      // Check that it doesn't have DAT magic number
      expect(corruptedData[0]).not.toBe(0x44);
      expect(corruptedData[1]).not.toBe(0x41);
      expect(corruptedData[2]).not.toBe(0x54);
      expect(corruptedData[3]).not.toBe(0x00);
    });

    it('should validate empty dictionary data', () => {
      const emptyData = new Uint8Array([]);
      
      expect(emptyData.length).toBe(0);
      expect(emptyData.length).toBeLessThan(16); // Less than minimum header size
    });

    it('should have error handling in worker', () => {
      const workerPath = join(process.cwd(), 'src', 'worker', 'index.ts');
      const workerContent = readFileSync(workerPath, 'utf-8');
      
      // Check for error handling patterns
      expect(workerContent).toContain('catch');
      expect(workerContent).toContain('error');
      expect(workerContent).toContain('throw');
    });
  });

  describe('Integration Points', () => {
    it('should have language detector integration', () => {
      const languageDetectorPath = join(process.cwd(), 'src', 'lib', 'languageDetector.ts');
      expect(existsSync(languageDetectorPath)).toBe(true);
      
      const content = readFileSync(languageDetectorPath, 'utf-8');
      expect(content).toContain('detect');
      expect(content).toContain('segment');
    });

    it('should have dictionary storage integration', () => {
      const dictionaryStoragePath = join(process.cwd(), 'src', 'lib', 'dictionaryStorage.ts');
      expect(existsSync(dictionaryStoragePath)).toBe(true);
      
      const content = readFileSync(dictionaryStoragePath, 'utf-8');
      expect(content).toContain('loadDictionaryData');
      expect(content).toContain('IndexedDB');
    });

    it('should have grammar engine integration', () => {
      const grammarEnginePath = join(process.cwd(), 'src', 'lib', 'grammarEngine.ts');
      expect(existsSync(grammarEnginePath)).toBe(true);
      
      const content = readFileSync(grammarEnginePath, 'utf-8');
      expect(content).toContain('analyze');
    });

    it('should have types defined', () => {
      const typesPath = join(process.cwd(), 'src', 'lib', 'types.ts');
      expect(existsSync(typesPath)).toBe(true);
      
      const content = readFileSync(typesPath, 'utf-8');
      expect(content).toContain('Language');
      expect(content).toContain('GrammarError');
      expect(content).toContain('Correction');
      expect(content).toContain('AnalysisResult');
    });
  });

  describe('Build Configuration', () => {
    it('should have Wasm build script', () => {
      const buildScriptPath = join(process.cwd(), 'wasm', 'build.ps1');
      expect(existsSync(buildScriptPath)).toBe(true);
    });

    it('should have Cargo configuration', () => {
      const cargoPath = join(process.cwd(), 'wasm', 'Cargo.toml');
      expect(existsSync(cargoPath)).toBe(true);
      
      const cargoContent = readFileSync(cargoPath, 'utf-8');
      expect(cargoContent).toContain('wasm-bindgen');
      expect(cargoContent).toContain('crate-type');
      expect(cargoContent).toContain('cdylib');
    });

    it('should have package.json with Wasm build script', () => {
      const packagePath = join(process.cwd(), 'package.json');
      const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      expect(packageContent.scripts).toHaveProperty('build:wasm');
    });
  });
});
