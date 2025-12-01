// Web Worker for NLP Kernel
// Handles text analysis using WebAssembly module

import type {
  AnalysisResult,
  GrammarError,
  Correction,
  Language,
} from '../lib/types';
import { detect, segment } from '../lib/languageDetector';
import { loadDictionaryData } from '../lib/dictionaryStorage';

// Import Wasm module
import init, { DictionaryManager } from '../../wasm/pkg/grammar_checker_wasm';

// Worker state
let wasmInitialized = false;
let dictionaryManager: DictionaryManager | null = null;
const loadedDictionaries = new Set<Language>();
const loadedRules = new Set<Language>();

// Message types
interface WorkerMessage {
  type: 'ANALYZE' | 'LOAD_DICTIONARY' | 'LOAD_RULES' | 'UNLOAD_DICTIONARY' | 'GET_STATUS';
  payload?: any;
  id?: string;
}

interface WorkerResponse {
  type: 'ANALYSIS_RESULT' | 'DICTIONARY_LOADED' | 'RULES_LOADED' | 'STATUS' | 'ERROR';
  payload?: any;
  id?: string;
  error?: string;
}

/**
 * Initialize the WebAssembly module
 */
async function initializeWasm(): Promise<void> {
  if (wasmInitialized) {
    return;
  }

  try {
    // Load the Wasm module (local resource only)
    const wasmUrl = new URL('../../wasm/pkg/grammar_checker_wasm_bg.wasm', import.meta.url);
    
    // Verify this is a local chrome-extension:// URL
    if (!wasmUrl.href.startsWith('chrome-extension://') && !wasmUrl.href.startsWith('blob:')) {
      throw new Error(`Invalid URL scheme for Wasm module: ${wasmUrl.href}`);
    }
    
    await init(wasmUrl);
    
    // Create dictionary manager instance
    dictionaryManager = new DictionaryManager();
    
    wasmInitialized = true;
    console.log('WebAssembly module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WebAssembly module:', error);
    throw new Error(`Wasm initialization failed: ${error}`);
  }
}

/**
 * Load a dictionary into Wasm memory
 */
async function loadDictionary(language: Language): Promise<void> {
  if (!dictionaryManager) {
    throw new Error('Dictionary manager not initialized');
  }

  // Skip if already loaded
  if (loadedDictionaries.has(language)) {
    console.log(`Dictionary for ${language} already loaded`);
    return;
  }

  try {
    // Load dictionary data from IndexedDB
    const data = await loadDictionaryData(language);
    
    if (!data) {
      throw new Error(`Dictionary data not found for ${language}`);
    }

    // Load into Wasm memory
    const uint8Array = new Uint8Array(data);
    dictionaryManager.loadDictionary(language, uint8Array);
    
    loadedDictionaries.add(language);
    console.log(`Dictionary loaded for ${language} (${data.byteLength} bytes)`);
  } catch (error) {
    console.error(`Failed to load dictionary for ${language}:`, error);
    throw error;
  }
}

/**
 * Load grammar rules into Wasm
 */
