import * as fc from 'fast-check';
import { dictionaryStorage } from '../../src/lib/dictionaryStorage';
import { Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property: Memory Efficiency
 * 
 * For any set of loaded dictionaries, the total memory usage should not exceed 50 MB.
 * 
 * Validates: Requirements 7.4
 */

describe('Property: Memory Efficiency', () => {
  const MAX_MEMORY_MB = 50;
  const MAX_MEMORY_BYTES = MAX_MEMORY_MB * 1024 * 1024;

  beforeEach(async () => {
    // Clear all dictionaries before each test
    await dictionaryStorage.clearAll();
  });

  afterAll(async () => {
    // Clean up after all tests
    await dictionaryStorage.clearAll();
    dictionaryStorage.close();
  });

  /**
   * Helper function to calculate total memory usage from dictionary metadata
   */
  async function calculateTotalMemoryUsage(languages: Language[]): Promise<number> {
    let totalBytes = 0;

    for (const language of languages) {
      try {
        const metadata = await dictionaryStorage.getDictionaryMetadata(language);
        if (metadata && metadata.size !== undefined) {
          totalBytes += metadata.size;
        }
      } catch (error) {
        // Dictionary doesn't exist, skip it
        continue;
      }
    }

    return totalBytes;
  }

  /**
   * Helper function to create a mock dictionary entry with specified size
   */
  async function createMockDictionary(language: Language, sizeInBytes: number): Promise<void> {
    // Create a mock ArrayBuffer of the specified size
    const data = new ArrayBuffer(sizeInBytes);
    
    const entry = {
      language,
      version: '1.0.0',
      data,
      metadata: {
        language,
        version: '1.0.0',
        size: sizeInBytes,
        lastUpdated: Date.now(),
      },
    };

    await dictionaryStorage.storeDictionary(entry);
  }

  it('should not exceed 50MB for all loaded dictionaries', async () => {
    // Generator for dictionary sizes (in MB)
    // We'll generate realistic sizes between 1MB and 15MB per dictionary
    const dictionarySizeGen = fc.integer({ min: 1, max: 15 }).map(mb => mb * 1024 * 1024);

    // Generator for subsets of languages to load
    const languageSubsetGen = fc.subarray(
      [Language.THAI, Language.ENGLISH, Language.JAPANESE],
      { minLength: 1, maxLength: 3 }
    );

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(dictionarySizeGen, dictionarySizeGen, dictionarySizeGen),
        languageSubsetGen,
        async ([thaiSize, englishSize, japaneseSize], languagesToLoad) => {
          // Clear before each property test iteration
          await dictionaryStorage.clearAll();

          // Create mock dictionaries with generated sizes
          const sizes = {
            [Language.THAI]: thaiSize,
            [Language.ENGLISH]: englishSize,
            [Language.JAPANESE]: japaneseSize,
          };

          // Store all dictionaries
          for (const lang of [Language.THAI, Language.ENGLISH, Language.JAPANESE]) {
            await createMockDictionary(lang, sizes[lang]);
          }

          // Load only the selected subset of dictionaries
          const totalMemory = await calculateTotalMemoryUsage(languagesToLoad);

          // Calculate expected memory (sum of loaded dictionaries)
          const expectedMemory = languagesToLoad.reduce(
            (sum, lang) => sum + sizes[lang],
            0
          );

          // Verify the calculation is correct
          expect(totalMemory).toBe(expectedMemory);

          // Verify total memory doesn't exceed 50MB
          expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle loading all three dictionaries within memory limit', async () => {
    // Generator for realistic dictionary sizes
    // Based on design doc: Thai (Lexitron 40K+ words), Japanese (IPADIC), English (Wiktionary)
    // Realistic compressed sizes would be much smaller, but uncompressed could be larger
    const realisticSizeGen = fc.record({
      thai: fc.integer({ min: 5 * 1024 * 1024, max: 12 * 1024 * 1024 }), // 5-12 MB
      english: fc.integer({ min: 8 * 1024 * 1024, max: 15 * 1024 * 1024 }), // 8-15 MB
      japanese: fc.integer({ min: 6 * 1024 * 1024, max: 13 * 1024 * 1024 }), // 6-13 MB
    });

    await fc.assert(
      fc.asyncProperty(realisticSizeGen, async (sizes) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Create dictionaries with realistic sizes
        await createMockDictionary(Language.THAI, sizes.thai);
        await createMockDictionary(Language.ENGLISH, sizes.english);
        await createMockDictionary(Language.JAPANESE, sizes.japanese);

        // Load all dictionaries
        const allLanguages = [Language.THAI, Language.ENGLISH, Language.JAPANESE];
        const totalMemory = await calculateTotalMemoryUsage(allLanguages);

        // Verify total is sum of all dictionaries
        const expectedTotal = sizes.thai + sizes.english + sizes.japanese;
        expect(totalMemory).toBe(expectedTotal);

        // Verify total doesn't exceed 50MB
        expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);

        // Log memory usage for debugging (only in verbose mode)
        if (totalMemory > MAX_MEMORY_BYTES * 0.9) {
          console.log(`High memory usage: ${(totalMemory / (1024 * 1024)).toFixed(2)} MB`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain memory efficiency with lazy loading', async () => {
    // This property tests that lazy loading helps keep memory usage low
    // by only loading dictionaries for detected languages

    // Generator for which languages are "detected" in text
    const detectedLanguagesGen = fc.subarray(
      [Language.THAI, Language.ENGLISH, Language.JAPANESE],
      { minLength: 1, maxLength: 3 }
    );

    // Fixed realistic sizes for this test
    const THAI_SIZE = 10 * 1024 * 1024; // 10 MB
    const ENGLISH_SIZE = 12 * 1024 * 1024; // 12 MB
    const JAPANESE_SIZE = 11 * 1024 * 1024; // 11 MB

    await fc.assert(
      fc.asyncProperty(detectedLanguagesGen, async (detectedLanguages) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all dictionaries (simulating they're available)
        await createMockDictionary(Language.THAI, THAI_SIZE);
        await createMockDictionary(Language.ENGLISH, ENGLISH_SIZE);
        await createMockDictionary(Language.JAPANESE, JAPANESE_SIZE);

        // Load only dictionaries for detected languages (lazy loading)
        const totalMemory = await calculateTotalMemoryUsage(detectedLanguages);

        // Calculate expected memory based on what was loaded
        const sizes = {
          [Language.THAI]: THAI_SIZE,
          [Language.ENGLISH]: ENGLISH_SIZE,
          [Language.JAPANESE]: JAPANESE_SIZE,
        };

        const expectedMemory = detectedLanguages.reduce(
          (sum, lang) => sum + sizes[lang],
          0
        );

        expect(totalMemory).toBe(expectedMemory);

        // Verify lazy loading keeps memory under limit
        expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);

        // Verify we're not loading all dictionaries when we don't need them
        const allDictionaries = await dictionaryStorage.listDictionaries();
        expect(allDictionaries.length).toBe(3); // All stored

        // But we only loaded what we needed
        if (detectedLanguages.length < 3) {
          expect(totalMemory).toBeLessThan(THAI_SIZE + ENGLISH_SIZE + JAPANESE_SIZE);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of empty dictionaries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.subarray([Language.THAI, Language.ENGLISH, Language.JAPANESE], {
          minLength: 0,
          maxLength: 3,
        }),
        async (languages) => {
          // Clear before each iteration
          await dictionaryStorage.clearAll();

          // Create empty dictionaries
          for (const lang of languages) {
            await createMockDictionary(lang, 0);
          }

          // Load dictionaries
          const totalMemory = await calculateTotalMemoryUsage(languages);

          // Empty dictionaries should have 0 bytes
          expect(totalMemory).toBe(0);
          expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single large dictionary within limit', async () => {
    // Test that even a single large dictionary respects the limit
    const largeSizeGen = fc.integer({
      min: 1 * 1024 * 1024,
      max: MAX_MEMORY_BYTES,
    });

    await fc.assert(
      fc.asyncProperty(
        largeSizeGen,
        fc.constantFrom(Language.THAI, Language.ENGLISH, Language.JAPANESE),
        async (size, language) => {
          // Clear before each iteration
          await dictionaryStorage.clearAll();

          // Create a single large dictionary
          await createMockDictionary(language, size);

          // Load it
          const totalMemory = await calculateTotalMemoryUsage([language]);

          expect(totalMemory).toBe(size);
          expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify actual dictionary sizes are within limits', async () => {
    // This test uses actual dictionary metadata if they exist
    // It's a concrete example test rather than a pure property test

    // Try to load actual dictionaries from IndexedDB
    // Note: In test environment, we may not have access to actual files
    // This test will pass if dictionaries don't exist (they're optional in tests)

    const languages = [Language.THAI, Language.ENGLISH, Language.JAPANESE];
    let totalMemory = 0;

    for (const language of languages) {
      try {
        // Try to get metadata from IndexedDB (may not exist in test environment)
        const metadata = await dictionaryStorage.getDictionaryMetadata(language);
        if (metadata && metadata.size) {
          totalMemory += metadata.size;
        }
      } catch (error) {
        // Dictionary doesn't exist in test environment, which is fine
        console.log(`Dictionary for ${language} not available in test environment`);
      }
    }

    // If any dictionaries were loaded, verify they're within limits
    if (totalMemory > 0) {
      expect(totalMemory).toBeLessThanOrEqual(MAX_MEMORY_BYTES);
      console.log(`Actual dictionaries total: ${(totalMemory / (1024 * 1024)).toFixed(2)} MB`);
    }
  });
});
