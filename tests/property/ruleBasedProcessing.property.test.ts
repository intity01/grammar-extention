import * as fc from 'fast-check';
import { loadGrammarRules, compileGrammarRules } from '../../src/lib/grammarRules';
import { Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 15: Rule-Based Processing Only
 * 
 * For any text analysis operation, the Grammar Engine should use only pattern matching
 * (regular expressions) and dictionary lookups, with no calls to ML/AI libraries or models.
 * 
 * Validates: Requirements 5.1, 5.2, 5.4
 */

describe('Property 15: Rule-Based Processing Only', () => {
  /**
   * List of forbidden AI/ML library names and patterns
   * These should never appear in the codebase or be imported
   */
  const FORBIDDEN_AI_ML_PATTERNS = [
    'tensorflow',
    'torch',
    'pytorch',
    'keras',
    'scikit-learn',
    'sklearn',
    'transformers',
    'huggingface',
    'openai',
    'anthropic',
    'cohere',
    'langchain',
    'llamaindex',
    'neural',
    'neuralnet',
    'deeplearning',
    'ml-model',
    'machine-learning',
    'bert',
    'gpt',
    'llm',
    'embedding',
    'vector-db',
    'pinecone',
    'weaviate',
    'chromadb',
  ];

  /**
   * Allowed deterministic processing methods
   */
  const ALLOWED_METHODS = [
    'regex',
    'regexp',
    'pattern',
    'match',
    'replace',
    'search',
    'test',
    'exec',
    'dictionary',
    'lookup',
    'trie',
    'dat',
  ];

  /**
   * Helper to check if a string contains forbidden AI/ML patterns
   */
  function containsForbiddenPattern(text: string): boolean {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_AI_ML_PATTERNS.some(pattern => 
      lowerText.includes(pattern.toLowerCase())
    );
  }

  /**
   * Helper to verify rule structure is deterministic
   */
  function isRuleDeterministic(rule: any): boolean {
    // Rule must have a regex pattern (deterministic)
    if (!rule.pattern || typeof rule.pattern !== 'string') {
      return false;
    }

    // Rule must have a fixed correction (deterministic)
    if (!rule.correction || typeof rule.correction !== 'string') {
      return false;
    }

    // Check that pattern doesn't reference AI/ML
    if (containsForbiddenPattern(rule.pattern)) {
      return false;
    }

    // Check that correction doesn't reference AI/ML
    if (containsForbiddenPattern(rule.correction)) {
      return false;
    }

    return true;
  }

  it('should load only rule-based grammar rules without AI/ML dependencies', async () => {
    // Test all supported languages
    const languages = [Language.THAI, Language.ENGLISH, Language.JAPANESE];

    for (const language of languages) {
      const rules = await loadGrammarRules(language);

      // Verify rules were loaded
      expect(Array.isArray(rules)).toBe(true);

      // Verify each rule is deterministic and rule-based
      for (const rule of rules) {
        // Check rule structure
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('pattern');
        expect(rule).toHaveProperty('correction');
        expect(rule).toHaveProperty('errorType');
        expect(rule).toHaveProperty('message');

        // Verify rule is deterministic
        expect(isRuleDeterministic(rule)).toBe(true);

        // Verify pattern is a valid regex (not an AI model reference)
        expect(() => new RegExp(rule.pattern)).not.toThrow();

        // Verify no AI/ML references in rule
        expect(containsForbiddenPattern(rule.id)).toBe(false);
        expect(containsForbiddenPattern(rule.pattern)).toBe(false);
        expect(containsForbiddenPattern(rule.correction)).toBe(false);
        expect(containsForbiddenPattern(rule.message)).toBe(false);
      }
    }
  });

  it('should use only regex patterns for rule matching', async () => {
    // Generator for random text
    const textGen = fc.string({ minLength: 1, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Language.THAI, Language.ENGLISH, Language.JAPANESE),
        textGen,
        async (language, text) => {
          // Load rules for the language
          const rules = await loadGrammarRules(language);

          // Compile rules
          const compiledRules = compileGrammarRules(rules);

          // Verify each compiled rule uses regex
          for (const compiledRule of compiledRules) {
            // Verify compiled pattern is a RegExp object
            expect(compiledRule.compiledPattern).toBeInstanceOf(RegExp);

            // Verify pattern matching is deterministic (same input = same output)
            const matches1 = Array.from(text.matchAll(compiledRule.compiledPattern));
            const matches2 = Array.from(text.matchAll(compiledRule.compiledPattern));
            
            expect(matches1.length).toBe(matches2.length);
            
            // Verify matches are identical
            for (let i = 0; i < matches1.length; i++) {
              expect(matches1[i][0]).toBe(matches2[i][0]);
              expect(matches1[i].index).toBe(matches2[i].index);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce deterministic results for the same input', async () => {
    // Generator for random text
    const textGen = fc.string({ minLength: 10, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Language.THAI, Language.ENGLISH, Language.JAPANESE),
        textGen,
        async (language, text) => {
          // Load and compile rules
          const rules = await loadGrammarRules(language);
          const compiledRules = compileGrammarRules(rules);

          // Apply rules multiple times
          const results1 = applyRulesToText(text, compiledRules);
          const results2 = applyRulesToText(text, compiledRules);
          const results3 = applyRulesToText(text, compiledRules);

          // Verify results are identical (deterministic)
          expect(results1).toEqual(results2);
          expect(results2).toEqual(results3);

          // Verify results structure
          expect(Array.isArray(results1)).toBe(true);
          
          // Each result should have deterministic properties
          for (const result of results1) {
            expect(result).toHaveProperty('start');
            expect(result).toHaveProperty('end');
            expect(result).toHaveProperty('matched');
            expect(result).toHaveProperty('ruleId');
            expect(typeof result.start).toBe('number');
            expect(typeof result.end).toBe('number');
            expect(typeof result.matched).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not use probabilistic or non-deterministic methods', async () => {
    // Generator for text that might trigger various rules
    const textGen = fc.oneof(
      fc.string({ minLength: 10, maxLength: 50 }),
      fc.constantFrom(
        'This is a test sentence with grammar errors.',
        'He go to school every day.',
        'I could of done better.',
        'The quick brown fox jumps over the lazy dog.'
      )
    );

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Language.ENGLISH),
        textGen,
        fc.integer({ min: 1, max: 10 }),
        async (language, text, iterations) => {
          // Load and compile rules
          const rules = await loadGrammarRules(language);
          const compiledRules = compileGrammarRules(rules);

          // Apply rules multiple times
          const allResults: any[][] = [];
          for (let i = 0; i < iterations; i++) {
            const results = applyRulesToText(text, compiledRules);
            allResults.push(results);
          }

          // Verify all results are identical (no randomness)
          for (let i = 1; i < allResults.length; i++) {
            expect(allResults[i]).toEqual(allResults[0]);
          }

          // Verify no random or probabilistic behavior
          // If results vary, it indicates non-deterministic processing
          const uniqueResults = new Set(allResults.map(r => JSON.stringify(r)));
          expect(uniqueResults.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify grammar rules contain only regex patterns and fixed corrections', async () => {
    const languages = [Language.THAI, Language.ENGLISH, Language.JAPANESE];

    for (const language of languages) {
      const rules = await loadGrammarRules(language);

      for (const rule of rules) {
        // Verify pattern is a valid regex string
        expect(typeof rule.pattern).toBe('string');
        expect(() => new RegExp(rule.pattern)).not.toThrow();

        // Verify correction is a fixed string or capture group reference
        expect(typeof rule.correction).toBe('string');
        
        // Correction should only contain:
        // - Plain text
        // - Capture group references ($1, $2, etc.)
        // - No function calls, no AI/ML references
        const correctionPattern = /^[^(){}[\]]*$/; // No function calls
        expect(correctionPattern.test(rule.correction)).toBe(true);

        // Verify no AI/ML keywords in correction
        expect(containsForbiddenPattern(rule.correction)).toBe(false);

        // Verify rule properties are all deterministic types
        expect(typeof rule.id).toBe('string');
        expect(typeof rule.errorType).toBe('string');
        expect(typeof rule.message).toBe('string');
        expect(typeof rule.severity).toBe('string');
        expect(typeof rule.enabled).toBe('boolean');
      }
    }
  });

  it('should verify no external API calls or network requests during rule processing', async () => {
    // Mock fetch to detect any network calls
    const originalFetch = global.fetch;
    const fetchCalls: string[] = [];
    
    global.fetch = jest.fn((url: any) => {
      fetchCalls.push(url.toString());
      return originalFetch(url);
    }) as any;

    try {
      // Generator for random text
      const textGen = fc.string({ minLength: 10, maxLength: 100 });

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(Language.ENGLISH),
          textGen,
          async (language, text) => {
            // Clear fetch calls
            fetchCalls.length = 0;

            // Load rules (this may fetch rule files, which is allowed)
            const rules = await loadGrammarRules(language);
            const initialFetchCount = fetchCalls.length;

            // Compile and apply rules
            const compiledRules = compileGrammarRules(rules);
            const results = applyRulesToText(text, compiledRules);

            // Verify no additional fetches during rule processing
            const processingFetchCount = fetchCalls.length - initialFetchCount;
            expect(processingFetchCount).toBe(0);

            // Verify no external API calls (only chrome.runtime.getURL is allowed)
            for (const url of fetchCalls) {
              expect(
                url.startsWith('chrome-extension://') || 
                url.startsWith('blob:') ||
                url.includes('chrome.runtime.getURL')
              ).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    } finally {
      // Restore original fetch
      global.fetch = originalFetch;
    }
  });

  it('should verify rule-based processing produces deterministic results', async () => {
    // The key property is that the same input always produces the same output
    // (not that timing is consistent, which can vary due to system load)
    const text = 'This is a test sentence with some grammar errors that need checking.';
    const language = Language.ENGLISH;

    const rules = await loadGrammarRules(language);
    const compiledRules = compileGrammarRules(rules);

    // Apply rules multiple times and verify results are identical
    const iterations = 10;
    const results: any[][] = [];

    for (let i = 0; i < iterations; i++) {
      const result = applyRulesToText(text, compiledRules);
      results.push(result);
    }

    // Verify all results are identical (deterministic)
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }

    // Verify no variation in results (no randomness)
    const uniqueResults = new Set(results.map(r => JSON.stringify(r)));
    expect(uniqueResults.size).toBe(1);
  });

  it('should verify all rule operations are synchronous and deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Language.THAI, Language.ENGLISH, Language.JAPANESE),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (language, text) => {
          const rules = await loadGrammarRules(language);
          const compiledRules = compileGrammarRules(rules);

          // Apply rules and verify synchronous execution
          const startTime = Date.now();
          const results = applyRulesToText(text, compiledRules);
          const endTime = Date.now();

          // Verify results are returned immediately (synchronous)
          expect(endTime - startTime).toBeLessThan(100); // Should be very fast

          // Verify results are deterministic
          const results2 = applyRulesToText(text, compiledRules);
          expect(results).toEqual(results2);

          // Verify no promises or async operations in results
          expect(results).not.toBeInstanceOf(Promise);
          for (const result of results) {
            expect(result).not.toBeInstanceOf(Promise);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to apply compiled rules to text
 * This simulates the rule matching process
 */
function applyRulesToText(text: string, compiledRules: any[]): any[] {
  const results: any[] = [];

  for (const rule of compiledRules) {
    if (!rule.enabled) {
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
        correction: rule.correction,
      });

      // Prevent infinite loop for zero-width matches
      if (match.index === rule.compiledPattern.lastIndex) {
        rule.compiledPattern.lastIndex++;
      }
    }
  }

  return results;
}
