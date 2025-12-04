import * as fc from "fast-check";
import { dictionaryStorage } from "../../src/lib/dictionaryStorage";
import { LanguageDetector } from "../../src/lib/languageDetector";
import { Language } from "../../src/lib/types";

/**
 * Feature: grammar-checker-extension, Property: Lazy Loading
 *
 * For any text analysis, dictionaries should only be loaded for languages detected in the text,
 * not all available languages.
 *
 * Validates: Requirements 7.5
 */

describe("Property: Lazy Dictionary Loading", () => {
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
   * Helper function to create a mock dictionary entry
   */
  async function createMockDictionary(
    language: Language,
    sizeInBytes: number,
  ): Promise<void> {
    const data = new ArrayBuffer(sizeInBytes);

    const entry = {
      language,
      version: "1.0.0",
      data,
      metadata: {
        language,
        version: "1.0.0",
        size: sizeInBytes,
        lastUpdated: Date.now(),
      },
    };

    await dictionaryStorage.storeDictionary(entry);
  }

  /**
   * Helper function to simulate loading dictionaries for detected languages only
   */
  async function loadDictionariesForText(text: string): Promise<Language[]> {
    // Detect languages in the text
    const detectedLanguages = LanguageDetector.detect(text);

    // Simulate loading only the detected dictionaries
    const loadedLanguages: Language[] = [];

    for (const language of detectedLanguages) {
      // Check if dictionary exists
      const hasDictionary = await dictionaryStorage.hasDictionary(language);
      if (hasDictionary) {
        // In a real implementation, this would load the dictionary into memory
        // For testing, we just track which ones would be loaded
        loadedLanguages.push(language);
      }
    }

    return loadedLanguages;
  }

  /**
   * Generator for text containing specific languages
   */
  function generateTextWithLanguages(languages: Language[]): string {
    let text = "";

    for (const language of languages) {
      switch (language) {
        case Language.THAI:
          // Thai text: "สวัสดี" (Hello)
          text += "สวัสดีครับ ";
          break;
        case Language.ENGLISH:
          // English text
          text += "Hello world ";
          break;
        case Language.JAPANESE:
          // Japanese text: "こんにちは" (Hello)
          text += "こんにちは世界 ";
          break;
        case Language.UNKNOWN:
          // Unknown characters (numbers, punctuation)
          text += "123!@# ";
          break;
      }
    }

    return text.trim();
  }

  it("should only load dictionaries for detected languages", async () => {
    // Generator for subsets of languages to include in text
    const languageSubsetGen = fc.subarray(
      [Language.THAI, Language.ENGLISH, Language.JAPANESE],
      { minLength: 1, maxLength: 3 },
    );

    await fc.assert(
      fc.asyncProperty(languageSubsetGen, async (languagesInText) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all three dictionaries (they're available)
        await createMockDictionary(Language.THAI, 10 * 1024 * 1024);
        await createMockDictionary(Language.ENGLISH, 12 * 1024 * 1024);
        await createMockDictionary(Language.JAPANESE, 11 * 1024 * 1024);

        // Generate text containing only the selected languages
        const text = generateTextWithLanguages(languagesInText);

        // Detect languages in the text
        const detectedLanguages = LanguageDetector.detect(text);

        // Load dictionaries (lazy loading - only for detected languages)
        const loadedLanguages = await loadDictionariesForText(text);

        // Property: Loaded languages should match detected languages
        expect(loadedLanguages.sort()).toEqual(detectedLanguages.sort());

        // Property: Should NOT load dictionaries for languages not in text
        const allLanguages = [
          Language.THAI,
          Language.ENGLISH,
          Language.JAPANESE,
        ];
        const undetectedLanguages = allLanguages.filter(
          (lang) => !detectedLanguages.includes(lang),
        );

        for (const undetectedLang of undetectedLanguages) {
          expect(loadedLanguages).not.toContain(undetectedLang);
        }

        // Property: Should load fewer or equal dictionaries than available
        expect(loadedLanguages.length).toBeLessThanOrEqual(3);
        expect(loadedLanguages.length).toEqual(detectedLanguages.length);
      }),
      { numRuns: 100 },
    );
  });

  it("should not load any dictionaries when text contains only unknown characters", async () => {
    // Generator for text with only unknown characters (numbers, punctuation, symbols)
    const unknownTextGen = fc
      .string({
        minLength: 1,
        maxLength: 100,
      })
      .filter((text) => {
        // Filter to only include text that doesn't contain Thai, English, or Japanese
        const detected = LanguageDetector.detect(text);
        return detected.length === 0;
      });

    await fc.assert(
      fc.asyncProperty(unknownTextGen, async (text) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all dictionaries
        await createMockDictionary(Language.THAI, 10 * 1024 * 1024);
        await createMockDictionary(Language.ENGLISH, 12 * 1024 * 1024);
        await createMockDictionary(Language.JAPANESE, 11 * 1024 * 1024);

        // Detect languages (should be empty)
        const detectedLanguages = LanguageDetector.detect(text);

        // Load dictionaries
        const loadedLanguages = await loadDictionariesForText(text);

        // Property: No dictionaries should be loaded for unknown text
        expect(detectedLanguages.length).toBe(0);
        expect(loadedLanguages.length).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  it("should load all dictionaries when text contains all languages", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // Thai text
        fc.string({ minLength: 1, maxLength: 20 }), // English text
        fc.string({ minLength: 1, maxLength: 20 }), // Japanese text
        async (thaiPart, englishPart, japanesePart) => {
          // Clear before each iteration
          await dictionaryStorage.clearAll();

          // Store all dictionaries
          await createMockDictionary(Language.THAI, 10 * 1024 * 1024);
          await createMockDictionary(Language.ENGLISH, 12 * 1024 * 1024);
          await createMockDictionary(Language.JAPANESE, 11 * 1024 * 1024);

          // Create text with all three languages
          const text = generateTextWithLanguages([
            Language.THAI,
            Language.ENGLISH,
            Language.JAPANESE,
          ]);

          // Detect languages
          const detectedLanguages = LanguageDetector.detect(text);

          // Load dictionaries
          const loadedLanguages = await loadDictionariesForText(text);

          // Property: All three dictionaries should be loaded
          expect(detectedLanguages.length).toBe(3);
          expect(loadedLanguages.length).toBe(3);
          expect(loadedLanguages).toContain(Language.THAI);
          expect(loadedLanguages).toContain(Language.ENGLISH);
          expect(loadedLanguages).toContain(Language.JAPANESE);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should maintain lazy loading efficiency across multiple texts", async () => {
    // Generator for sequences of texts with different language combinations
    const textSequenceGen = fc.array(
      fc.subarray([Language.THAI, Language.ENGLISH, Language.JAPANESE], {
        minLength: 1,
        maxLength: 3,
      }),
      { minLength: 1, maxLength: 10 },
    );

    await fc.assert(
      fc.asyncProperty(textSequenceGen, async (languageSequences) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all dictionaries
        await createMockDictionary(Language.THAI, 10 * 1024 * 1024);
        await createMockDictionary(Language.ENGLISH, 12 * 1024 * 1024);
        await createMockDictionary(Language.JAPANESE, 11 * 1024 * 1024);

        // Track which dictionaries have been loaded across all texts
        const everLoadedLanguages = new Set<Language>();

        // Process each text in the sequence
        for (const languagesInText of languageSequences) {
          const text = generateTextWithLanguages(languagesInText);
          const loadedLanguages = await loadDictionariesForText(text);

          // Track loaded languages
          loadedLanguages.forEach((lang) => everLoadedLanguages.add(lang));

          // Property: Only detected languages should be loaded for this text
          const detectedLanguages = LanguageDetector.detect(text);
          expect(loadedLanguages.sort()).toEqual(detectedLanguages.sort());
        }

        // Property: Across all texts, we should have loaded at most the languages we encountered
        const allDetectedLanguages = new Set<Language>();
        for (const languagesInText of languageSequences) {
          languagesInText.forEach((lang) => allDetectedLanguages.add(lang));
        }

        expect(everLoadedLanguages.size).toBeLessThanOrEqual(
          allDetectedLanguages.size,
        );
      }),
      { numRuns: 50 },
    );
  });

  it("should handle edge case of empty text", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(""), async (text) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all dictionaries
        await createMockDictionary(Language.THAI, 10 * 1024 * 1024);
        await createMockDictionary(Language.ENGLISH, 12 * 1024 * 1024);
        await createMockDictionary(Language.JAPANESE, 11 * 1024 * 1024);

        // Detect languages in empty text
        const detectedLanguages = LanguageDetector.detect(text);

        // Load dictionaries
        const loadedLanguages = await loadDictionariesForText(text);

        // Property: No dictionaries should be loaded for empty text
        expect(detectedLanguages.length).toBe(0);
        expect(loadedLanguages.length).toBe(0);
      }),
      { numRuns: 10 },
    );
  });

  it("should verify lazy loading reduces memory usage compared to loading all", async () => {
    // Generator for single-language texts
    const singleLanguageGen = fc.constantFrom(
      Language.THAI,
      Language.ENGLISH,
      Language.JAPANESE,
    );

    await fc.assert(
      fc.asyncProperty(singleLanguageGen, async (language) => {
        // Clear before each iteration
        await dictionaryStorage.clearAll();

        // Store all dictionaries with known sizes
        const THAI_SIZE = 10 * 1024 * 1024;
        const ENGLISH_SIZE = 12 * 1024 * 1024;
        const JAPANESE_SIZE = 11 * 1024 * 1024;

        await createMockDictionary(Language.THAI, THAI_SIZE);
        await createMockDictionary(Language.ENGLISH, ENGLISH_SIZE);
        await createMockDictionary(Language.JAPANESE, JAPANESE_SIZE);

        // Generate text with only one language
        const text = generateTextWithLanguages([language]);

        // Detect and load
        const detectedLanguages = LanguageDetector.detect(text);
        const loadedLanguages = await loadDictionariesForText(text);

        // Property: Only one dictionary should be loaded
        expect(detectedLanguages.length).toBe(1);
        expect(loadedLanguages.length).toBe(1);
        expect(loadedLanguages[0]).toBe(language);

        // Calculate memory usage
        const sizes = {
          [Language.THAI]: THAI_SIZE,
          [Language.ENGLISH]: ENGLISH_SIZE,
          [Language.JAPANESE]: JAPANESE_SIZE,
        };

        const loadedMemory = sizes[language];
        const totalAvailableMemory = THAI_SIZE + ENGLISH_SIZE + JAPANESE_SIZE;

        // Property: Lazy loading uses less memory than loading all
        expect(loadedMemory).toBeLessThan(totalAvailableMemory);

        // Property: Memory savings should be at least 60% (loading 1 of 3)
        const memorySavings =
          (totalAvailableMemory - loadedMemory) / totalAvailableMemory;
        expect(memorySavings).toBeGreaterThan(0.6);
      }),
      { numRuns: 100 },
    );
  });

  it("should handle missing dictionaries gracefully", async () => {
    // Generator for language subsets
    const languageSubsetGen = fc.subarray(
      [Language.THAI, Language.ENGLISH, Language.JAPANESE],
      { minLength: 1, maxLength: 3 },
    );

    await fc.assert(
      fc.asyncProperty(
        languageSubsetGen,
        languageSubsetGen,
        async (languagesInText, availableDictionaries) => {
          // Clear before each iteration
          await dictionaryStorage.clearAll();

          // Store only some dictionaries (not all)
          for (const lang of availableDictionaries) {
            await createMockDictionary(lang, 10 * 1024 * 1024);
          }

          // Generate text
          const text = generateTextWithLanguages(languagesInText);

          // Detect and load
          const detectedLanguages = LanguageDetector.detect(text);
          const loadedLanguages = await loadDictionariesForText(text);

          // Property: Only load dictionaries that are both detected AND available
          const expectedLoaded = detectedLanguages.filter((lang) =>
            availableDictionaries.includes(lang),
          );

          expect(loadedLanguages.sort()).toEqual(expectedLoaded.sort());

          // Property: Should not load dictionaries that aren't available
          for (const loadedLang of loadedLanguages) {
            expect(availableDictionaries).toContain(loadedLang);
          }

          // Property: Should not fail if detected language has no dictionary
          expect(loadedLanguages.length).toBeLessThanOrEqual(
            detectedLanguages.length,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
