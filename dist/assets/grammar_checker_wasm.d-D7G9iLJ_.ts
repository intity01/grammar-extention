/* tslint:disable */
/* eslint-disable */

export class Dictionary {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Look up a word in the dictionary
   * Returns the word's metadata value (frequency/POS) or undefined if not found
   */
  lookupWord(word: string): number | undefined;
  /**
   * Get the language of this dictionary
   */
  getLanguage(): string;
  /**
   * Check if a word exists in the dictionary
   */
  containsWord(word: string): boolean;
  /**
   * Get the number of entries in the dictionary
   */
  getEntryCount(): number;
  /**
   * Get memory usage in bytes
   */
  getMemoryUsage(): number;
  /**
   * Load a dictionary from binary data
   */
  constructor(data: Uint8Array);
}

export class DictionaryManager {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Look up a word in a specific language dictionary
   */
  lookupWord(language: string, word: string): number | undefined;
  /**
   * Match grammar rules against text for a specific language
   */
  matchRules(text: string, language: string): any;
  /**
   * Check if a word exists in a specific language dictionary
   */
  containsWord(language: string, word: string): boolean;
  /**
   * Tokenize Thai text using maximal matching with backtracking
   */
  tokenizeThai(text: string): any;
  /**
   * Load a dictionary for a specific language
   */
  loadDictionary(language: string, data: Uint8Array): void;
  /**
   * Tokenize English text with POS tagging
   */
  tokenizeEnglish(text: string): any;
  /**
   * Check if grammar rules are loaded for a language
   */
  hasGrammarRules(language: string): boolean;
  /**
   * Tokenize Japanese text using character-type-based segmentation
   */
  tokenizeJapanese(text: string): any;
  /**
   * Unload a dictionary to free memory
   */
  unloadDictionary(language: string): boolean;
  /**
   * Load grammar rules for a specific language from JSON string
   */
  loadGrammarRules(language: string, json_str: string): void;
  /**
   * Get list of loaded languages
   */
  getLoadedLanguages(): any[];
  /**
   * Tokenize Thai text using greedy maximal matching (faster, less accurate)
   */
  tokenizeThaiGreedy(text: string): any;
  /**
   * Get total memory usage of all loaded dictionaries
   */
  getTotalMemoryUsage(): number;
  /**
   * Create a new dictionary manager
   */
  constructor();
  /**
   * Main analysis function - tokenizes text based on detected language
   * Returns an object with tokens and language information
   */
  analyze(text: string, language: string): any;
  /**
   * Check if a dictionary is loaded for a language
   */
  isLoaded(language: string): boolean;
}

/**
 * Get the version of the Wasm module
 */
export function getVersion(): string;

export function init(): void;

/**
 * Log a message to the console
 */
export function logMessage(message: string): void;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_dictionary_free: (a: number, b: number) => void;
  readonly __wbg_dictionarymanager_free: (a: number, b: number) => void;
  readonly dictionary_containsWord: (a: number, b: number, c: number) => number;
  readonly dictionary_getEntryCount: (a: number) => number;
  readonly dictionary_getLanguage: (a: number, b: number) => void;
  readonly dictionary_getMemoryUsage: (a: number) => number;
  readonly dictionary_lookupWord: (a: number, b: number, c: number) => number;
  readonly dictionary_new: (a: number, b: number, c: number) => void;
  readonly dictionarymanager_analyze: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly dictionarymanager_containsWord: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => number;
  readonly dictionarymanager_getLoadedLanguages: (a: number, b: number) => void;
  readonly dictionarymanager_getTotalMemoryUsage: (a: number) => number;
  readonly dictionarymanager_hasGrammarRules: (
    a: number,
    b: number,
    c: number,
  ) => number;
  readonly dictionarymanager_isLoaded: (
    a: number,
    b: number,
    c: number,
  ) => number;
  readonly dictionarymanager_loadDictionary: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly dictionarymanager_loadGrammarRules: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly dictionarymanager_lookupWord: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => number;
  readonly dictionarymanager_matchRules: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly dictionarymanager_new: () => number;
  readonly dictionarymanager_tokenizeEnglish: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly dictionarymanager_tokenizeJapanese: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly dictionarymanager_tokenizeThai: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly dictionarymanager_tokenizeThaiGreedy: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void;
  readonly dictionarymanager_unloadDictionary: (
    a: number,
    b: number,
    c: number,
  ) => number;
  readonly getVersion: (a: number) => void;
  readonly init: () => void;
  readonly logMessage: (a: number, b: number) => void;
  readonly __wbindgen_export: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export2: (a: number) => void;
  readonly __wbindgen_export3: (a: number, b: number) => number;
  readonly __wbindgen_export4: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
