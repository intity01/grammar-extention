import * as fc from "fast-check";
import { applyInlineCorrection } from "../../src/lib/uiController";
import { GrammarError, Correction, Language } from "../../src/lib/types";

/**
 * Feature: grammar-checker-extension, Property 10: Cursor Position Adjustment
 *
 * For any inline correction applied at position [start, end], the cursor position
 * should be adjusted by the difference in length between the original and corrected text.
 *
 * Validates: Requirements 2.8
 */

describe("Property 10: Cursor Position Adjustment", () => {
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

  it("should adjust cursor position when cursor is after the correction", async () => {
    // Generator for text with cursor after error
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 20 }),
      error: fc.constantFrom("could of", "alot", "should of"),
      after: fc.string({ minLength: 1, maxLength: 20 }),
      cursorOffsetFromEnd: fc.integer({ min: 0, max: 10 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "should of": "should have",
    };

    await fc.assert(
      fc.asyncProperty(
        textGen,
        async ({ before, error, after, cursorOffsetFromEnd }) => {
          const text = before + error + after;
          const textarea = createTestTextarea(text);

          try {
            // Place cursor after the error
            const cursorPos = Math.min(
              before.length + error.length + cursorOffsetFromEnd,
              text.length,
            );
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              before.length,
              before.length + error.length,
              correctionMap[error],
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should be adjusted by length difference
            const lengthDiff = correctionMap[error].length - error.length;
            const expectedCursorPos = cursorPos + lengthDiff;

            expect(textarea.selectionStart).toBe(expectedCursorPos);
            expect(textarea.selectionEnd).toBe(expectedCursorPos);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should place cursor at end of correction when cursor is within the error", async () => {
    // Generator for text with cursor within error
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 20 }),
      error: fc.constantFrom("could of", "alot", "should of"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
      cursorOffsetInError: fc.integer({ min: 0, max: 8 }), // Max length of 'should of'
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "should of": "should have",
    };

    await fc.assert(
      fc.asyncProperty(
        textGen,
        async ({ before, error, after, cursorOffsetInError }) => {
          const text = before + error + after;
          const textarea = createTestTextarea(text);

          try {
            // Place cursor within the error
            const errorStart = before.length;
            const errorEnd = before.length + error.length;
            const cursorPos =
              errorStart + Math.min(cursorOffsetInError, error.length);

            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              errorStart,
              errorEnd,
              correctionMap[error],
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should be placed at end of corrected text
            const expectedCursorPos = errorStart + correctionMap[error].length;

            expect(textarea.selectionStart).toBe(expectedCursorPos);
            expect(textarea.selectionEnd).toBe(expectedCursorPos);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should not adjust cursor position when cursor is before the correction", async () => {
    // Generator for text with cursor before error
    const textGen = fc.record({
      before: fc.string({ minLength: 5, maxLength: 20 }),
      error: fc.constantFrom("could of", "alot", "should of"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
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
          // Place cursor before the error
          const cursorPos = Math.floor(before.length / 2);
          textarea.setSelectionRange(cursorPos, cursorPos);
          textarea.focus();

          // Create and apply correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          applyInlineCorrection(textarea, correction);

          // Property: Cursor should remain at same position (no adjustment)
          expect(textarea.selectionStart).toBe(cursorPos);
          expect(textarea.selectionEnd).toBe(cursorPos);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should handle cursor at position 0 (start of text)", async () => {
    // Generator for text with error at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 20 }), // Ensure error is NOT at position 0
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
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
          // Place cursor at start (position 0)
          textarea.setSelectionRange(0, 0);
          textarea.focus();

          // Create and apply correction (error is after position 0)
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          applyInlineCorrection(textarea, correction);

          // Property: Cursor should remain at position 0 (before the error)
          expect(textarea.selectionStart).toBe(0);
          expect(textarea.selectionEnd).toBe(0);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should handle cursor at end of text", async () => {
    // Generator for text with error at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 20 }),
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
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
          // Place cursor at end of text
          const cursorPos = text.length;
          textarea.setSelectionRange(cursorPos, cursorPos);
          textarea.focus();

          // Create and apply correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          applyInlineCorrection(textarea, correction);

          // Property: Cursor should be adjusted to new end position
          const lengthDiff = correctionMap[error].length - error.length;
          const expectedCursorPos = text.length + lengthDiff;

          expect(textarea.selectionStart).toBe(expectedCursorPos);
          expect(textarea.selectionEnd).toBe(expectedCursorPos);
          expect(textarea.selectionStart).toBe(textarea.value.length);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should adjust cursor correctly when correction makes text longer", async () => {
    // Test corrections that increase text length
    const testCases = fc.constantFrom(
      { original: "alot", corrected: "a lot", lengthDiff: 1 },
      { original: "could of", corrected: "could have", lengthDiff: 2 },
      { original: "ur", corrected: "your", lengthDiff: 2 },
    );

    await fc.assert(
      fc.asyncProperty(
        testCases,
        fc.string({ minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 5, maxLength: 15 }),
        async (testCase, before, after) => {
          const text = before + testCase.original + after;
          const textarea = createTestTextarea(text);

          try {
            // Place cursor after the error
            const errorEnd = before.length + testCase.original.length;
            const cursorPos = errorEnd + Math.floor(after.length / 2);
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              before.length,
              errorEnd,
              testCase.corrected,
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should move forward by lengthDiff
            const expectedCursorPos = cursorPos + testCase.lengthDiff;

            expect(textarea.selectionStart).toBe(expectedCursorPos);
            expect(textarea.selectionEnd).toBe(expectedCursorPos);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should adjust cursor correctly when correction makes text shorter", async () => {
    // Test corrections that decrease text length
    const testCases = fc.constantFrom(
      { original: "the the", corrected: "the", lengthDiff: -4 },
      { original: "very very", corrected: "very", lengthDiff: -5 },
      { original: "really really", corrected: "really", lengthDiff: -7 },
    );

    await fc.assert(
      fc.asyncProperty(
        testCases,
        fc.string({ minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 5, maxLength: 15 }),
        async (testCase, before, after) => {
          const text = before + testCase.original + after;
          const textarea = createTestTextarea(text);

          try {
            // Place cursor after the error
            const errorEnd = before.length + testCase.original.length;
            const cursorPos = errorEnd + Math.floor(after.length / 2);
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              before.length,
              errorEnd,
              testCase.corrected,
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should move backward by absolute lengthDiff
            const expectedCursorPos = cursorPos + testCase.lengthDiff;

            expect(textarea.selectionStart).toBe(expectedCursorPos);
            expect(textarea.selectionEnd).toBe(expectedCursorPos);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should not adjust cursor when correction has same length", async () => {
    // Test corrections that keep text length the same
    const testCases = fc.constantFrom(
      { original: "recieve", corrected: "receive", lengthDiff: 0 },
      { original: "teh", corrected: "the", lengthDiff: 0 },
      { original: "thier", corrected: "their", lengthDiff: 0 },
    );

    await fc.assert(
      fc.asyncProperty(
        testCases,
        fc.string({ minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 5, maxLength: 15 }),
        async (testCase, before, after) => {
          const text = before + testCase.original + after;
          const textarea = createTestTextarea(text);

          try {
            // Place cursor after the error
            const errorEnd = before.length + testCase.original.length;
            const cursorPos = errorEnd + Math.floor(after.length / 2);
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              before.length,
              errorEnd,
              testCase.corrected,
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should remain at same position (no length change)
            expect(textarea.selectionStart).toBe(cursorPos);
            expect(textarea.selectionEnd).toBe(cursorPos);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should work correctly with input elements", async () => {
    // Test cursor adjustment in input elements
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 15 }),
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 1, maxLength: 15 }),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const input = createTestInput(text);

        try {
          // Place cursor after the error
          const errorEnd = before.length + error.length;
          const cursorPos = errorEnd + Math.floor(after.length / 2);
          input.setSelectionRange(cursorPos, cursorPos);
          input.focus();

          // Create and apply correction
          const correction = createCorrection(
            text,
            before.length,
            errorEnd,
            correctionMap[error],
          );

          applyInlineCorrection(input, correction);

          // Property: Cursor should be adjusted by length difference
          const lengthDiff = correctionMap[error].length - error.length;
          const expectedCursorPos = cursorPos + lengthDiff;

          expect(input.selectionStart).toBe(expectedCursorPos);
          expect(input.selectionEnd).toBe(expectedCursorPos);
        } finally {
          cleanup(input);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should handle multiple sequential corrections with cursor adjustment", async () => {
    // Test that cursor adjusts correctly through multiple corrections
    const text = "I could of done alot of work";
    const textarea = createTestTextarea(text);

    try {
      // Place cursor at end
      textarea.setSelectionRange(text.length, text.length);
      textarea.focus();

      // Apply first correction: "could of" -> "could have"
      const correction1 = createCorrection(text, 2, 10, "could have");
      applyInlineCorrection(textarea, correction1);

      // Property: Cursor should be adjusted by +2 (length difference)
      expect(textarea.selectionStart).toBe(text.length + 2);

      // Get updated text
      const text2 = textarea.value;

      // Apply second correction: "alot" -> "a lot"
      // Position is now adjusted: was 16-20, now 18-22
      const correction2 = createCorrection(text2, 18, 22, "a lot");
      applyInlineCorrection(textarea, correction2);

      // Property: Cursor should be adjusted by +1 more (total +3 from original)
      expect(textarea.selectionStart).toBe(text.length + 3);
      expect(textarea.value).toBe("I could have done a lot of work");
    } finally {
      cleanup(textarea);
    }
  });

  it("should maintain cursor position bounds within text length", async () => {
    // Test that cursor never goes out of bounds
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 20 }),
      error: fc.constantFrom("could of", "alot", "the the"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "the the": "the",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Test various cursor positions
          for (let cursorPos = 0; cursorPos <= text.length; cursorPos++) {
            textarea.value = text; // Reset
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.focus();

            // Create and apply correction
            const correction = createCorrection(
              text,
              before.length,
              before.length + error.length,
              correctionMap[error],
            );

            applyInlineCorrection(textarea, correction);

            // Property: Cursor should always be within bounds
            expect(textarea.selectionStart).toBeGreaterThanOrEqual(0);
            expect(textarea.selectionStart).toBeLessThanOrEqual(
              textarea.value.length,
            );
            expect(textarea.selectionEnd).toBeGreaterThanOrEqual(0);
            expect(textarea.selectionEnd).toBeLessThanOrEqual(
              textarea.value.length,
            );
          }
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 20 }, // Reduced runs since we test all positions per run
    );
  });

  it("should handle cursor at exact error boundaries", async () => {
    // Test cursor at start and end of error
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 15 }),
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 1, maxLength: 15 }),
      atStart: fc.boolean(), // Test either start or end boundary
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after, atStart }) => {
        const text = before + error + after;
        const errorStart = before.length;
        const errorEnd = before.length + error.length;
        const textarea = createTestTextarea(text);

        try {
          // Place cursor at either error start or error end
          const cursorPos = atStart ? errorStart : errorEnd;
          textarea.setSelectionRange(cursorPos, cursorPos);
          textarea.focus();

          const correction = createCorrection(
            text,
            errorStart,
            errorEnd,
            correctionMap[error],
          );
          applyInlineCorrection(textarea, correction);

          // Property: Cursor at error boundary should move to end of correction
          const expectedPos = errorStart + correctionMap[error].length;
          expect(textarea.selectionStart).toBe(expectedPos);
          expect(textarea.selectionEnd).toBe(expectedPos);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve cursor position relative to unchanged text", async () => {
    // Test that cursor maintains correct position relative to text that wasn't changed
    const textGen = fc.record({
      before: fc.string({ minLength: 10, maxLength: 20 }),
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 10, maxLength: 20 }),
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
          // Place cursor in the "after" section
          const errorEnd = before.length + error.length;
          const offsetInAfter = Math.floor(after.length / 2);
          const cursorPos = errorEnd + offsetInAfter;
          textarea.setSelectionRange(cursorPos, cursorPos);
          textarea.focus();

          // Store the text after cursor for verification
          const textAfterCursor = text.substring(cursorPos);

          // Create and apply correction
          const correction = createCorrection(
            text,
            before.length,
            errorEnd,
            correctionMap[error],
          );

          applyInlineCorrection(textarea, correction);

          // Property: Text after cursor should remain the same
          const newCursorPos = textarea.selectionStart!;
          const newTextAfterCursor = textarea.value.substring(newCursorPos);
          expect(newTextAfterCursor).toBe(textAfterCursor);

          // Property: Cursor should maintain same offset in "after" section
          const lengthDiff = correctionMap[error].length - error.length;
          const expectedCursorPos = cursorPos + lengthDiff;
          expect(newCursorPos).toBe(expectedCursorPos);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });
});
