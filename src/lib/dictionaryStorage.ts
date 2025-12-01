// IndexedDB dictionary storage
// Manages dictionary loading, caching, and version control

import { Language } from './types';

const DB_NAME = 'GrammarCheckerDB';
const DB_VERSION = 1;
const DICTIONARY_STORE = 'dictionaries';

export interface DictionaryMetadata {
  language: Language;
  version: string;
  size: number;
  lastUpdated: number;
}

export interface DictionaryEntry {
  language: Language;
  version: string;
  data: ArrayBuffer;
  metadata: DictionaryMetadata;
}

class DictionaryStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create dictionary store if it doesn't exist
        if (!db.objectStoreNames.contains(DICTIONARY_STORE)) {
          const store = db.createObjectStore(DICTIONARY_STORE, {
            keyPath: 'language',
          });
          store.createIndex('version', 'version', { unique: false });
          store.createIndex('lastUpdated', 'metadata.lastUpdated', {
            unique: false,
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store a dictionary in IndexedDB
   */
  async storeDictionary(entry: DictionaryEntry): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([DICTIONARY_STORE], 'readwrite');
      const store = transaction.objectStore(DICTIONARY_STORE);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to store dictionary: ${request.error}`));
    });
  }

  /**
   * Load a dictionary from IndexedDB
   */
  async loadDictionary(language: Language): Promise<DictionaryEntry | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([DICTIONARY_STORE], 'readonly');
      const store = transaction.objectStore(DICTIONARY_STORE);
      const request = store.get(language);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () =>
        reject(new Error(`Failed to load dictionary: ${request.error}`));
    });
  }

  /**
   * Check if a dictionary exists in IndexedDB
   */
  async hasDictionary(language: Language): Promise<boolean> {
    const entry = await this.loadDictionary(language);
    return entry !== null;
  }

  /**
   * Get dictionary metadata without loading the full data
   */
  async getDictionaryMetadata(
    language: Language
  ): Promise<DictionaryMetadata | null> {
    const entry = await this.loadDictionary(language);
    return entry ? entry.metadata : null;
  }

  /**
   * Delete a dictionary from IndexedDB
   */
  async deleteDictionary(language: Language): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([DICTIONARY_STORE], 'readwrite');
      const store = transaction.objectStore(DICTIONARY_STORE);
      const request = store.delete(language);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete dictionary: ${request.error}`));
    });
  }

  /**
   * List all stored dictionaries
   */
  async listDictionaries(): Promise<DictionaryMetadata[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([DICTIONARY_STORE], 'readonly');
      const store = transaction.objectStore(DICTIONARY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as DictionaryEntry[];
        resolve(entries.map((entry) => entry.metadata));
      };
      request.onerror = () =>
        reject(new Error(`Failed to list dictionaries: ${request.error}`));
    });
  }

  /**
   * Clear all dictionaries from IndexedDB
   */
  async clearAll(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([DICTIONARY_STORE], 'readwrite');
      const store = transaction.objectStore(DICTIONARY_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to clear dictionaries: ${request.error}`));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const dictionaryStorage = new DictionaryStorage();

/**
 * Hydrate dictionaries from bundled files to IndexedDB on first install
 */
export async function hydrateDictionaries(): Promise<void> {
  const languages: Language[] = [Language.THAI, Language.ENGLISH, Language.JAPANESE];
  const version = '1.0.0';

  for (const language of languages) {
    // Check if dictionary already exists
    const exists = await dictionaryStorage.hasDictionary(language);
    if (exists) {
      console.log(`Dictionary for ${language} already exists, skipping hydration`);
      continue;
    }

    try {
      // Load compressed dictionary from bundle
      const filename = `dictionaries/${language}.dat.br`;
      const response = await fetch(chrome.runtime.getURL(filename));
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
      }

      const compressedData = await response.arrayBuffer();

      // Decompress using DecompressionStream (native browser API)
      // Note: 'br' (Brotli) is supported in modern browsers but may not be in TypeScript types
      const decompressedStream = new Response(
        new Response(compressedData).body!.pipeThrough(
          new DecompressionStream('br' as CompressionFormat)
        )
      );
      const data = await decompressedStream.arrayBuffer();

      // Store in IndexedDB
      const entry: DictionaryEntry = {
        language,
        version,
        data,
        metadata: {
          language,
          version,
          size: data.byteLength,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(entry);
      console.log(`Hydrated dictionary for ${language} (${data.byteLength} bytes)`);
    } catch (error) {
      console.error(`Failed to hydrate dictionary for ${language}:`, error);
    }
  }
}

/**
 * Load dictionary data for a specific language
 * Returns the decompressed ArrayBuffer ready for use
 */
export async function loadDictionaryData(
  language: Language
): Promise<ArrayBuffer | null> {
  const entry = await dictionaryStorage.loadDictionary(language);
  return entry ? entry.data : null;
}

/**
 * Check if dictionaries need to be updated
 */
export async function checkDictionaryVersions(
  currentVersion: string
): Promise<Language[]> {
  const outdated: Language[] = [];
  const dictionaries = await dictionaryStorage.listDictionaries();

  for (const metadata of dictionaries) {
    if (metadata.version !== currentVersion) {
      outdated.push(metadata.language);
    }
  }

  return outdated;
}

/**
 * Update a dictionary to a new version
 */
export async function updateDictionary(
  language: Language,
  newVersion: string
): Promise<void> {
  // Delete old version
  await dictionaryStorage.deleteDictionary(language);

  // Load new version from bundle
  const filename = `dictionaries/${language}.dat.br`;
  const response = await fetch(chrome.runtime.getURL(filename));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
  }

  const compressedData = await response.arrayBuffer();

  // Decompress
  // Note: 'br' (Brotli) is supported in modern browsers but may not be in TypeScript types
  const decompressedStream = new Response(
    new Response(compressedData).body!.pipeThrough(
      new DecompressionStream('br' as CompressionFormat)
    )
  );
  const data = await decompressedStream.arrayBuffer();

  // Store new version
  const entry: DictionaryEntry = {
    language,
    version: newVersion,
    data,
    metadata: {
      language,
      version: newVersion,
      size: data.byteLength,
      lastUpdated: Date.now(),
    },
  };

  await dictionaryStorage.storeDictionary(entry);
  console.log(`Updated dictionary for ${language} to version ${newVersion}`);
}
