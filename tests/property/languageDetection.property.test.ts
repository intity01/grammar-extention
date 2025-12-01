import * as fc from 'fast-check';
import { LanguageDetector } from '../../src/lib/languageDetector';
import { Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 13: Character-Based Language Detection
 * 
 * For any character in the input text, language detection should determine its language
 * using only Unicode character range checks without AI or ML algorithms.
 * 
 * Validates: Requirements 3.5
 */

describe('Property 13: Character-Based Language Detection', () => {
  // Unicode character ranges for each language
  const THAI_RANGE = { start: 0x0e00, end: 0x0e7f };
  const ENGLISH_UPPER_RANGE = { start: 0x0041, end: 0x005a };
  const ENGLISH_LOWER_RANGE = { start: 0x0061, end: 0x007a };
  const HIRAGANA_RANGE = { start: 0x3040, end: 0x309f };
  const KATAKANA_RANGE = { start: 0x30a0, end: 0x30ff };
  const KANJI_RANGE = { start: 0x4e00, end: 0x9faf };

  // Generators for characters in each language's Unicode range
  const thaiCharGen = fc.integer({ min: THAI_RANGE.start, max: THAI_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishUpperCharGen = fc.integer({ min: ENGLISH_UPPER_RANGE.start, max: ENGLISH_UPPER_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishLowerCharGen = fc.integer({ min: ENGLISH_LOWER_RANGE.start, max: ENGLISH_LOWER_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishCharGen = fc.oneof(englishUpperCharGen, englishLowerCharGen);

  const hiraganaCharGen = fc.integer({ min: HIRAGANA_RANGE.start, max: HIRAGANA_RANGE.end })
    .map(code => String.fromCharCode(code));

  const katakanaCharGen = fc.integer({ min: KATAKANA_RANGE.start, max: KATAKANA_RANGE.end })
    .map(code => String.fromCharCode(code));

  const kanjiCharGen = fc.integer({ min: KANJI_RANGE.start, max: KANJI_RANGE.end })
    .map(code => String.fromCharCode(code));

  const japaneseCharGen = fc.oneof(hiraganaCharGen, katakanaCharGen, kanjiCharGen);

  // Generator for unknown characters (outside all language ranges)
  const unknownCharGen = fc.oneof(
    fc.integer({ min: 0x0030, max: 0x0039 }).map(code => String.fromCharCode(code)), // digits
    fc.constantFrom(' ', '\t', '\n', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '=', '+', '[', ']', '{', '}', '|', ';', ':', ',', '.', '<', '>', '/', '?', '~', '`')
  );

  it('should detect Thai characters using only Unicode range checks', () => {
    fc.assert(
      fc.property(thaiCharGen, (char) => {
        // Verify the character is in Thai Unicode range
        const code = char.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(THAI_RANGE.start);
        expect(code).toBeLessThanOrEqual(THAI_RANGE.end);

        // Verify isLanguage correctly identifies it as Thai
        const isThai = LanguageDetector.isLanguage(char, Language.THAI);
        expect(isThai).toBe(true);

        // Verify it's not identified as other languages
        expect(LanguageDetector.isLanguage(char, Language.ENGLISH)).toBe(false);
        expect(LanguageDetector.isLanguage(char, Language.JAPANESE)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect English characters using only Unicode range checks', () => {
    fc.assert(
      fc.property(englishCharGen, (char) => {
        // Verify the character is in English Unicode range
        const code = char.charCodeAt(0);
        const isInRange = 
          (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
          (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end);
        expect(isInRange).toBe(true);

        // Verify isLanguage correctly identifies it as English
        const isEnglish = LanguageDetector.isLanguage(char, Language.ENGLISH);
        expect(isEnglish).toBe(true);

        // Verify it's not identified as other languages
        expect(LanguageDetector.isLanguage(char, Language.THAI)).toBe(false);
        expect(LanguageDetector.isLanguage(char, Language.JAPANESE)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect Japanese characters using only Unicode range checks', () => {
    fc.assert(
      fc.property(japaneseCharGen, (char) => {
        // Verify the character is in one of the Japanese Unicode ranges
        const code = char.charCodeAt(0);
        const isInRange = 
          (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
          (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
          (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end);
        expect(isInRange).toBe(true);

        // Verify isLanguage correctly identifies it as Japanese
        const isJapanese = LanguageDetector.isLanguage(char, Language.JAPANESE);
        expect(isJapanese).toBe(true);

        // Verify it's not identified as other languages
        expect(LanguageDetector.isLanguage(char, Language.THAI)).toBe(false);
        expect(LanguageDetector.isLanguage(char, Language.ENGLISH)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect unknown characters (outside all language ranges)', () => {
    fc.assert(
      fc.property(unknownCharGen, (char) => {
        // Verify the character is not in any known language range
        const code = char.charCodeAt(0);
        const isInThaiRange = code >= THAI_RANGE.start && code <= THAI_RANGE.end;
        const isInEnglishRange = 
          (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
          (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end);
        const isInJapaneseRange = 
          (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
          (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
          (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end);

        expect(isInThaiRange).toBe(false);
        expect(isInEnglishRange).toBe(false);
        expect(isInJapaneseRange).toBe(false);

        // Verify isLanguage correctly identifies it as UNKNOWN
        const isUnknown = LanguageDetector.isLanguage(char, Language.UNKNOWN);
        expect(isUnknown).toBe(true);

        // Verify it's not identified as known languages
        expect(LanguageDetector.isLanguage(char, Language.THAI)).toBe(false);
        expect(LanguageDetector.isLanguage(char, Language.ENGLISH)).toBe(false);
        expect(LanguageDetector.isLanguage(char, Language.JAPANESE)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect all languages in mixed text using only character range checks', () => {
    // Generator for mixed-language strings
    const mixedTextGen = fc.tuple(
      fc.array(thaiCharGen, { minLength: 1, maxLength: 5 }),
      fc.array(englishCharGen, { minLength: 1, maxLength: 5 }),
      fc.array(japaneseCharGen, { minLength: 1, maxLength: 5 })
    ).map(([thai, english, japanese]) => {
      // Shuffle the arrays to create mixed text
      const allChars = [...thai, ...english, ...japanese];
      return allChars.join('');
    });

    fc.assert(
      fc.property(mixedTextGen, (text) => {
        const detectedLanguages = LanguageDetector.detect(text);

        // Verify that all three languages are detected
        expect(detectedLanguages).toContain(Language.THAI);
        expect(detectedLanguages).toContain(Language.ENGLISH);
        expect(detectedLanguages).toContain(Language.JAPANESE);

        // Verify each character is correctly classified
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const code = char.charCodeAt(0);

          // Determine expected language based on Unicode range
          let expectedLanguage: Language;
          if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
            expectedLanguage = Language.THAI;
          } else if (
            (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
            (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end)
          ) {
            expectedLanguage = Language.ENGLISH;
          } else if (
            (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
            (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
            (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end)
          ) {
            expectedLanguage = Language.JAPANESE;
          } else {
            expectedLanguage = Language.UNKNOWN;
          }

          // Verify isLanguage returns true for the expected language
          expect(LanguageDetector.isLanguage(char, expectedLanguage)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should use only character range checks (no AI/ML) for any text', () => {
    // Generator for arbitrary text with all character types
    const arbitraryTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, unknownCharGen),
      { minLength: 1, maxLength: 50 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.property(arbitraryTextGen, (text) => {
        // Call detect function
        const detectedLanguages = LanguageDetector.detect(text);

        // Verify that detection is deterministic (same input = same output)
        const detectedAgain = LanguageDetector.detect(text);
        expect(detectedLanguages).toEqual(detectedAgain);

        // Verify each character's language is determined by Unicode range only
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const code = char.charCodeAt(0);

          // Check if character is in Thai range
          if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
            expect(LanguageDetector.isLanguage(char, Language.THAI)).toBe(true);
            if (detectedLanguages.length > 0) {
              expect(detectedLanguages).toContain(Language.THAI);
            }
          }
          // Check if character is in English range
          else if (
            (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
            (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end)
          ) {
            expect(LanguageDetector.isLanguage(char, Language.ENGLISH)).toBe(true);
            if (detectedLanguages.length > 0) {
              expect(detectedLanguages).toContain(Language.ENGLISH);
            }
          }
          // Check if character is in Japanese range
          else if (
            (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
            (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
            (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end)
          ) {
            expect(LanguageDetector.isLanguage(char, Language.JAPANESE)).toBe(true);
            if (detectedLanguages.length > 0) {
              expect(detectedLanguages).toContain(Language.JAPANESE);
            }
          }
          // Otherwise it's unknown
          else {
            expect(LanguageDetector.isLanguage(char, Language.UNKNOWN)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: grammar-checker-extension, Property 12: Mixed Language Segmentation
 * 
 * For any text containing multiple languages, the Language Detector should segment
 * the text such that each segment contains only one language and all characters
 * are assigned to exactly one segment.
 * 
 * Validates: Requirements 3.4
 */
describe('Property 12: Mixed Language Segmentation', () => {
  // Unicode character ranges for each language
  const THAI_RANGE = { start: 0x0e00, end: 0x0e7f };
  const ENGLISH_UPPER_RANGE = { start: 0x0041, end: 0x005a };
  const ENGLISH_LOWER_RANGE = { start: 0x0061, end: 0x007a };
  const HIRAGANA_RANGE = { start: 0x3040, end: 0x309f };
  const KATAKANA_RANGE = { start: 0x30a0, end: 0x30ff };
  const KANJI_RANGE = { start: 0x4e00, end: 0x9faf };

  // Generators for characters in each language's Unicode range
  const thaiCharGen = fc.integer({ min: THAI_RANGE.start, max: THAI_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishUpperCharGen = fc.integer({ min: ENGLISH_UPPER_RANGE.start, max: ENGLISH_UPPER_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishLowerCharGen = fc.integer({ min: ENGLISH_LOWER_RANGE.start, max: ENGLISH_LOWER_RANGE.end })
    .map(code => String.fromCharCode(code));

  const englishCharGen = fc.oneof(englishUpperCharGen, englishLowerCharGen);

  const hiraganaCharGen = fc.integer({ min: HIRAGANA_RANGE.start, max: HIRAGANA_RANGE.end })
    .map(code => String.fromCharCode(code));

  const katakanaCharGen = fc.integer({ min: KATAKANA_RANGE.start, max: KATAKANA_RANGE.end })
    .map(code => String.fromCharCode(code));

  const kanjiCharGen = fc.integer({ min: KANJI_RANGE.start, max: KANJI_RANGE.end })
    .map(code => String.fromCharCode(code));

  const japaneseCharGen = fc.oneof(hiraganaCharGen, katakanaCharGen, kanjiCharGen);

  // Generator for unknown characters (outside all language ranges)
  const unknownCharGen = fc.oneof(
    fc.integer({ min: 0x0030, max: 0x0039 }).map(code => String.fromCharCode(code)), // digits
    fc.constantFrom(' ', '\t', '\n', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '=', '+', '[', ']', '{', '}', '|', ';', ':', ',', '.', '<', '>', '/', '?', '~', '`')
  );

  /**
   * Helper function to detect language of a character based on Unicode range
   */
  function detectCharLanguage(char: string): Language {
    const code = char.charCodeAt(0);
    
    if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
      return Language.THAI;
    }
    if (
      (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
      (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end)
    ) {
      return Language.ENGLISH;
    }
    if (
      (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
      (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
      (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end)
    ) {
      return Language.JAPANESE;
    }
    return Language.UNKNOWN;
  }

  it('should segment text so each segment contains only one language', () => {
    // Generator for mixed-language text
    const mixedTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, unknownCharGen),
      { minLength: 1, maxLength: 100 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.property(mixedTextGen, (text) => {
        const segments = LanguageDetector.segment(text);

        // Verify each segment contains only one language
        for (const segment of segments) {
          const segmentLanguage = segment.language;
          
          // Check every character in the segment
          for (let i = 0; i < segment.text.length; i++) {
            const char = segment.text[i];
            const charLanguage = detectCharLanguage(char);
            
            // Each character should match the segment's language
            expect(charLanguage).toBe(segmentLanguage);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should assign all characters to exactly one segment', () => {
    // Generator for mixed-language text
    const mixedTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, unknownCharGen),
      { minLength: 1, maxLength: 100 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.property(mixedTextGen, (text) => {
        const segments = LanguageDetector.segment(text);

        // Verify all characters are covered
        let totalCharsInSegments = 0;
        for (const segment of segments) {
          totalCharsInSegments += segment.text.length;
        }
        expect(totalCharsInSegments).toBe(text.length);

        // Verify segments are contiguous and non-overlapping
        let expectedStart = 0;
        for (const segment of segments) {
          expect(segment.start).toBe(expectedStart);
          expect(segment.end).toBe(expectedStart + segment.text.length);
          expect(segment.text).toBe(text.substring(segment.start, segment.end));
          expectedStart = segment.end;
        }
        
        // Verify the last segment ends at text length
        if (segments.length > 0) {
          expect(segments[segments.length - 1].end).toBe(text.length);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty text by returning empty array', () => {
    const segments = LanguageDetector.segment('');
    expect(segments).toEqual([]);
  });

  it('should create new segment when language changes', () => {
    // Generator for text with guaranteed language changes
    const languageChangeTextGen = fc.tuple(
      fc.array(thaiCharGen, { minLength: 1, maxLength: 10 }),
      fc.array(englishCharGen, { minLength: 1, maxLength: 10 }),
      fc.array(japaneseCharGen, { minLength: 1, maxLength: 10 })
    ).map(([thai, english, japanese]) => {
      // Create text with clear language boundaries: Thai -> English -> Japanese
      return thai.join('') + english.join('') + japanese.join('');
    });

    fc.assert(
      fc.property(languageChangeTextGen, (text) => {
        const segments = LanguageDetector.segment(text);

        // Should have at least 3 segments (one for each language)
        expect(segments.length).toBeGreaterThanOrEqual(3);

        // Verify segments are in correct order
        let foundThai = false;
        let foundEnglish = false;
        let foundJapanese = false;

        for (const segment of segments) {
          if (segment.language === Language.THAI) {
            foundThai = true;
            expect(foundEnglish).toBe(false); // Thai should come before English
            expect(foundJapanese).toBe(false); // Thai should come before Japanese
          } else if (segment.language === Language.ENGLISH) {
            foundEnglish = true;
            expect(foundThai).toBe(true); // English should come after Thai
            expect(foundJapanese).toBe(false); // English should come before Japanese
          } else if (segment.language === Language.JAPANESE) {
            foundJapanese = true;
            expect(foundThai).toBe(true); // Japanese should come after Thai
            expect(foundEnglish).toBe(true); // Japanese should come after English
          }
        }

        expect(foundThai).toBe(true);
        expect(foundEnglish).toBe(true);
        expect(foundJapanese).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve segment boundaries and text content', () => {
    // Generator for mixed-language text
    const mixedTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, unknownCharGen),
      { minLength: 1, maxLength: 100 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.property(mixedTextGen, (text) => {
        const segments = LanguageDetector.segment(text);

        // Reconstruct text from segments
        const reconstructed = segments.map(s => s.text).join('');
        
        // Verify reconstructed text matches original
        expect(reconstructed).toBe(text);

        // Verify segment positions are correct
        for (const segment of segments) {
          const extractedText = text.substring(segment.start, segment.end);
          expect(segment.text).toBe(extractedText);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle single-language text as one segment', () => {
    // Test with Thai only
    fc.assert(
      fc.property(
        fc.array(thaiCharGen, { minLength: 1, maxLength: 50 }).map(chars => chars.join('')),
        (text) => {
          const segments = LanguageDetector.segment(text);
          expect(segments.length).toBe(1);
          expect(segments[0].language).toBe(Language.THAI);
          expect(segments[0].text).toBe(text);
          expect(segments[0].start).toBe(0);
          expect(segments[0].end).toBe(text.length);
        }
      ),
      { numRuns: 100 }
    );

    // Test with English only
    fc.assert(
      fc.property(
        fc.array(englishCharGen, { minLength: 1, maxLength: 50 }).map(chars => chars.join('')),
        (text) => {
          const segments = LanguageDetector.segment(text);
          expect(segments.length).toBe(1);
          expect(segments[0].language).toBe(Language.ENGLISH);
          expect(segments[0].text).toBe(text);
          expect(segments[0].start).toBe(0);
          expect(segments[0].end).toBe(text.length);
        }
      ),
      { numRuns: 100 }
    );

    // Test with Japanese only
    fc.assert(
      fc.property(
        fc.array(japaneseCharGen, { minLength: 1, maxLength: 50 }).map(chars => chars.join('')),
        (text) => {
          const segments = LanguageDetector.segment(text);
          expect(segments.length).toBe(1);
          expect(segments[0].language).toBe(Language.JAPANESE);
          expect(segments[0].text).toBe(text);
          expect(segments[0].start).toBe(0);
          expect(segments[0].end).toBe(text.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
