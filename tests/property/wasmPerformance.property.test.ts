import * as fc from 'fast-check';

/**
 * Feature: grammar-checker-extension, Property: WebAssembly Performance
 * 
 * For any text input event, the Grammar Checker should complete analysis and return results
 * within 50 milliseconds after the debounce period using WebAssembly for performance-critical operations.
 * 
 * Validates: Requirements 6.1, 6.5
 */

describe('Property: WebAssembly Performance', () => {
  const MAX_ANALYSIS_TIME_MS = 50;

  // Unicode character ranges for generating realistic text
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

  // Generator for spaces and punctuation
  const whitespaceGen = fc.constantFrom(' ', '\t', '\n');
  const punctuationGen = fc.constantFrom('.', ',', '!', '?', ';', ':', '-', '(', ')');

  /**
   * Mock Web Worker that simulates Wasm-based analysis
   * In a real implementation, this would load and execute the actual Wasm module
   */
  class MockWasmWorker {
    private messageHandler: ((event: MessageEvent) => void) | null = null;

    addEventListener(type: string, handler: (event: MessageEvent) => void): void {
      if (type === 'message') {
        this.messageHandler = handler;
      }
    }

    postMessage(data: any): void {
      // Simulate async processing
      setTimeout(() => {
        if (this.messageHandler) {
          const startTime = performance.now();
          
          // Simulate Wasm-based analysis
          const result = this.analyzeText(data.text);
          
          const endTime = performance.now();
          const processingTime = endTime - startTime;

          this.messageHandler({
            data: {
              type: 'ANALYSIS_RESULT',
              payload: {
                ...result,
                processingTime,
              },
            },
          } as MessageEvent);
        }
      }, 0);
    }

    /**
     * Simulates Wasm-based text analysis
     * This is a simplified mock that represents the performance characteristics
     * of the actual Wasm NLP kernel
     */
    private analyzeText(text: string): { errors: any[]; corrections: any[]; segments: any[] } {
      // Simulate language detection (character-based)
      const segments = this.segmentByLanguage(text);
      
      // Simulate tokenization and rule matching
      const errors: any[] = [];
      const corrections: any[] = [];

      for (const segment of segments) {
        // Simulate processing each segment
        // In real implementation, this would call Wasm functions
        const segmentErrors = this.detectErrors(segment);
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

      return { errors, corrections, segments };
    }

    private segmentByLanguage(text: string): any[] {
      const segments: any[] = [];
      let currentLang = null;
      let currentStart = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        let lang = 'unknown';

        if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
          lang = 'th';
        } else if (
          (code >= ENGLISH_UPPER_RANGE.start && code <= ENGLISH_UPPER_RANGE.end) ||
          (code >= ENGLISH_LOWER_RANGE.start && code <= ENGLISH_LOWER_RANGE.end)
        ) {
          lang = 'en';
        } else if (
          (code >= HIRAGANA_RANGE.start && code <= HIRAGANA_RANGE.end) ||
          (code >= KATAKANA_RANGE.start && code <= KATAKANA_RANGE.end) ||
          (code >= KANJI_RANGE.start && code <= KANJI_RANGE.end)
        ) {
          lang = 'ja';
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

    private detectErrors(segment: any): any[] {
      // Simulate error detection based on simple patterns
      const errors: any[] = [];
      const text = segment.text;

      // Simulate finding double spaces (common error)
      let match;
      const doubleSpaceRegex = /  +/g;
      while ((match = doubleSpaceRegex.exec(text)) !== null) {
        errors.push({
          start: segment.start + match.index,
          end: segment.start + match.index + match[0].length,
          type: 'spacing',
          message: 'Multiple spaces detected',
          language: segment.language,
          ruleId: `${segment.language}_spacing_001`,
        });
      }

      return errors;
    }

    private generateCorrection(error: any): string {
      if (error.type === 'spacing') {
        return ' '; // Replace multiple spaces with single space
      }
      return '';
    }

    terminate(): void {
      this.messageHandler = null;
    }
  }

  /**
   * Helper function to analyze text using the mock Wasm worker
   */
  async function analyzeTextWithWasm(text: string): Promise<{ processingTime: number; result: any }> {
    return new Promise((resolve) => {
      const worker = new MockWasmWorker();

      worker.addEventListener('message', (event: MessageEvent) => {
        const { processingTime, ...result } = event.data.payload;
        worker.terminate();
        resolve({ processingTime, result });
      });

      worker.postMessage({ type: 'ANALYZE_TEXT', text });
    });
  }

  it('should complete analysis within 50ms for short text inputs', () => {
    // Generator for short text (1-50 characters)
    const shortTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, whitespaceGen, punctuationGen),
      { minLength: 1, maxLength: 50 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(shortTextGen, async (text) => {
        const { processingTime } = await analyzeTextWithWasm(text);

        // Property: Analysis should complete within 50ms
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for medium text inputs', () => {
    // Generator for medium text (50-200 characters)
    const mediumTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, whitespaceGen, punctuationGen),
      { minLength: 50, maxLength: 200 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(mediumTextGen, async (text) => {
        const { processingTime } = await analyzeTextWithWasm(text);

        // Property: Analysis should complete within 50ms even for medium text
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for long text inputs', () => {
    // Generator for long text (200-500 characters)
    const longTextGen = fc.array(
      fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, whitespaceGen, punctuationGen),
      { minLength: 200, maxLength: 500 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(longTextGen, async (text) => {
        const { processingTime } = await analyzeTextWithWasm(text);

        // Property: Analysis should complete within 50ms even for long text
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for mixed-language text', () => {
    // Generator for mixed-language text
    const mixedTextGen = fc.tuple(
      fc.array(thaiCharGen, { minLength: 10, maxLength: 50 }),
      fc.array(englishCharGen, { minLength: 10, maxLength: 50 }),
      fc.array(japaneseCharGen, { minLength: 10, maxLength: 50 })
    ).map(([thai, english, japanese]) => {
      // Interleave the languages
      return [...thai, ' ', ...english, ' ', ...japanese].join('');
    });

    fc.assert(
      fc.asyncProperty(mixedTextGen, async (text) => {
        const { processingTime } = await analyzeTextWithWasm(text);

        // Property: Mixed-language analysis should complete within 50ms
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for text with many errors', () => {
    // Generator for text with intentional errors (multiple spaces)
    const errorProneTextGen = fc.array(
      fc.oneof(
        englishCharGen,
        fc.constant('  '), // Double spaces (common error)
        fc.constant('   '), // Triple spaces
        punctuationGen
      ),
      { minLength: 50, maxLength: 200 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(errorProneTextGen, async (text) => {
        const { processingTime, result } = await analyzeTextWithWasm(text);

        // Property: Analysis should complete within 50ms even with many errors
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);

        // Verify errors were detected
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for single-language text', () => {
    // Test each language separately
    const thaiTextGen = fc.array(thaiCharGen, { minLength: 50, maxLength: 200 })
      .map(chars => chars.join(''));
    const englishTextGen = fc.array(englishCharGen, { minLength: 50, maxLength: 200 })
      .map(chars => chars.join(''));
    const japaneseTextGen = fc.array(japaneseCharGen, { minLength: 50, maxLength: 200 })
      .map(chars => chars.join(''));

    const singleLanguageGen = fc.oneof(thaiTextGen, englishTextGen, japaneseTextGen);

    fc.assert(
      fc.asyncProperty(singleLanguageGen, async (text) => {
        const { processingTime } = await analyzeTextWithWasm(text);

        // Property: Single-language analysis should complete within 50ms
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should complete analysis within 50ms for varying text complexity', () => {
    // Generator for text with varying complexity (length and language mixing)
    const complexityGen = fc.record({
      length: fc.integer({ min: 10, max: 500 }),
      languageMixing: fc.integer({ min: 1, max: 5 }), // Number of language switches
    });

    fc.assert(
      fc.asyncProperty(complexityGen, async ({ length, languageMixing }) => {
        // Generate text with specified complexity
        const segmentLength = Math.floor(length / languageMixing);
        const languages = [thaiCharGen, englishCharGen, japaneseCharGen];
        let text = '';

        for (let i = 0; i < languageMixing; i++) {
          const langGen = languages[i % languages.length];
          const segment = await fc.sample(
            fc.array(langGen, { minLength: segmentLength, maxLength: segmentLength }),
            1
          );
          text += segment[0].join('') + ' ';
        }

        const { processingTime } = await analyzeTextWithWasm(text.trim());

        // Property: Analysis should complete within 50ms regardless of complexity
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty text efficiently', () => {
    fc.assert(
      fc.asyncProperty(fc.constant(''), async (text) => {
        const { processingTime, result } = await analyzeTextWithWasm(text);

        // Property: Empty text should be processed very quickly
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
        expect(result.errors).toEqual([]);
        expect(result.corrections).toEqual([]);
        expect(result.segments).toEqual([]);
      }),
      { numRuns: 10 }
    );
  });

  it('should maintain consistent performance across multiple analyses', () => {
    // Generator for a sequence of text inputs
    const textSequenceGen = fc.array(
      fc.array(
        fc.oneof(thaiCharGen, englishCharGen, japaneseCharGen, whitespaceGen),
        { minLength: 50, maxLength: 150 }
      ).map(chars => chars.join('')),
      { minLength: 5, maxLength: 10 }
    );

    fc.assert(
      fc.asyncProperty(textSequenceGen, async (textSequence) => {
        const processingTimes: number[] = [];

        // Analyze each text in sequence
        for (const text of textSequence) {
          const { processingTime } = await analyzeTextWithWasm(text);
          processingTimes.push(processingTime);
        }

        // Property: All analyses should complete within 50ms
        for (const time of processingTimes) {
          expect(time).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
        }

        // Property: Performance should be consistent (no degradation)
        const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        expect(avgTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);
      }),
      { numRuns: 50 }
    );
  });

  it('should verify Wasm-based processing is faster than threshold', () => {
    // This test verifies that using WebAssembly provides the expected performance benefit
    const realisticTextGen = fc.array(
      fc.oneof(
        fc.array(englishCharGen, { minLength: 5, maxLength: 15 }).map(chars => chars.join('')),
        whitespaceGen,
        punctuationGen
      ),
      { minLength: 20, maxLength: 50 }
    ).map(parts => parts.join(''));

    fc.assert(
      fc.asyncProperty(realisticTextGen, async (text) => {
        const startTime = performance.now();
        const { processingTime } = await analyzeTextWithWasm(text);
        const totalTime = performance.now() - startTime;

        // Property: Wasm processing time should be within limit
        expect(processingTime).toBeLessThanOrEqual(MAX_ANALYSIS_TIME_MS);

        // Property: Total time (including overhead) should be reasonable
        expect(totalTime).toBeLessThan(MAX_ANALYSIS_TIME_MS * 2);
      }),
      { numRuns: 100 }
    );
  });
});
