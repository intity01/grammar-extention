import * as fc from "fast-check";
import { applyInlineCorrection } from "../../src/lib/uiController";
import { GrammarError, Correction, Language } from "../../src/lib/types";

/**
 * Feature: grammar-checker-extension, Property 9: Text Preservation During Inline Correction
 *
 * For any text with an error at position [start, end], applying an inline correction
 * should only modify the substring [start, end] and preserve all other text unchanged.
 *
 * Validates: Requirements 2.7
 */

describe("Property 9: Text Preservation During Inline Correction", () => {
  // Helper to create a test textarea element
  function createTestTextarea(initialValue: string): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.value = initialValue;
    document.body.appendChild(textarea);
    return textarea;
  }

  // Helper to create a test input element
  function createTestInput(initialValue: string): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = initialValue;
    document.body.appendChild(input);
    return input;
  }

  // Cleanup helper
  function cleanup(element: HTMLElement): void {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  // Helper to create a grammar error
  function createError(
    start: number,
    end: number,
    ruleId: string = "test_001",
  ): GrammarError {
    return {
      start,
      end,
      type: "grammar",
      message: "Test error",
      language: Language.ENGLISH,
      ruleId,
    };
  }

  // Helper to create a correction
  function createCorrection(
    text: string,
    start: number,
    end: number,
    corrected: string,
  ): Correction {
    const error = createError(start, end);
    const original = text.substring(start, end);
    return {
      error,
      original,
      corrected,
      confidence: 0.9,
    };
  }

  it("should preserve text before and after error in textarea", async () => {
    // Generator for text with errors at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 30 }),
      error: fc.constantFrom("could of", "alot", "should of", "would of"),
      after: fc.string({ minLength: 1, maxLength: 30 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "should of": "should have",
      "would of": "would have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Text before error should be preserved exactly
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Text after error should be preserved exactly
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);

          // Property: Only the error substring should be modified
          const expectedValue = before + correctionMap[error] + after;
          expect(actualValue).toBe(expectedValue);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve text before and after error in input", async () => {
    // Generator for text with errors at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 20 }),
      error: fc.constantFrom("alot", "the the", "recieve"),
      after: fc.string({ minLength: 1, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "the the": "the",
      recieve: "receive",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const input = createTestInput(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(input, correction);

          // Property: Text before error should be preserved exactly
          const actualValue = input.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Text after error should be preserved exactly
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);

          // Property: Only the error substring should be modified
          const expectedValue = before + correctionMap[error] + after;
          expect(actualValue).toBe(expectedValue);
        } finally {
          cleanup(input);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve text when error is at the start", async () => {
    // Generator for errors at the start
    const textGen = fc.record({
      error: fc.constantFrom("alot", "could of", "recieve"),
      after: fc.string({ minLength: 5, maxLength: 30 }),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
      recieve: "receive",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ error, after }) => {
        const text = error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction at start (position 0)
          const correction = createCorrection(
            text,
            0,
            error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Text after error should be preserved exactly
          const actualValue = textarea.value;
          const suffixStart = correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);

          // Property: Only the error substring should be modified
          const expectedValue = correctionMap[error] + after;
          expect(actualValue).toBe(expectedValue);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve text when error is at the end", async () => {
    // Generator for errors at the end
    const textGen = fc.record({
      before: fc.string({ minLength: 5, maxLength: 30 }),
      error: fc.constantFrom("alot", "could of", "recieve"),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
      recieve: "receive",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error }) => {
        const text = before + error;
        const textarea = createTestTextarea(text);

        try {
          // Create correction at end
          const correction = createCorrection(
            text,
            before.length,
            text.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Text before error should be preserved exactly
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Only the error substring should be modified
          const expectedValue = before + correctionMap[error];
          expect(actualValue).toBe(expectedValue);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve special characters before and after error", async () => {
    // Generator for text with special characters
    const textGen = fc.record({
      before: fc.constantFrom(
        "Hello! ",
        "Test: ",
        "Example - ",
        "Note (1): ",
        "Item [A]: ",
        "Data {x}: ",
      ),
      error: fc.constantFrom("alot", "could of"),
      after: fc.constantFrom(
        " (note)",
        " [test]",
        " {data}",
        " - end",
        " :)",
        " !!!",
      ),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Special characters before error should be preserved
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Special characters after error should be preserved
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve newlines before and after error", async () => {
    // Generator for multiline text
    const textGen = fc.record({
      line1: fc.string({ minLength: 1, maxLength: 15 }),
      error: fc.constantFrom("alot", "could of"),
      line2: fc.string({ minLength: 1, maxLength: 15 }),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ line1, error, line2 }) => {
        const before = line1 + "\n";
        const after = "\n" + line2;
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const errorStart = before.length;
          const correction = createCorrection(
            text,
            errorStart,
            errorStart + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Newlines should be preserved
          const actualValue = textarea.value;

          // Check first line is preserved
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);
          expect(actualBefore).toContain("\n");

          // Check last line is preserved
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);
          expect(actualAfter).toContain("\n");

          // Verify structure
          const lines = actualValue.split("\n");
          expect(lines.length).toBe(3);
          expect(lines[0]).toBe(line1);
          expect(lines[1]).toBe(correctionMap[error]);
          expect(lines[2]).toBe(line2);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve whitespace before and after error", async () => {
    // Generator for text with various whitespace
    const textGen = fc.record({
      before: fc.constantFrom("  ", "   ", "\t", " \t ", "  \t  "),
      error: fc.constantFrom("alot", "could of"),
      after: fc.constantFrom("  ", "   ", "\t", " \t ", "  \t  "),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Whitespace before error should be preserved exactly
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Whitespace after error should be preserved exactly
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve Unicode characters before and after error", async () => {
    // Generator for text with Unicode characters
    const textGen = fc.record({
      before: fc.constantFrom(
        "สวัสดี ",
        "こんにちは ",
        "你好 ",
        "Привет ",
        "🎉 ",
      ),
      error: fc.constant("alot"),
      after: fc.constantFrom(" ครับ", " です", " 吗", " 👍", " ✨"),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            "a lot",
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Unicode characters before error should be preserved
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(before);

          // Property: Unicode characters after error should be preserved
          const suffixStart = before.length + "a lot".length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should not modify unrelated errors in the same text", async () => {
    // Test that only the specified error is corrected, not similar patterns
    const testCases = fc.constantFrom(
      {
        text: "I could of done alot and you could of helped",
        correction: { start: 2, end: 10, corrected: "could have" },
        expectedBefore: "I ",
        expectedAfter: " done alot and you could of helped",
      },
      {
        text: "alot of people have alot of things",
        correction: { start: 0, end: 4, corrected: "a lot" },
        expectedBefore: "",
        expectedAfter: " of people have alot of things",
      },
      {
        text: "the the cat and the the dog",
        correction: { start: 0, end: 7, corrected: "the" },
        expectedBefore: "",
        expectedAfter: " cat and the the dog",
      },
    );

    await fc.assert(
      fc.asyncProperty(testCases, async (testCase) => {
        const textarea = createTestTextarea(testCase.text);

        try {
          // Create and apply correction for first occurrence only
          const correction = createCorrection(
            testCase.text,
            testCase.correction.start,
            testCase.correction.end,
            testCase.correction.corrected,
          );
          applyInlineCorrection(textarea, correction);

          // Property: Text before the corrected error should be preserved
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(
            0,
            testCase.correction.start,
          );
          expect(actualBefore).toBe(testCase.expectedBefore);

          // Property: Text after the corrected error should be preserved
          const suffixStart =
            testCase.correction.start + testCase.correction.corrected.length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(testCase.expectedAfter);

          // Property: Other similar errors should remain unchanged
          expect(actualAfter).toContain(
            testCase.text.substring(testCase.correction.end),
          );
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve exact byte-for-byte content outside error range", async () => {
    // Generator for arbitrary text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 50 }),
      error: fc.constantFrom("could of", "alot", "should of"),
      after: fc.string({ minLength: 0, maxLength: 50 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "should of": "should have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Store original before and after for comparison
          const originalBefore = text.substring(0, before.length);
          const originalAfter = text.substring(before.length + error.length);

          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Content before error should be byte-for-byte identical
          const actualValue = textarea.value;
          const actualBefore = actualValue.substring(0, before.length);
          expect(actualBefore).toBe(originalBefore);
          expect(actualBefore.length).toBe(originalBefore.length);

          // Property: Content after error should be byte-for-byte identical
          const suffixStart = before.length + correctionMap[error].length;
          const actualAfter = actualValue.substring(suffixStart);
          expect(actualAfter).toBe(originalAfter);
          expect(actualAfter.length).toBe(originalAfter.length);

          // Property: Total length should be adjusted correctly
          const expectedLength =
            before.length + correctionMap[error].length + after.length;
          expect(actualValue.length).toBe(expectedLength);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve text when correction changes length", async () => {
    // Test with corrections that make text longer, shorter, or same length
    const testCases = fc.constantFrom(
      { original: "alot", corrected: "a lot", lengthChange: 1 },
      { original: "could of", corrected: "could have", lengthChange: 2 },
      { original: "the the", corrected: "the", lengthChange: -4 },
      { original: "recieve", corrected: "receive", lengthChange: 0 },
    );

    await fc.assert(
      fc.asyncProperty(
        testCases,
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 5, maxLength: 20 }),
        async (testCase, before, after) => {
          const text = before + testCase.original + after;
          const textarea = createTestTextarea(text);

          try {
            // Create correction
            const correction = createCorrection(
              text,
              before.length,
              before.length + testCase.original.length,
              testCase.corrected,
            );

            // Apply correction
            applyInlineCorrection(textarea, correction);

            // Property: Text before should be preserved regardless of length change
            const actualValue = textarea.value;
            const actualBefore = actualValue.substring(0, before.length);
            expect(actualBefore).toBe(before);

            // Property: Text after should be preserved regardless of length change
            const suffixStart = before.length + testCase.corrected.length;
            const actualAfter = actualValue.substring(suffixStart);
            expect(actualAfter).toBe(after);

            // Property: Total length should be adjusted correctly
            const expectedLength = text.length + testCase.lengthChange;
            expect(actualValue.length).toBe(expectedLength);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