async function loadGrammarRules(language: Language): Promise<void> {
  if (!dictionaryManager) {
    throw new Error('Dictionary manager not initialized');
  }

  // Skip if already loaded
  if (loadedRules.has(language)) {
    console.log(`Grammar rules for ${language} already loaded`);
    return;
  }

  try {
    // Load rules from JSON file (local resource only)
    const ruleFilePath = `rules/${language}.json`;
    const ruleUrl = new URL(`../../${ruleFilePath}`, import.meta.url);
    
    // Verify this is a local chrome-extension:// URL
    if (!ruleUrl.href.startsWith('chrome-extension://') && !ruleUrl.href.startsWith('blob:')) {
      throw new Error(`Invalid URL scheme for rules: ${ruleUrl.href}`);
    }
    
    const response = await fetch(ruleUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.statusText}`);
    }

    const rulesJson = await response.text();
    
    // Load into Wasm
    dictionaryManager.loadGrammarRules(language, rulesJson);
    
    loadedRules.add(language);
    console.log(`Grammar rules loaded for ${language}`);
  } catch (error) {
    console.error(`Failed to load grammar rules for ${language}:`, error);
    throw error;
  }
}

/**
 * Analyze text and detect grammar errors
 */
async function analyzeText(text: string): Promise<AnalysisResult> {
  const startTime = performance.now();

  if (!dictionaryManager) {
    throw new Error('Dictionary manager not initialized');
  }

  try {
    // Detect languages in the text
    const detectedLanguages = detect(text);
    
    // If no known languages detected, return empty result
    if (detectedLanguages.length === 0) {
      return {
        errors: [],
        corrections: [],
        segments: [],
        processingTime: performance.now() - startTime,
      };
    }

    // Load dictionaries and rules for detected languages
    for (const language of detectedLanguages) {
      if (!loadedDictionaries.has(language)) {
        await loadDictionary(language);
      }
      if (!loadedRules.has(language)) {
        await loadGrammarRules(language);
      }
    }

    // Segment text by language
    const segments = segment(text);
    
    // Analyze each segment
    const allErrors: GrammarError[] = [];
    const allCorrections: Correction[] = [];

    for (const seg of segments) {
      // Skip unknown language segments
      if (seg.language === 'unknown') {
        continue;
      }

      try {
        // Call Wasm analyze function
        const result = dictionaryManager.analyze(seg.text, seg.language);
        
        // Parse the result (Wasm returns a JS object)
        if (result && result.errors) {
          // Adjust error positions to account for segment offset
          const segmentErrors: GrammarError[] = result.errors.map((err: any) => ({
            start: err.start + seg.start,
            end: err.end + seg.start,
            type: err.type || 'grammar',
            message: err.message || 'Grammar error detected',
            language: seg.language,
            ruleId: err.ruleId || 'unknown',
          }));

          allErrors.push(...segmentErrors);

          // Generate corrections for each error
          for (let i = 0; i < segmentErrors.length; i++) {
            const error = segmentErrors[i];
            const wasmError = result.errors[i];
            const correction: Correction = {
              error,
              original: text.substring(error.start, error.end),
              corrected: wasmError.correction || text.substring(error.start, error.end),
              confidence: 0.9, // Deterministic rule-based confidence
            };
            allCorrections.push(correction);
          }
        }
      } catch (error) {
        console.error(`Error analyzing segment (${seg.language}):`, error);
        // Continue with other segments
      }
    }

    const processingTime = performance.now() - startTime;

    return {
      errors: allErrors,
      corrections: allCorrections,
      segments,
      processingTime,
    };
  } catch (error) {
    console.error('Error during text analysis:', error);
    throw error;
  }
}

/**
 * Handle incoming messages from main thread
 */
async function handleMessage(message: WorkerMessage): Promise<WorkerResponse> {
  try {
    // Ensure Wasm is initialized
    if (!wasmInitialized) {
      await initializeWasm();
    }

    switch (message.type) {
      case 'ANALYZE': {
        const { text } = message.payload;
        
        // Calculate dynamic timeout based on text length
        // Base: 50ms for short text, +10ms per 1000 characters
        const BASE_TIMEOUT_MS = 50;
        const TIMEOUT_PER_1K_CHARS = 10;
        const textLengthInK = Math.ceil(text.length / 1000);
        const ANALYSIS_TIMEOUT_MS = BASE_TIMEOUT_MS + (textLengthInK * TIMEOUT_PER_1K_CHARS);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT_MS);
        });

        try {
          const result = await Promise.race([
            analyzeText(text),
            timeoutPromise,
          ]);

          return {
            type: 'ANALYSIS_RESULT',
            payload: result,
            id: message.id,
          };
        } catch (error) {
          if (error instanceof Error && error.message === 'Analysis timeout') {
            // Return partial results on timeout
            console.warn(`Analysis timed out after ${ANALYSIS_TIMEOUT_MS}ms (text length: ${text.length}), returning empty result`);
            return {
              type: 'ANALYSIS_RESULT',
              payload: {
                errors: [],
                corrections: [],
                segments: [],
                processingTime: ANALYSIS_TIMEOUT_MS,
              },
              id: message.id,
            };
          }
          throw error;
        }
      }

      case 'LOAD_DICTIONARY': {
        const { language } = message.payload;
        await loadDictionary(language);
        return {
          type: 'DICTIONARY_LOADED',
          payload: { language },
          id: message.id,
        };
      }

      case 'LOAD_RULES': {
        const { language } = message.payload;
        await loadGrammarRules(language);
        return {
          type: 'RULES_LOADED',
          payload: { language },
          id: message.id,
        };
      }

      case 'UNLOAD_DICTIONARY': {
        const { language } = message.payload;
        if (dictionaryManager) {
          dictionaryManager.unloadDictionary(language);
          loadedDictionaries.delete(language);
          loadedRules.delete(language);
        }
        return {
          type: 'STATUS',
          payload: { message: `Dictionary unloaded for ${language}` },
          id: message.id,
        };
      }

      case 'GET_STATUS': {
        const status = {
          initialized: wasmInitialized,
          loadedDictionaries: Array.from(loadedDictionaries),
          loadedRules: Array.from(loadedRules),
          memoryUsage: dictionaryManager?.getTotalMemoryUsage() || 0,
        };
        return {
          type: 'STATUS',
          payload: status,
          id: message.id,
        };
      }

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    console.error('Error handling worker message:', error);
    return {
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
      id: message.id,
    };
  }
}

// Set up message listener
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const response = await handleMessage(event.data);
  self.postMessage(response);
});

// Log initialization
console.log('Grammar Checker: Web Worker initialized');
