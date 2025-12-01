// Simple test script for rule matcher
import initWasm, { DictionaryManager } from './pkg/grammar_checker_wasm.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testRuleMatcher() {
  console.log('Initializing WASM module...');
  const wasmPath = join(__dirname, 'pkg/grammar_checker_wasm_bg.wasm');
  const wasmBuffer = readFileSync(wasmPath);
  await initWasm(wasmBuffer);
  
  const manager = new DictionaryManager();
  console.log('✓ DictionaryManager created');
  
  // Load English rules
  console.log('\nLoading English rules...');
  const englishRules = readFileSync(join(__dirname, '../rules/english.json'), 'utf-8');
  manager.loadGrammarRules('en', englishRules);
  console.log('✓ English rules loaded');
  
  // Load Thai rules
  console.log('\nLoading Thai rules...');
  const thaiRules = readFileSync(join(__dirname, '../rules/thai.json'), 'utf-8');
  manager.loadGrammarRules('th', thaiRules);
  console.log('✓ Thai rules loaded');
  
  // Load Japanese rules
  console.log('\nLoading Japanese rules...');
  const japaneseRules = readFileSync(join(__dirname, '../rules/japanese.json'), 'utf-8');
  manager.loadGrammarRules('ja', japaneseRules);
  console.log('✓ Japanese rules loaded');
  
  // Test 1: English rule matching
  console.log('\n--- Test 1: English rule matching ---');
  const englishText = 'I could of done it better';
  const englishErrors = manager.matchRules(englishText, 'en');
  console.log(`Text: "${englishText}"`);
  console.log(`Errors found: ${englishErrors.length}`);
  if (englishErrors.length > 0) {
    console.log(`  - Error: "${englishErrors[0].original}" → "${englishErrors[0].correction}"`);
    console.log(`  - Rule ID: ${englishErrors[0].ruleId}`);
    console.log(`  - Language: ${englishErrors[0].language}`);
    console.log('✓ English rules applied correctly');
  } else {
    console.log('✗ Expected to find errors');
  }
  
  // Test 2: Thai rule matching
  console.log('\n--- Test 2: Thai rule matching ---');
  const thaiText = 'ฉันได้ รับของขวัญ';
  const thaiErrors = manager.matchRules(thaiText, 'th');
  console.log(`Text: "${thaiText}"`);
  console.log(`Errors found: ${thaiErrors.length}`);
  if (thaiErrors.length > 0) {
    console.log(`  - Error: "${thaiErrors[0].original}" → "${thaiErrors[0].correction}"`);
    console.log(`  - Rule ID: ${thaiErrors[0].ruleId}`);
    console.log(`  - Language: ${thaiErrors[0].language}`);
    console.log('✓ Thai rules applied correctly');
  } else {
    console.log('✗ Expected to find errors');
  }
  
  // Test 3: Japanese rule matching
  console.log('\n--- Test 3: Japanese rule matching ---');
  const japaneseText = 'これはテストです。です。';
  const japaneseErrors = manager.matchRules(japaneseText, 'ja');
  console.log(`Text: "${japaneseText}"`);
  console.log(`Errors found: ${japaneseErrors.length}`);
  if (japaneseErrors.length > 0) {
    console.log(`  - Error: "${japaneseErrors[0].original}" → "${japaneseErrors[0].correction}"`);
    console.log(`  - Rule ID: ${japaneseErrors[0].ruleId}`);
    console.log(`  - Language: ${japaneseErrors[0].language}`);
    console.log('✓ Japanese rules applied correctly');
  } else {
    console.log('✗ Expected to find errors');
  }
  
  // Test 4: Language isolation (Thai text with English rules)
  console.log('\n--- Test 4: Language isolation ---');
  const thaiTextForEnglish = 'ได้ รับ';
  const isolationErrors = manager.matchRules(thaiTextForEnglish, 'en');
  console.log(`Text: "${thaiTextForEnglish}" (Thai text)`);
  console.log(`Matching with English rules...`);
  console.log(`Errors found: ${isolationErrors.length}`);
  if (isolationErrors.length === 0) {
    console.log('✓ Language isolation working correctly');
  } else {
    console.log('✗ Should not match Thai text with English rules');
  }
  
  // Test 5: Multiple errors
  console.log('\n--- Test 5: Multiple errors detection ---');
  const multiErrorText = 'I could of done it and should of tried harder';
  const multiErrors = manager.matchRules(multiErrorText, 'en');
  console.log(`Text: "${multiErrorText}"`);
  console.log(`Errors found: ${multiErrors.length}`);
  if (multiErrors.length === 2) {
    console.log(`  - Error 1: "${multiErrors[0].original}" → "${multiErrors[0].correction}"`);
    console.log(`  - Error 2: "${multiErrors[1].original}" → "${multiErrors[1].correction}"`);
    console.log('✓ Multiple errors detected correctly');
  } else {
    console.log(`✗ Expected 2 errors, found ${multiErrors.length}`);
  }
  
  // Test 6: Error positions
  console.log('\n--- Test 6: Error positions ---');
  const posText = 'I could of done it';
  const posErrors = manager.matchRules(posText, 'en');
  if (posErrors.length > 0) {
    const error = posErrors[0];
    const extracted = posText.substring(error.start, error.end);
    console.log(`Text: "${posText}"`);
    console.log(`Error position: [${error.start}, ${error.end}]`);
    console.log(`Extracted: "${extracted}"`);
    if (extracted === error.original) {
      console.log('✓ Error positions are correct');
    } else {
      console.log(`✗ Position mismatch: expected "${error.original}", got "${extracted}"`);
    }
  }
  
  console.log('\n=== All tests completed ===');
}

testRuleMatcher().catch(console.error);
