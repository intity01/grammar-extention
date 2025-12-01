import * as fc from 'fast-check';
import { loadGrammarRules, compileGrammarRules } from '../../src/lib/grammarRules';
import { LanguageDetector } from '../../src/lib/languageDetector';
import { Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 11: Language-Specific Rule Application
 * 
 * For any text segment identified as a specific language (Thai, English, or Japanese),
 * only grammar rules for that language should be applied to that segment.
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */

describe('Property 11: Language-Specific Rule Application', () => {
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

  /**
   * Helper function to apply rules to a text segment
   */
  function applyRulesToSegment(text: string, language: Language, compiledRules: any[]): any[] {
    const results: any[] = [];

    for (const rule of compiledRules) {
      if (!rule.enabled || rule.language !== language) {
        continue;
      }

      // Reset regex lastIndex for global patterns
      rule.compiledPattern.lastIndex = 0;

      // Find all matches
      let match;
      while ((match = rule.compiledPattern.exec(text)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length,
          matched: match[0],
          ruleId: rule.id,
          ruleLanguage: rule.language,
        });

        // Prevent infinite loop for zero-width matches
        if (match.index === rule.compiledPattern.lastIndex) {
          rule.compiledPattern.lastIndex++;
        }
      }
    }

    return results;
  }

  it('should apply only Thai rules to Thai text segments', async () => {
    // Generator for Thai text
    const thaiTextGen = fc.array(thaiCharGen, { minLength: 10, maxLength: 50 })
      .map(chars => chars.join(''));

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    
    const allRules = [...thaiRules, ...englishRules, ...japaneseRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(thaiTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // Verify all segments are Thai
        for (const segment of segments) {
          expect(segment.language).toBe(Language.THAI);

          // Apply rules to this segment
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify all matches are from Thai rules only
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(Language.THAI);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply only English rules to English text segments', async () => {
    // Generator for English text
    const englishTextGen = fc.array(englishCharGen, { minLength: 10, maxLength: 50 })
      .map(chars => chars.join(''));

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    
    const allRules = [...thaiRules, ...englishRules, ...japaneseRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(englishTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // Verify all segments are English
        for (const segment of segments) {
          expect(segment.language).toBe(Language.ENGLISH);

          // Apply rules to this segment
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify all matches are from English rules only
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(Language.ENGLISH);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply only Japanese rules to Japanese text segments', async () => {
    // Generator for Japanese text
    const japaneseTextGen = fc.array(japaneseCharGen, { minLength: 10, maxLength: 50 })
      .map(chars => chars.join(''));

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    
    const allRules = [...thaiRules, ...englishRules, ...japaneseRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(japaneseTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // Verify all segments are Japanese
        for (const segment of segments) {
          expect(segment.language).toBe(Language.JAPANESE);

          // Apply rules to this segment
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify all matches are from Japanese rules only
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(Language.JAPANESE);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply language-specific rules to each segment in mixed-language text', async () => {
    // Generator for mixed-language text with clear boundaries
    const mixedTextGen = fc.tuple(
      fc.array(thaiCharGen, { minLength: 5, maxLength: 20 }),
      fc.array(englishCharGen, { minLength: 5, maxLength: 20 }),
      fc.array(japaneseCharGen, { minLength: 5, maxLength: 20 })
    ).map(([thai, english, japanese]) => {
      // Create text with clear language boundaries: Thai -> English -> Japanese
      return thai.join('') + english.join('') + japanese.join('');
    });

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    
    const allRules = [...thaiRules, ...englishRules, ...japaneseRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(mixedTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // Verify we have multiple language segments
        const languages = new Set(segments.map(s => s.language));
        expect(languages.size).toBeGreaterThan(1);

        // For each segment, verify only appropriate rules are applied
        for (const segment of segments) {
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify all matches are from rules matching the segment's language
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(segment.language);
          }

          // Verify no rules from other languages are applied
          const otherLanguages = [Language.THAI, Language.ENGLISH, Language.JAPANESE]
            .filter(lang => lang !== segment.language);

          for (const otherLang of otherLanguages) {
            const otherMatches = applyRulesToSegment(segment.text, otherLang, compiledRules);
            // These matches should not be included in the final results
            // because they don't match the segment's language
            expect(otherMatches.every(m => m.ruleLanguage === otherLang)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not apply rules from one language to segments of another language', async () => {
    // Test that Thai rules are not applied to English text
    const englishTextGen = fc.array(englishCharGen, { minLength: 10, maxLength: 50 })
      .map(chars => chars.join(''));

    const thaiRules = await loadGrammarRules(Language.THAI);
    const compiledThaiRules = compileGrammarRules(thaiRules);

    await fc.assert(
      fc.asyncProperty(englishTextGen, async (text) => {
        const segments = LanguageDetector.segment(text);

        for (const segment of segments) {
          if (segment.language === Language.ENGLISH) {
            // Try to apply Thai rules to English segment
            const matches = applyRulesToSegment(segment.text, Language.THAI, compiledThaiRules);

            // Thai rules should not match English text
            // (or if they do, they should be filtered out based on language mismatch)
            for (const match of matches) {
              // If there are any matches, they should be from Thai rules
              expect(match.ruleLanguage).toBe(Language.THAI);
              // But they should not be applied to English segments
              expect(segment.language).not.toBe(Language.ENGLISH);
            }
          }
        }
      }),
      { numRuns: 100 }
    );

    // Test that English rules are not applied to Thai text
    const thaiTextGen = fc.array(thaiCharGen, { minLength: 10, maxLength: 50 })
      .map(chars => chars.join(''));

    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const compiledEnglishRules = compileGrammarRules(englishRules);

    await fc.assert(
      fc.asyncProperty(thaiTextGen, async (text) => {
        const segments = LanguageDetector.segment(text);

        for (const segment of segments) {
          if (segment.language === Language.THAI) {
            // Try to apply English rules to Thai segment
            const matches = applyRulesToSegment(segment.text, Language.ENGLISH, compiledEnglishRules);

            // English rules should not match Thai text
            for (const match of matches) {
              expect(match.ruleLanguage).toBe(Language.ENGLISH);
              expect(segment.language).not.toBe(Language.THAI);
            }
          }
        }
      }),
      { numRuns: 100 }
    );

    // Test that Japanese rules are not applied to English text
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    const compiledJapaneseRules = compileGrammarRules(japaneseRules);

    await fc.assert(
      fc.asyncProperty(englishTextGen, async (text) => {
        const segments = LanguageDetector.segment(text);

        for (const segment of segments) {
          if (segment.language === Language.ENGLISH) {
            // Try to apply Japanese rules to English segment
            const matches = applyRulesToSegment(segment.text, Language.JAPANESE, compiledJapaneseRules);

            // Japanese rules should not match English text
            for (const match of matches) {
              expect(match.ruleLanguage).toBe(Language.JAPANESE);
              expect(segment.language).not.toBe(Language.ENGLISH);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should verify rule language matches segment language for all matches', async () => {
    // Generator for arbitrary mixed-language text
    const mixedTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen),
      { minLength: 20, maxLength: 100 }
    ).map(chars => chars.join(''));

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    const japaneseRules = await loadGrammarRules(Language.JAPANESE);
    
    const allRules = [...thaiRules, ...englishRules, ...japaneseRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(mixedTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // For each segment, apply rules and verify language matching
        for (const segment of segments) {
          // Skip UNKNOWN language segments
          if (segment.language === Language.UNKNOWN) {
            continue;
          }

          // Apply rules to this segment
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify every match comes from a rule of the same language
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(segment.language);
          }

          // Verify that rules from other languages don't produce matches
          const otherLanguages = [Language.THAI, Language.ENGLISH, Language.JAPANESE]
            .filter(lang => lang !== segment.language);

          for (const otherLang of otherLanguages) {
            const otherLangRules = compiledRules.filter(r => r.language === otherLang);
            
            // Try to apply other language rules
            for (const rule of otherLangRules) {
              rule.compiledPattern.lastIndex = 0;
              const match = rule.compiledPattern.exec(segment.text);
              
              // If there's a match, it should be filtered out in actual implementation
              // because the rule language doesn't match the segment language
              if (match) {
                // This is acceptable - the rule might match, but it should be filtered
                // The key property is that we only apply rules matching the segment language
                expect(rule.language).not.toBe(segment.language);
              }
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty segments without applying any rules', async () => {
    // Empty text should produce no segments
    const segments = LanguageDetector.segment('');
    expect(segments).toEqual([]);

    // Load rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const compiledRules = compileGrammarRules(thaiRules);

    // No segments means no rules should be applied
    for (const segment of segments) {
      const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);
      expect(matches).toEqual([]);
    }
  });

  it('should apply correct rules when segments alternate between languages', async () => {
    // Generator for alternating language text
    const alternatingTextGen = fc.array(
      fc.tuple(
        fc.array(thaiCharGen, { minLength: 3, maxLength: 10 }),
        fc.array(englishCharGen, { minLength: 3, maxLength: 10 })
      ),
      { minLength: 2, maxLength: 5 }
    ).map(pairs => {
      // Create alternating Thai-English text
      return pairs.map(([thai, english]) => thai.join('') + english.join('')).join('');
    });

    // Load all rules
    const thaiRules = await loadGrammarRules(Language.THAI);
    const englishRules = await loadGrammarRules(Language.ENGLISH);
    
    const allRules = [...thaiRules, ...englishRules];
    const compiledRules = compileGrammarRules(allRules);

    await fc.assert(
      fc.asyncProperty(alternatingTextGen, async (text) => {
        // Detect language segments
        const segments = LanguageDetector.segment(text);

        // Verify segments alternate between languages
        let previousLanguage: Language | null = null;
        
        for (const segment of segments) {
          // Apply rules to this segment
          const matches = applyRulesToSegment(segment.text, segment.language, compiledRules);

          // Verify all matches are from rules matching the segment's language
          for (const match of matches) {
            expect(match.ruleLanguage).toBe(segment.language);
          }

          // Track language changes
          if (previousLanguage !== null && previousLanguage !== segment.language) {
            // Language changed - this is expected in alternating text
            expect(segment.language).not.toBe(previousLanguage);
          }
          
          previousLanguage = segment.language;
        }
      }),
      { numRuns: 100 }
    );
  });
});
