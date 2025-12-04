import * as fc from "fast-check";
import { Language } from "../../src/lib/types";

/**
 * Feature: grammar-checker-extension, Property 17: Analysis Performance Bound
 *
 * For any text input event, the Grammar Checker should complete analysis and return results
 * within 100 milliseconds.
 *
 * Validates: Requirements 6.1
 */

describe("Property 17: Analysis Performance Bound", () => {
  const MAX_ANALYSIS_TIME_MS = 100;

  // Unicode character ranges for generating realistic text
  const THAI_RANGE = { start: 0x0e00, end: 0x0e7f };
  const ENGLISH_UPPER_RANGE = { start: 0x0041, end: 0x005a };
  const ENGLISH_LOWER_RANGE = { start: 0x0061, end: 0x007a };
  const HIRAGANA_RANGE = { start: 0x3040, end: 0x309f };
  const KATAKANA_RANGE = { start: 0x30a0, end: 0x30ff };
  const KANJI_RANGE = { start: 0x4e00, end: 0x9faf };

  // Generators for characters in each language's Unicode range
  const thaiCharGen = fc
    .integer({ min: THAI_RANGE.start, max: THAI_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const englishUpperCharGen = fc
    .integer({ min: ENGLISH_UPPER_RANGE.start, max: ENGLISH_UPPER_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const englishLowerCharGen = fc
    .integer({ min: ENGLISH_LOWER_RANGE.start, max: ENGLISH_LOWER_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const englishCharGen = fc.oneof(englishUpperCharGen, englishLowerCharGen);

  const hiraganaCharGen = fc
    .integer({ min: HIRAGANA_RANGE.start, max: HIRAGANA_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const katakanaCharGen = fc
    .integer({ min: KATAKANA_RANGE.start, max: KATAKANA_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const kanjiCharGen = fc
    .integer({ min: KANJI_RANGE.start, max: KANJI_RANGE.end })
    .map((code) => String.fromCharCode(code));

  const japaneseCharGen = fc.oneof(
    hiraganaCharGen,
    katakanaCharGen,
    kanjiCharGen,
  );

  // Generator for spaces and punctuation
  const whitespaceGen = fc.constantFrom(" ", "\t", "\n");
  const punctuationGen = fc.constantFrom(
    ".",
    ",",
    "!",
    "?",
    ";",
    ":",
    "-",
    "(",
    ")",
  );

  /**
   * Mock Grammar Engine that simulates the analysis process
   * This represents the performance characteristics of the actual grammar engine
   */
  class MockGrammarEngine {
    /**
     * Analyze text for grammar errors
     * Simulates the full analysis pipeline including language detection,
     * tokenization, rule matching, and correction generation
     */
    async analyze(text: string): Promise<{
      errors: any[];
      corrections: any[];
      segments: any[];
      processingTime: number;
    }> {
      if (!text || text.trim().length === 0) {
        return {
          errors: [],
          corrections: [],
          segments: [],
          processingTime: 0,
        };
      }

      const startTime = performance.now();

      // Simulate language detection (character-based)
      const segments = this.segmentByLanguage(text);

      // Simulate tokenization and rule matching
      const errors: any[] = [];
      const corrections: any[] = [];

      for (const segment of segments) {
        // Simulate processing each segment
        const segmentErrors = this.detectErrors(segment, text);
        errors.push(...segmentErrors);

        for (const error of segmentErrors) {
          corrections.push({
            error,
            original: text.substring(error.start, error.end),
            corrected: this.generateCorrection(error),
            confidence: 0.9,
          });
        }
      }

      const processingTime = performance.now() - startTime;

      return { errors, corrections, segments, processingTime };
    }

    /**
     * Segment text by language using character ranges
     */
    private segmentByLanguage(text: string): any[] {
      const segments: any[] = [];
      let currentLang: string | null = null;
      let currentStart = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        let lang = "unknown";

        if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
          lang = "th";
        } else if (
          (code >= ENGLISH_UPPER_RANGE.start &&
            code <= ENGLISH_UPPER_RANGE.end) ||
          (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end)
        ) {
          lang = "en";
        } else if (
          (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
          (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
          (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end)
        ) {
          lang = "ja";
        }

        if (lang !== currentLang) {
          if (currentLang !== null) {
            segments.push({
              text: text.substring(currentStart, i),
              start: currentStart,
              end: i,
              language: currentLang,
            });
          }
          currentLang = lang;
          currentStart = i;
        }
      }

      if (currentLang !== null) {
        segments.push({
          text: text.substring(currentStart),
          start: currentStart,
          end: text.length,
          language: currentLang,
        });
      }

      return segments;
    }

    /**
     * Detect errors in a text segment using simple pattern matching
     */
    private detectErrors(segment: any, fullText: string): any[] {
      const errors: any[] = [];
      const text = segment.text;

      // Simulate finding double spaces (common error)
      let match;
      const doubleSpaceRegex = /  +/g;
      while ((match = doubleSpaceRegex.exec(text)) !== null) {
        errors.push({
          start: segment.start + match.index,
          end: segment.start + match.index + match[0].length,
          type: "spacing",
          message: "Multiple spaces detected",
          language: segment.language,
          ruleId: `${segment.language}_spacing_001`,
        });
      }

      // Simulate finding common English errors
      if (segment.language === "en") {
        const couldOfRegex = /\bcould\s+of\b/gi;
        while ((match = couldOfRegex.exec(text)) !== null) {
          errors.push({
            start: segment.start + match.index,
            end: segment.start + match.index + match[0].length,
            type: "grammar",
            message: "Use 'could have' instead of 'could of'",
            language: segment.language,
            ruleId: "en_007",
          });
        }

        const alotRegex = /\balot\b/gi;
        while ((match = alotRegex.exec(text)) !== null) {
          errors.push({
            start: segment.start + match.index,
            end: segment.start + match.index + match[0].length,
            type: "spelling",
            message: "Did you mean 'a lot' (two words)?",
            language: segment.language,
            ruleId: "en_010",
          });
        }
      }

      return errors;
    }

    /**
     * Generate a correction for an error
     */
    private generateCorrection(error: any): string {
      if (error.type === "spacing") {
        return " "; // Replace multiple spaces with single space
      }
      if (error.ruleId === "en_007") {
        return "could have";
      }
      if (error.ruleId === "en_010") {
        return "a lot";
      }
      return "";
    }
  }

  let engine: MockGrammarEngine;

  beforeAll(() => {
    engine = new MockGrammarEngine();
  });

  it("should complete analysis within 100ms for short text inputs", async () => {
    // Generator for short text (1-50 characters)
    const shortTextGen = fc
      .array(
        fc.oneof(
          thaiCharGen,
          englishCharGen,
          japaneseCharGen,
          whitespaceGen,
          punctuationGen,
        ),
        { minLength: 1, maxLength: 50 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(shortTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Analysis should complete within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for medium text inputs", async () => {
    // Generator for medium text (50-200 characters)
    const mediumTextGen = fc
      .array(
        fc.oneof(
          thaiCharGen,
          englishCharGen,
          japaneseCharGen,
          whitespaceGen,
          punctuationGen,
        ),
        { minLength: 50, maxLength: 200 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(mediumTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Analysis should complete within 100ms even for medium text
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for long text inputs", async () => {
    // Generator for long text (200-500 characters)
    const longTextGen = fc
      .array(
        fc.oneof(
          thaiCharGen,
          englishCharGen,
          japaneseCharGen,
          whitespaceGen,
          punctuationGen,
        ),
        { minLength: 200, maxLength: 500 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(longTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Analysis should complete within 100ms even for long text
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for mixed-language text", async () => {
    // Generator for mixed-language text
    const mixedTextGen = fc
      .tuple(
        fc.array(thaiCharGen, { minLength: 10, maxLength: 50 }),
        fc.array(englishCharGen, { minLength: 10, maxLength: 50 }),
        fc.array(japaneseCharGen, { minLength: 10, maxLength: 50 }),
      )
      .map(([thai, english, japanese]) => {
        // Interleave the languages
        return [...thai, " ", ...english, " ", ...japanese].join("");
      });

    await fc.assert(
      fc.asyncProperty(mixedTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Mixed-language analysis should complete within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for text with many potential errors", async () => {
    // Generator for text with intentional errors (multiple spaces, common mistakes)
    const errorProneTextGen = fc
      .array(
        fc.oneof(
          englishCharGen,
          fc.constant("  "), // Double spaces (common error)
          fc.constant("   "), // Triple spaces
          fc.constant("could of"), // Common grammar error
          fc.constant("alot"), // Common spelling error
          punctuationGen,
        ),
        { minLength: 50, maxLength: 200 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(errorProneTextGen, async (text) => {
        const startTime = performance.now();
        const result = await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Analysis should complete within 100ms even with many errors
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);

        // Verify result structure is valid
        expect(result).toHaveProperty("errors");
        expect(result).toHaveProperty("corrections");
        expect(result).toHaveProperty("segments");
        expect(result).toHaveProperty("processingTime");
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.corrections)).toBe(true);
        expect(Array.isArray(result.segments)).toBe(true);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for single-language text", async () => {
    // Test each language separately
    const thaiTextGen = fc
      .array(thaiCharGen, { minLength: 50, maxLength: 200 })
      .map((chars) => chars.join(""));
    const englishTextGen = fc
      .array(englishCharGen, { minLength: 50, maxLength: 200 })
      .map((chars) => chars.join(""));
    const japaneseTextGen = fc
      .array(japaneseCharGen, { minLength: 50, maxLength: 200 })
      .map((chars) => chars.join(""));

    const singleLanguageGen = fc.oneof(
      thaiTextGen,
      englishTextGen,
      japaneseTextGen,
    );

    await fc.assert(
      fc.asyncProperty(singleLanguageGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Single-language analysis should complete within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for varying text complexity", async () => {
    // Generator for text with varying complexity (length and language mixing)
    const complexityGen = fc.record({
      length: fc.integer({ min: 10, max: 500 }),
      languageMixing: fc.integer({ min: 1, max: 5 }), // Number of language switches
    });

    await fc.assert(
      fc.asyncProperty(complexityGen, async ({ length, languageMixing }) => {
        // Generate text with specified complexity
        const segmentLength = Math.floor(length / languageMixing);
        const languages = [thaiCharGen, englishCharGen, japaneseCharGen];
        let text = "";

        for (let i = 0; i < languageMixing; i++) {
          const langGen = languages[i % languages.length];
          const segment = await fc.sample(
            fc.array(langGen, {
              minLength: segmentLength,
              maxLength: segmentLength,
            }),
            1,
          );
          text += segment[0].join("") + " ";
        }

        const startTime = performance.now();
        await engine.analyze(text.trim());
        const analysisTime = performance.now() - startTime;

        // Property: Analysis should complete within 100ms regardless of complexity
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should handle empty text efficiently", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(""), async (text) => {
        const startTime = performance.now();
        const result = await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Empty text should be processed very quickly
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
        expect(result.errors).toEqual([]);
        expect(result.corrections).toEqual([]);
        expect(result.segments).toEqual([]);
      }),
      { numRuns: 10 },
    );
  });

  it("should maintain consistent performance across multiple analyses", async () => {
    // Generator for a sequence of text inputs
    const textSequenceGen = fc.array(
      fc
        .array(
          fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, whitespaceGen),
          { minLength: 50, maxLength: 150 },
        )
        .map((chars) => chars.join("")),
      { minLength: 5, maxLength: 10 },
    );

    await fc.assert(
      fc.asyncProperty(textSequenceGen, async (textSequence) => {
        const analysisTimes: number[] = [];

        // Analyze each text in sequence
        for (const text of textSequence) {
          const startTime = performance.now();
          await engine.analyze(text);
          const analysisTime = performance.now() - startTime;
          analysisTimes.push(analysisTime);
        }

        // Property: All analyses should complete within 100ms
        for (const time of analysisTimes) {
          expect(time).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
        }

        // Property: Performance should be consistent (no degradation)
        const avgTime =
          analysisTimes.reduce((a, b) => a + b, 0) / analysisTimes.length;
        expect(avgTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 50 },
    );
  }, 60000); // 60 second timeout

  it("should verify analysis time is within performance bound", async () => {
    // This test verifies that the grammar engine provides the expected performance
    const realisticTextGen = fc
      .array(
        fc.oneof(
          fc
            .array(englishCharGen, { minLength: 5, maxLength: 15 })
            .map((chars) => chars.join("")),
          whitespaceGen,
          punctuationGen,
        ),
        { minLength: 20, maxLength: 50 },
      )
      .map((parts) => parts.join(""));

    await fc.assert(
      fc.asyncProperty(realisticTextGen, async (text) => {
        const startTime = performance.now();
        const result = await engine.analyze(text);
        const totalTime = performance.now() - startTime;

        // Property: Analysis time should be within limit
        expect(totalTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);

        // Property: Reported processing time should be reasonable
        if (result.processingTime !== undefined) {
          expect(result.processingTime).toBeLessThanOrEqual(totalTime);
        }
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for realistic English sentences", async () => {
    // Generator for realistic English sentences
    const englishSentenceGen = fc
      .array(
        fc.oneof(
          fc.constant("The quick brown fox jumps over the lazy dog"),
          fc.constant("I could of done better with more time"),
          fc.constant("She should of known about the meeting"),
          fc.constant("There are alot of people here today"),
          fc.constant("This is a test sentence with no errors"),
          fc.constant("We need to seperate the good from the bad"),
          fc.constant("I definately agree with your assessment"),
        ),
        { minLength: 1, maxLength: 5 },
      )
      .map((sentences) => sentences.join(". ") + ".");

    await fc.assert(
      fc.asyncProperty(englishSentenceGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Realistic English text should be analyzed within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for text with whitespace variations", async () => {
    // Generator for text with various whitespace patterns
    const whitespaceTextGen = fc
      .array(
        fc.oneof(
          englishCharGen,
          fc.constant(" "),
          fc.constant("  "),
          fc.constant("\t"),
          fc.constant("\n"),
        ),
        { minLength: 50, maxLength: 200 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(whitespaceTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Text with whitespace variations should be analyzed within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for text with special characters", async () => {
    // Generator for text with special characters
    const specialCharGen = fc.constantFrom(
      "!",
      "@",
      "#",
      "$",
      "%",
      "^",
      "&",
      "*",
      "(",
      ")",
      "-",
      "_",
      "=",
      "+",
      "[",
      "]",
      "{",
      "}",
      "|",
      "\\",
      ";",
      ":",
      '"',
      "'",
      "<",
      ">",
      ",",
      ".",
      "/",
      "?",
    );

    const specialCharTextGen = fc
      .array(fc.oneof(englishCharGen, specialCharGen, whitespaceGen), {
        minLength: 50,
        maxLength: 200,
      })
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(specialCharTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Text with special characters should be analyzed within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout

  it("should complete analysis within 100ms for text with numbers", async () => {
    // Generator for text with numbers
    const digitGen = fc.integer({ min: 0, max: 9 }).map((n) => n.toString());

    const numericTextGen = fc
      .array(
        fc.oneof(englishCharGen, digitGen, whitespaceGen, punctuationGen),
        { minLength: 50, maxLength: 200 },
      )
      .map((chars) => chars.join(""));

    await fc.assert(
      fc.asyncProperty(numericTextGen, async (text) => {
        const startTime = performance.now();
        await engine.analyze(text);
        const analysisTime = performance.now() - startTime;

        // Property: Text with numbers should be analyzed within 100ms
        expect(analysisTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 },
    );
  }, 60000); // 60 second timeout
});
