import * as fc from 'fast-check';
import { requestClipboardCorrection } from '../../src/lib/uiController';
import { GrammarError, Correction, Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 8: Clipboard Mode Non-Modification
 * 
 * For any correction in clipboard mode, the original text in the input field should
 * remain unchanged after user accepts the suggestion.
 * 
 * Validates: Requirements 2.6
 */

describe('Property 8: Clipboard Mode Non-Modification', () => {
  // Helper to create a test textarea element
  function createTestTextarea(initialValue: string): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.value = initialValue;
    document.body.appendChild(textarea);
    return textarea;
  }

  // Helper to create a test input element
  function createTestInput(initialValue: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = initialValue;
    document.body.appendChild(input);
    return input;
  }

  // Helper to create a test contenteditable element
  function createTestContentEditable(initialValue: string): HTMLDivElement {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
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
  function createError(start: number, end: number, ruleId: string = 'test_001'): GrammarError {
    return {
      start,
      end,
      type: 'grammar',
      message: 'Test error',
      language: Language.ENGLISH,
      ruleId,
    };
  }

  // Helper to create a correction
  function createCorrection(
    text: string,
    start: number,
    end: number,
    corrected: string
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

  // Mock chrome.runtime.sendMessage for clipboard operations
  beforeEach(() => {
    // Mock chrome.runtime API
    (global as any).chrome = {
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({ success: true }),
      },
    };
  });

  afterEach(() => {
    // Clean up mock
    delete (global as any).chrome;
  });

  it('should not modify textarea value when using clipboard mode', async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 20 }),
      error: fc.constantFrom('could of', 'should of', 'alot', 'would of'),
      after: fc.string({ minLength: 0, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      'could of': 'could have',
      'should of': 'should have',
      'alot': 'a lot',
      'would of': 'would have',
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
            correctionMap[error]
          );

          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + correctionMap[error] + after);

          // Property: Original text field should remain unchanged
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);

          // Verify the error text is still present (not corrected)
          expect(textarea.value).toContain(error);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify input value when using clipboard mode', async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 15 }),
      error: fc.constantFrom('could of', 'alot', 'the the'),
      after: fc.string({ minLength: 0, maxLength: 15 }),
    });

    const correctionMap: Record<string, string> = {
      'could of': 'could have',
      'alot': 'a lot',
      'the the': 'the',
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
            correctionMap[error]
          );

          // Store original value
          const originalValue = input.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + correctionMap[error] + after);

          // Property: Original text field should remain unchanged
          expect(input.value).toBe(originalValue);
          expect(input.value).toBe(text);

          // Verify the error text is still present (not corrected)
          expect(input.value).toContain(error);
        } finally {
          cleanup(input);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify contenteditable value when using clipboard mode', async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      error: fc.constantFrom('could of', 'alot'),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    const correctionMap: Record<string, string> = {
      'could of': 'could have',
      'alot': 'a lot',
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
            correctionMap[error]
          );

          // Store original value
          const originalValue = div.textContent || '';

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + correctionMap[error] + after);

          // Property: Original text field should remain unchanged
          const currentValue = div.textContent || '';
          expect(currentValue).toBe(originalValue);
          expect(currentValue).toBe(text);

          // Verify the error text is still present (not corrected)
          expect(currentValue).toContain(error);
        } finally {
          cleanup(div);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all text content when using clipboard mode', async () => {
    // Generator for text with errors at various positions
    const textGen = fc.record({
      before: fc.string({ minLength: 5, maxLength: 20 }),
      error: fc.constantFrom('could of', 'alot', 'should of'),
      after: fc.string({ minLength: 5, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      'could of': 'could have',
      'alot': 'a lot',
      'should of': 'should have',
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
            correctionMap[error]
          );

          // Store original parts
          const originalBefore = before;
          const originalError = error;
          const originalAfter = after;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + correctionMap[error] + after);

          // Property: All parts of the text should be preserved exactly
          const actualValue = textarea.value;
          
          // Check prefix is preserved
          expect(actualValue.substring(0, before.length)).toBe(originalBefore);
          
          // Check error is preserved (not corrected)
          expect(actualValue.substring(before.length, before.length + error.length)).toBe(originalError);
          
          // Check suffix is preserved
          expect(actualValue.substring(before.length + error.length)).toBe(originalAfter);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text at the start when using clipboard mode', async () => {
    // Generator for errors at the start
    const textGen = fc.record({
      error: fc.constantFrom('alot', 'could of'),
      after: fc.string({ minLength: 1, maxLength: 20 }),
    });

    const correctionMap: Record<string, string> = {
      'alot': 'a lot',
      'could of': 'could have',
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ error, after }) => {
        const text = error + after;
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(correctionMap[error] + after);

          // Property: Text at start should remain unchanged
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);
          expect(textarea.value.substring(0, error.length)).toBe(error);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text at the end when using clipboard mode', async () => {
    // Generator for errors at the end
    const textGen = fc.record({
      before: fc.string({ minLength: 1, maxLength: 20 }),
      error: fc.constantFrom('alot', 'could of'),
    });

    const correctionMap: Record<string, string> = {
      'alot': 'a lot',
      'could of': 'could have',
    };

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error }) => {
        const text = before + error;
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + correctionMap[error]);

          // Property: Text at end should remain unchanged
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);
          expect(textarea.value.substring(before.length)).toBe(error);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text with multiple errors when using clipboard mode', async () => {
    // Generator for text with multiple errors
    const multiErrorTextGen = fc.constant({
      text: 'I could of done alot of work',
      corrections: [
        { start: 2, end: 10, corrected: 'could have' }, // 'could of'
        { start: 16, end: 20, corrected: 'a lot' },     // 'alot'
      ],
    });

    await fc.assert(
      fc.asyncProperty(multiErrorTextGen, async ({ text, corrections }) => {
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction for first error
          const correctedText1 = 'I could have done alot of work';
          await requestClipboardCorrection(correctedText1);

          // Property: Original text should remain unchanged after first correction
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);

          // Request clipboard correction for second error
          const correctedText2 = 'I could have done a lot of work';
          await requestClipboardCorrection(correctedText2);

          // Property: Original text should still remain unchanged after second correction
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);

          // Verify both errors are still present (not corrected)
          expect(textarea.value).toContain('could of');
          expect(textarea.value).toContain('alot');
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not trigger input event when using clipboard mode', async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      error: fc.constant('alot'),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Set up event listener
          let inputEventFired = false;
          textarea.addEventListener('input', () => {
            inputEventFired = true;
          });

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + 'a lot' + after);

          // Property: Input event should NOT be triggered (text not modified)
          expect(inputEventFired).toBe(false);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve cursor position when using clipboard mode', async () => {
    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 5, maxLength: 15 }),
      error: fc.constant('alot'),
      after: fc.string({ minLength: 5, maxLength: 15 }),
      cursorOffset: fc.integer({ min: 0, max: 30 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after, cursorOffset }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Set cursor position
          const initialCursorPos = Math.min(cursorOffset, text.length);
          textarea.setSelectionRange(initialCursorPos, initialCursorPos);
          textarea.focus();

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + 'a lot' + after);

          // Property: Cursor position should remain unchanged
          expect(textarea.selectionStart).toBe(initialCursorPos);
          expect(textarea.selectionEnd).toBe(initialCursorPos);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text with special characters when using clipboard mode', async () => {
    // Generator for text with special characters
    const textGen = fc.record({
      before: fc.constantFrom('Hello! ', 'Test: ', 'Example - '),
      error: fc.constant('alot'),
      after: fc.constantFrom(' (note)', ' [test]', ' {data}'),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(before + 'a lot' + after);

          // Property: Special characters should be preserved
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);
          
          // Verify special characters are intact
          expect(textarea.value).toContain(before);
          expect(textarea.value).toContain(error);
          expect(textarea.value).toContain(after);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text with newlines when using clipboard mode', async () => {
    // Generator for multiline text
    const textGen = fc.record({
      line1: fc.string({ minLength: 1, maxLength: 10 }),
      error: fc.constant('alot'),
      line2: fc.string({ minLength: 1, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ line1, error, line2 }) => {
        const text = line1 + '\n' + error + '\n' + line2;
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (clipboard mode)
          await requestClipboardCorrection(line1 + '\n' + 'a lot' + '\n' + line2);

          // Property: Newlines should be preserved
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);
          
          // Verify newlines are intact
          const lines = textarea.value.split('\n');
          expect(lines.length).toBe(3);
          expect(lines[0]).toBe(line1);
          expect(lines[1]).toBe(error);
          expect(lines[2]).toBe(line2);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify text length when using clipboard mode', async () => {
    // Generator for corrections with different length changes
    const testCases = fc.constantFrom(
      { original: 'alot', corrected: 'a lot', lengthChange: 1 },
      { original: 'could of', corrected: 'could have', lengthChange: 2 },
      { original: 'the the', corrected: 'the', lengthChange: -4 },
      { original: 'recieve', corrected: 'receive', lengthChange: 0 }
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
            // Store original length
            const originalLength = textarea.value.length;

            // Request clipboard correction (clipboard mode)
            await requestClipboardCorrection(before + testCase.corrected + after);

            // Property: Text length should remain unchanged
            expect(textarea.value.length).toBe(originalLength);
            expect(textarea.value.length).toBe(text.length);
          } finally {
            cleanup(textarea);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently not modify text across multiple clipboard operations', async () => {
    // Fixed test case
    const text = 'I could of done better';

    // Apply clipboard correction multiple times
    const textarea1 = createTestTextarea(text);
    const textarea2 = createTestTextarea(text);
    const textarea3 = createTestTextarea(text);

    try {
      await requestClipboardCorrection('I could have done better');
      await requestClipboardCorrection('I could have done better');
      await requestClipboardCorrection('I could have done better');

      // Property: All text fields should remain unchanged (deterministic)
      expect(textarea1.value).toBe(text);
      expect(textarea2.value).toBe(text);
      expect(textarea3.value).toBe(text);
      expect(textarea1.value).toBe(textarea2.value);
      expect(textarea2.value).toBe(textarea3.value);
    } finally {
      cleanup(textarea1);
      cleanup(textarea2);
      cleanup(textarea3);
    }
  });

  it('should not modify text when clipboard operation fails', async () => {
    // Mock clipboard failure
    (global as any).chrome.runtime.sendMessage = jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Clipboard access denied' 
    });

    // Generator for text with errors
    const textGen = fc.record({
      before: fc.string({ minLength: 0, maxLength: 10 }),
      error: fc.constant('alot'),
      after: fc.string({ minLength: 0, maxLength: 10 }),
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ before, error, after }) => {
        const text = before + error + after;
        const textarea = createTestTextarea(text);

        try {
          // Store original value
          const originalValue = textarea.value;

          // Request clipboard correction (will fail)
          await requestClipboardCorrection(before + 'a lot' + after);

          // Property: Text should remain unchanged even when clipboard fails
          expect(textarea.value).toBe(originalValue);
          expect(textarea.value).toBe(text);
        } finally {
          cleanup(textarea);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify unrelated text fields when using clipboard mode', async () => {
    // Generator for text with similar patterns
    const textGen = fc.constant({
      text1: 'I could of done alot',
      text2: 'You should of helped',
      text3: 'They would of known',
    });

    await fc.assert(
      fc.asyncProperty(textGen, async ({ text1, text2, text3 }) => {
        const textarea1 = createTestTextarea(text1);
        const textarea2 = createTestTextarea(text2);
        const textarea3 = createTestTextarea(text3);

        try {
          // Store original values
          const original1 = textarea1.value;
          const original2 = textarea2.value;
          const original3 = textarea3.value;

          // Request clipboard correction for first field
          await requestClipboardCorrection('I could have done a lot');

          // Property: All text fields should remain unchanged
          expect(textarea1.value).toBe(original1);
          expect(textarea2.value).toBe(original2);
          expect(textarea3.value).toBe(original3);

          // Verify errors are still present in all fields
          expect(textarea1.value).toContain('could of');
          expect(textarea1.value).toContain('alot');
          expect(textarea2.value).toContain('should of');
          expect(textarea3.value).toContain('would of');
        } finally {
          cleanup(textarea1);
          cleanup(textarea2);
          cleanup(textarea3);
        }
      }),
      { numRuns: 100 }
    );
  });
});
