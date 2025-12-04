import * as fc from "fast-check";
import { applyInlineCorrection } from "../../src/lib/uiController";
import { GrammarError, Correction, Language } from "../../src/lib/types";

/**
 * Feature: grammar-checker-extension, Property 6: Inline Correction Application
 *
 * For any correction suggestion, when correctionMode is 'inline' and user accepts,
 * the UI Controller should apply the correction to the input field directly.
 *
 * Validates: Requirements 2.4
 */

describe("Property 6: Inline Correction Application", () => {
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

  // Helper to create a test contenteditable element
  function createTestContentEditable(initialValue: string): HTMLDivElement {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    div.textContent = initialValue;
    document.body.appendChild(div);
    return div;
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

  it("should apply inline correction to textarea elements", async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 20 }),
      error: fc.constantFrom("could of", "should of", "alot", "would of"),
      after: fc.string({ minLength: 0, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      "should of": "should have",
      alot: "a lot",
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

          // Property: Correction should be applied to the textarea value
          const expectedText = before + correctionMap[error] + after;
          expect(textarea.value).toBe(expectedText);

          // Verify the error text was replaced
          expect(textarea.value).not.toContain(error);
          expect(textarea.value).toContain(correctionMap[error]);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply inline correction to input elements", async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 15 }),
      error: fc.constantFrom("could of", "alot", "the the"),
      after: fc.string({ minLength: 0, maxLength: 15 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
      "the the": "the",
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

          // Property: Correction should be applied to the input value
          const expectedText = before + correctionMap[error] + after;
          expect(input.value).toBe(expectedText);

          // Verify the error text was replaced
          expect(input.value).not.toContain(error);
          expect(input.value).toContain(correctionMap[error]);
        } finally {
          cleanup(input);
        }
      }),
      { numRuns: 100 },
    );
  });

  // Note: Contenteditable tests are skipped because JSDOM doesn't fully support
  // the isContentEditable property and Range API needed for contenteditable elements.
  // These would need to be tested in a real browser environment (e.g., Playwright/Cypress).
  it.skip("should apply inline correction to contenteditable elements", async () => {
    // Generator for simple text with errors (contenteditable is more complex)
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      error: fc.constantFrom("could of", "alot"),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    const correctionMap: Record<string, string> = {
      "could of": "could have",
      alot: "a lot",
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const div = createTestContentEditable(text);

        try {
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(div, correction);

          // Property: Correction should be applied to the contenteditable text
          const expectedText = before + correctionMap[error] + after;
          const actualText = div.textContent || "";

          expect(actualText).toBe(expectedText);

          // Verify the error text was replaced
          expect(actualText).not.toContain(error);
          expect(actualText).toContain(correctionMap[error]);
        } finally {
          cleanup(div);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should preserve text before and after the correction", async () => {
    // Generator for text with errors at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 5, maxLength: 20 }),
      error: fc.constantFrom("could of", "alot", "should of"),
      after: fc.string({ minLength: 5, maxLength: 20 }),
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
          // Create correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            correctionMap[error],
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Text before and after should be preserved exactly
          const actualValue = textarea.value;

          // Check prefix is preserved
          expect(actualValue.substring(0, before.length)).toBe(before);

          // Check suffix is preserved
          const suffixStart = before.length + correctionMap[error].length;
          expect(actualValue.substring(suffixStart)).toBe(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply correction at the start of text", async () => {
    // Generator for errors at the start
    const textGen = fc.record({
      error: fc.constantFrom("alot", "could of"),
      after: fc.string({ minLength: 1, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
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

          // Property: Correction at start should work correctly
          const expectedText = correctionMap[error] + after;
          expect(textarea.value).toBe(expectedText);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply correction at the end of text", async () => {
    // Generator for errors at the end
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 20 }),
      error: fc.constantFrom("alot", "could of"),
    });

    const correctionMap: Record<string, string> = {
      alot: "a lot",
      "could of": "could have",
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

          // Property: Correction at end should work correctly
          const expectedText = before + correctionMap[error];
          expect(textarea.value).toBe(expectedText);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply multiple corrections sequentially", async () => {
    // Generator for text with multiple errors
    const textGen = fc.constant({
      text: "I could of done alot of work",
      errors: [
        { start: 2, end: 10, corrected: "could have" }, // 'could of'
        { start: 16, end: 20, corrected: "a lot" }, // 'alot'
      ],
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ text, errors }) => {
        const textarea = createTestTextarea(text);

        try {
          // Apply first correction
          const correction1 = createCorrection(
            text,
            errors[0].start,
            errors[0].end,
            errors[0].corrected,
          );
          applyInlineCorrection(textarea, correction1);

          // Get updated text after first correction
          const text2 = textarea.value;

          // Calculate adjusted position for second error
          const lengthDiff1 =
            errors[0].corrected.length - (errors[0].end - errors[0].start);
          const adjustedStart2 = errors[1].start + lengthDiff1;
          const adjustedEnd2 = errors[1].end + lengthDiff1;

          // Apply second correction
          const correction2 = createCorrection(
            text2,
            adjustedStart2,
            adjustedEnd2,
            errors[1].corrected,
          );
          applyInlineCorrection(textarea, correction2);

          // Property: Both corrections should be applied
          expect(textarea.value).toBe("I could have done a lot of work");
          expect(textarea.value).not.toContain("could of");
          expect(textarea.value).not.toContain("alot");
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should trigger input event after applying correction", async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      error: fc.constant("alot"),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Set up event listener
          let inputEventFired = false;
          textarea.addEventListener("input", () => {
            inputEventFired = true;
          });

          // Create and apply correction
          const correction = createCorrection(
            text,
            before.length,
            before.length + error.length,
            "a lot",
          );
          applyInlineCorrection(textarea, correction);

          // Property: Input event should be triggered
          expect(inputEventFired).toBe(true);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should handle corrections that change text length", async () => {
    // Generator for corrections with different length changes
    const testCases = fc.constantFrom(
      { original: "alot", corrected: "a lot", lengthChange: 1 },
      { original: "could of", corrected: "could have", lengthChange: 2 },
      { original: "the the", corrected: "the", lengthChange: -4 },
      { original: "recieve", corrected: "receive", lengthChange: 0 },
    );

    await fc.assert(
      fc.asyncProperty(
        testCases,
        fc.string({ minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 0, maxLength: 10 }),
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

            // Verify the correction object is correct
            expect(correction.original).toBe(testCase.original);
            expect(correction.corrected).toBe(testCase.corrected);
            expect(correction.error.start).toBe(before.length);
            expect(correction.error.end).toBe(
              before.length + testCase.original.length,
            );

            // Apply correction
            applyInlineCorrection(textarea, correction);

            // Property: Final text length should be adjusted correctly
            const expectedLength = text.length + testCase.lengthChange;
            const expectedText = before + testCase.corrected + after;

            expect(textarea.value).toBe(expectedText);
            expect(textarea.value.length).toBe(expectedLength);
          } finally {
            cleanup(textarea);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should handle empty corrections (deletions)", async () => {
    // Generator for text with redundant words that should be deleted
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      redundant: fc.constantFrom("the the ", "very very ", "really really "),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, redundant, after }) => {
        const text = before + redundant + after;
        const textarea = createTestTextarea(text);

        try {
          // Create correction that removes redundancy (e.g., "the the " -> "the ")
          const corrected = redundant.split(" ")[0] + " ";
          const correction = createCorrection(
            text,
            before.length,
            before.length + redundant.length,
            corrected,
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Redundant text should be removed
          const expectedText = before + corrected + after;
          expect(textarea.value).toBe(expectedText);
          expect(textarea.value.length).toBeLessThan(text.length);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply corrections consistently for the same input", async () => {
    // Fixed test case
    const text = "I could of done better";
    const correction = createCorrection(text, 2, 10, "could have");

    // Apply correction multiple times to different elements
    const textarea1 = createTestTextarea(text);
    const textarea2 = createTestTextarea(text);
    const textarea3 = createTestTextarea(text);

    try {
      applyInlineCorrection(textarea1, correction);
      applyInlineCorrection(textarea2, correction);
      applyInlineCorrection(textarea3, correction);

      // Property: Same correction should produce same result (deterministic)
      expect(textarea1.value).toBe("I could have done better");
      expect(textarea2.value).toBe("I could have done better");
      expect(textarea3.value).toBe("I could have done better");
      expect(textarea1.value).toBe(textarea2.value);
      expect(textarea2.value).toBe(textarea3.value);
    } finally {
      cleanup(textarea1);
      cleanup(textarea2);
      cleanup(textarea3);
    }
  });

  it("should handle corrections in text with special characters", async () => {
    // Generator for text with special characters
    const textGen = fc.record({
      before: fc.constantFrom("Hello! ", "Test: ", "Example - "),
      error: fc.constant("alot"),
      after: fc.constantFrom(" (note)", " [test]", " {data}"),
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

          // Property: Special characters should be preserved
          const expectedText = before + "a lot" + after;
          expect(textarea.value).toBe(expectedText);

          // Verify special characters are intact
          expect(textarea.value).toContain(before);
          expect(textarea.value).toContain(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should handle corrections in text with newlines", async () => {
    // Generator for multiline text
    const textGen = fc.record({
      line1: fc.string({ minLength: 1, maxLength: 10 }),
      error: fc.constant("alot"),
      line2: fc.string({ minLength: 1, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ line1, error, line2 }) => {
        const text = line1 + "\n" + error + "\n" + line2;
        const textarea = createTestTextarea(text);

        try {
          // Create correction
          const errorStart = line1.length + 1; // +1 for newline
          const correction = createCorrection(
            text,
            errorStart,
            errorStart + error.length,
            "a lot",
          );

          // Apply correction
          applyInlineCorrection(textarea, correction);

          // Property: Newlines should be preserved
          const expectedText = line1 + "\n" + "a lot" + "\n" + line2;
          expect(textarea.value).toBe(expectedText);

          // Verify newlines are intact
          const lines = textarea.value.split("\n");
          expect(lines.length).toBe(3);
          expect(lines[0]).toBe(line1);
          expect(lines[1]).toBe("a lot");
          expect(lines[2]).toBe(line2);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should apply correction without modifying unrelated text", async () => {
    // Generator for text with similar patterns
    const textGen = fc.constant({
      text: "I could of done alot and you could of helped",
      correction: { start: 2, end: 10, corrected: "could have" },
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ text, correction: corrData }) => {
        const textarea = createTestTextarea(text);

        try {
          // Create and apply correction for first "could of" only
          const correction = createCorrection(
            text,
            corrData.start,
            corrData.end,
            corrData.corrected,
          );
          applyInlineCorrection(textarea, correction);

          // Property: Only the specified error should be corrected
          expect(textarea.value).toBe(
            "I could have done alot and you could of helped",
          );

          // First "could of" should be corrected
          expect(textarea.value.substring(0, 20)).toContain("could have");

          // Second "could of" should remain unchanged
          expect(textarea.value.substring(20)).toContain("could of");

          // "alot" should remain unchanged
          expect(textarea.value).toContain("alot");
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 },
    );
  });
});
