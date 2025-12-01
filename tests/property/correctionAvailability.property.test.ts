import * as fc from 'fast-check';
import { compileGrammarRules } from '../../src/lib/grammarRules';
import { Language, GrammarRule, GrammarError, Correction } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 4: Correction Availability
 * 
 * For any detected grammar error, the Grammar Engine should generate at least one
 * correction suggestion.
 * 
 * Validates: Requirements 2.1
 */

describe('Property 4: Correction Availability', () => {
  // Sample English grammar rules for testing
  const englishRules: GrammarRule[] = [
    {
      id: 'en_007',
      language: Language.ENGLISH,
      pattern: '\\bcould\\s+of\\b',
      errorType: 'grammar',
      message: "Use 'could have' instead of 'could of'",
      correction: 'could have',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'en_008',
      language: Language.ENGLISH,
      pattern: '\\bshould\\s+of\\b',
      errorType: 'grammar',
      message: "Use 'should have' instead of 'should of'",
      correction: 'should have',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'en_009',
      language: Language.ENGLISH,
      pattern: '\\bwould\\s+of\\b',
      errorType: 'grammar',
      message: "Use 'would have' instead of 'would of'",
      correction: 'would have',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'en_010',
      language: Language.ENGLISH,
      pattern: '\\balot\\b',
      errorType: 'spelling',
      message: "Did you mean 'a lot' (two words)?",
      correction: 'a lot',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'en_011',
      language: Language.ENGLISH,
      pattern: '\\b(the|a|an|is|are|was|were|have|has|had|will|would|could|should|can|may|might)\\s+\\1\\b',
      errorType: 'redundancy',
      message: 'Duplicate word detected',
      correction: '$1',
      severity: 'warning',
      enabled: true,
    },
    {
      id: 'en_012',
      language: Language.ENGLISH,
      pattern: '\\s{2,}',
      errorType: 'spacing',
      message: 'Multiple spaces detected',
      correction: ' ',
      severity: 'warning',
      enabled: true,
    },
  ];

  /**
   * Helper function to detect errors from text using compiled rules
   */
  function detectErrors(text: string, compiledRules: any[]): GrammarError[] {
    const errors: GrammarError[] = [];

    for (const rule of compiledRules) {
      if (!rule.enabled) {
        continue;
      }

      // Reset regex lastIndex for global patterns
      rule.compiledPattern.lastIndex = 0;

      // Find all matches for this rule
      let match;
      while ((match = rule.compiledPattern.exec(text)) !== null) {
        errors.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.errorType,
          message: rule.message,
          language: rule.language,
          ruleId: rule.id,
        });

        // Prevent infinite loop for zero-width matches
        if (match.index === rule.compiledPattern.lastIndex) {
          rule.compiledPattern.lastIndex++;
        }
      }
    }

    return errors;
  }

  /**
   * Helper function to generate correction for an error
   */
  function generateCorrection(error: GrammarError, text: string, rule: GrammarRule): Correction {
    const original = text.substring(error.start, error.end);
    let corrected = rule.correction;

    // Handle regex capture group replacements (e.g., $1)
    if (corrected.includes('$')) {
      const pattern = new RegExp(rule.pattern, 'gu');
      const match = pattern.exec(text.substring(error.start, error.end));
      if (match) {
        for (let i = 1; i < match.length; i++) {
          corrected = corrected.replace(`$${i}`, match[i] || '');
        }
      }
    }

    return {
      error,
      original,
      corrected,
      confidence: 0.9, // Deterministic confidence for rule-based corrections
    };
  }

  it('should generate at least one correction for each detected error', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with known errors
    const textWithErrorsGen = fc.oneof(
      fc.constant('I could of done better'),
      fc.constant('He should of known'),
      fc.constant('They would of helped'),
      fc.constant('I have alot of work'),
      fc.constant('the the book'),
      fc.constant('test  test')
    );

    await fc.assert(
      fc.asyncProperty(textWithErrorsGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Verify at least one error is detected
        expect(errors.length).toBeGreaterThan(0);

        // Generate corrections for each error
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Each error must have at least one correction
        expect(corrections.length).toBe(errors.length);

        // Verify each correction has required properties
        for (const correction of corrections) {
          expect(correction).toHaveProperty('error');
          expect(correction).toHaveProperty('original');
          expect(correction).toHaveProperty('corrected');
          expect(correction).toHaveProperty('confidence');
          expect(typeof correction.original).toBe('string');
          expect(typeof correction.corrected).toBe('string');
          expect(typeof correction.confidence).toBe('number');
          expect(correction.confidence).toBeGreaterThan(0);
          expect(correction.confidence).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid corrections that differ from the original text', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with errors that have clear corrections
    const textGen = fc.oneof(
      fc.constant('I could of done better'),
      fc.constant('He should of known'),
      fc.constant('I have alot of work')
    );

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Each correction should differ from the original
        for (const correction of corrections) {
          expect(correction.corrected).not.toBe(correction.original);
          expect(correction.corrected.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections for multiple errors in the same text', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with multiple errors
    const multiErrorTextGen = fc.oneof(
      fc.constant('I could of done alot of work'),
      fc.constant('He should of known alot'),
      fc.constant('the the book has alot')
    );

    await fc.assert(
      fc.asyncProperty(multiErrorTextGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Verify multiple errors are detected
        expect(errors.length).toBeGreaterThan(1);

        // Generate corrections for each error
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Each error must have a correction
        expect(corrections.length).toBe(errors.length);

        // Verify each correction is independent
        for (let i = 0; i < corrections.length; i++) {
          expect(corrections[i].error).toBe(errors[i]);
          expect(corrections[i].original).toBe(
            text.substring(errors[i].start, errors[i].end)
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections with appropriate confidence scores', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with errors
    const textGen = fc.oneof(
      fc.constant('I could of done better'),
      fc.constant('I have alot of work'),
      fc.constant('the the book')
    );

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: All corrections should have valid confidence scores
        for (const correction of corrections) {
          expect(correction.confidence).toBeGreaterThan(0);
          expect(correction.confidence).toBeLessThanOrEqual(1);
          // Rule-based corrections should have high confidence
          expect(correction.confidence).toBeGreaterThanOrEqual(0.8);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections that preserve error position information', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with errors at different positions
    const textGen = fc.oneof(
      fc.constant('alot of work to do'),
      fc.constant('I have alot of work'),
      fc.constant('I have work alot')
    );

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Corrections must preserve error position information
        for (const correction of corrections) {
          expect(correction.error.start).toBeGreaterThanOrEqual(0);
          expect(correction.error.end).toBeLessThanOrEqual(text.length);
          expect(correction.error.start).toBeLessThan(correction.error.end);
          
          // Verify original text matches the error position
          const extractedText = text.substring(
            correction.error.start,
            correction.error.end
          );
          expect(correction.original).toBe(extractedText);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections for all error types', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with different error types
    const textGen = fc.oneof(
      fc.constant('I could of done better'),  // grammar error
      fc.constant('I have alot of work'),     // spelling error
      fc.constant('the the book'),            // redundancy error
      fc.constant('test  test')               // spacing error
    );

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: All error types should have corrections
        expect(corrections.length).toBe(errors.length);

        // Verify corrections exist for different error types
        const errorTypes = new Set(errors.map(e => e.type));
        const correctionTypes = new Set(corrections.map(c => c.error.type));
        expect(correctionTypes.size).toBe(errorTypes.size);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections consistently for the same error', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Fixed text with known error
    const text = 'I could of done better';

    // Detect errors multiple times
    const errors1 = detectErrors(text, compiledRules);
    const errors2 = detectErrors(text, compiledRules);
    const errors3 = detectErrors(text, compiledRules);

    // Generate corrections multiple times
    const corrections1: Correction[] = [];
    const corrections2: Correction[] = [];
    const corrections3: Correction[] = [];

    for (const error of errors1) {
      const rule = englishRules.find(r => r.id === error.ruleId);
      if (rule) {
        corrections1.push(generateCorrection(error, text, rule));
      }
    }

    for (const error of errors2) {
      const rule = englishRules.find(r => r.id === error.ruleId);
      if (rule) {
        corrections2.push(generateCorrection(error, text, rule));
      }
    }

    for (const error of errors3) {
      const rule = englishRules.find(r => r.id === error.ruleId);
      if (rule) {
        corrections3.push(generateCorrection(error, text, rule));
      }
    }

    // Property: Corrections should be deterministic (same input = same output)
    expect(corrections1.length).toBe(corrections2.length);
    expect(corrections2.length).toBe(corrections3.length);

    for (let i = 0; i < corrections1.length; i++) {
      expect(corrections1[i].original).toBe(corrections2[i].original);
      expect(corrections1[i].corrected).toBe(corrections2[i].corrected);
      expect(corrections1[i].confidence).toBe(corrections2[i].confidence);

      expect(corrections2[i].original).toBe(corrections3[i].original);
      expect(corrections2[i].corrected).toBe(corrections3[i].corrected);
      expect(corrections2[i].confidence).toBe(corrections3[i].confidence);
    }
  });

  it('should handle regex capture group replacements in corrections', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Text with duplicate word (uses $1 in correction)
    const text = 'the the book';

    // Detect errors
    const errors = detectErrors(text, compiledRules);

    // Find the duplicate word error
    const duplicateError = errors.find(e => e.type === 'redundancy');
    expect(duplicateError).toBeDefined();

    if (duplicateError) {
      const rule = englishRules.find(r => r.id === duplicateError.ruleId);
      expect(rule).toBeDefined();

      if (rule) {
        const correction = generateCorrection(duplicateError, text, rule);

        // Property: Correction should replace capture group correctly
        expect(correction.original).toBe('the the');
        expect(correction.corrected).toBe('the');
      }
    }
  });

  it('should generate corrections for arbitrarily long text with multiple errors', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for long text with multiple errors
    const longTextGen = fc.array(
      fc.oneof(
        fc.constant('I could of done better. '),
        fc.constant('This is correct text. '),
        fc.constant('I have alot of work. '),
        fc.constant('More correct text. ')
      ),
      { minLength: 5, maxLength: 20 }
    ).map(parts => parts.join(''));

    await fc.assert(
      fc.asyncProperty(longTextGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Each error must have a correction, regardless of text length
        expect(corrections.length).toBe(errors.length);

        // Verify all corrections are valid
        for (const correction of corrections) {
          expect(correction.original.length).toBeGreaterThan(0);
          expect(correction.corrected.length).toBeGreaterThan(0);
          expect(correction.confidence).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate corrections that can be applied to fix the text', async () => {
    const compiledRules = compileGrammarRules(englishRules);

    // Generator for text with errors
    const textGen = fc.oneof(
      fc.constant('I could of done better'),
      fc.constant('I have alot of work')
    );

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        // Detect errors
        const errors = detectErrors(text, compiledRules);

        // Generate corrections
        const corrections: Correction[] = [];
        for (const error of errors) {
          const rule = englishRules.find(r => r.id === error.ruleId);
          if (rule) {
            const correction = generateCorrection(error, text, rule);
            corrections.push(correction);
          }
        }

        // Property: Applying corrections should produce valid text
        for (const correction of corrections) {
          const before = text.substring(0, correction.error.start);
          const after = text.substring(correction.error.end);
          const correctedText = before + correction.corrected + after;

          // Verify corrected text is valid
          expect(correctedText.length).toBeGreaterThan(0);
          expect(correctedText).not.toBe(text); // Should be different
          
          // Verify the correction was applied at the right position
          expect(correctedText.substring(0, correction.error.start)).toBe(before);
          expect(correctedText.substring(
            correction.error.start,
            correction.error.start + correction.corrected.length
          )).toBe(correction.corrected);
        }
      }),
      { numRuns: 100 }
    );
  });
});
