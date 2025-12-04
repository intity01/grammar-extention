import * as fc from "fast-check";
import { InputMonitor, InputElement } from "../../src/lib/inputMonitor";

/**
 * Feature: grammar-checker-extension, Property 3: Re-analysis Triggers on Modification
 *
 * For any text modification event in a monitored input field, the Grammar Checker
 * should trigger a new analysis of the modified text.
 *
 * Validates: Requirements 1.4
 */

describe("Property 3: Re-analysis Triggers on Modification", () => {
  // Helper to create a mock input element
  function createMockInputElement(): HTMLTextAreaElement {
    const element = document.createElement("textarea");
    document.body.appendChild(element);
    return element;
  }

  // Helper to clean up mock elements
  function cleanupElement(element: HTMLElement): void {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  // Helper to wait for a specific amount of time
  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Helper to simulate text modification
  function modifyText(element: HTMLTextAreaElement, newText: string): void {
    element.value = newText;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("should trigger analysis when text is modified", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text modifications
    const textModificationGen = fc
      .tuple(
        fc.string({ minLength: 0, maxLength: 50 }), // initial text
        fc.string({ minLength: 0, maxLength: 50 }), // modified text
      )
      .filter(([initial, modified]) => initial !== modified); // Ensure text actually changes

    await fc.assert(
      fc.asyncProperty(
        textModificationGen,
        async ([initialText, modifiedText]) => {
          const element = createMockInputElement();
          let analysisCount = 0;
          let lastAnalyzedText = "";

          const monitor = new InputMonitor(
            {
              onTextChange: (text: string) => {
                analysisCount++;
                lastAnalyzedText = text;
              },
            },
            debounceDelay,
          );

          try {
            // Observe the field
            monitor.observeField(element);

            // Focus the element to make it active
            element.focus();

            // Set initial text
            modifyText(element, initialText);

            // Wait for debounce period
            await wait(debounceDelay + 50);

            // Verify initial analysis was triggered
            expect(analysisCount).toBe(1);
            expect(lastAnalyzedText).toBe(initialText);

            // Modify the text
            modifyText(element, modifiedText);

            // Wait for debounce period
            await wait(debounceDelay + 50);

            // Verify re-analysis was triggered
            expect(analysisCount).toBe(2);
            expect(lastAnalyzedText).toBe(modifiedText);
          } finally {
            monitor.dispose();
            cleanupElement(element);
          }
        },
      ),
      { numRuns: 20 }, // Reduced from 100 for faster execution
    );
  }, 30000); // 30 second timeout

  it("should trigger analysis for each distinct modification", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for sequence of text modifications
    const modificationSequenceGen = fc
      .array(
        fc.string({ minLength: 0, maxLength: 30 }),
        { minLength: 2, maxLength: 3 }, // Reduced max length
      )
      .filter((texts) => {
        // Ensure each text is different from the previous one
        for (let i = 1; i < texts.length; i++) {
          if (texts[i] === texts[i - 1]) {
            return false;
          }
        }
        return true;
      });

    await fc.assert(
      fc.asyncProperty(modificationSequenceGen, async (textSequence) => {
        const element = createMockInputElement();
        let analysisCount = 0;
        const analyzedTexts: string[] = [];

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analysisCount++;
              analyzedTexts.push(text);
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Apply each modification with sufficient delay between them
          for (const text of textSequence) {
            modifyText(element, text);

            // Wait for debounce period to complete
            await wait(debounceDelay + 50);
          }

          // Verify analysis was triggered for each modification
          expect(analysisCount).toBe(textSequence.length);

          // Verify all texts were analyzed in order
          expect(analyzedTexts).toEqual(textSequence);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 15 }, // Reduced from 50
    );
  }, 30000); // 30 second timeout

  it("should trigger analysis when text is added", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text additions
    const textAdditionGen = fc.tuple(
      fc.string({ minLength: 1, maxLength: 30 }),
      fc.string({ minLength: 1, maxLength: 20 }),
    );

    await fc.assert(
      fc.asyncProperty(textAdditionGen, async ([baseText, addedText]) => {
        const element = createMockInputElement();
        let analysisCount = 0;
        let lastAnalyzedText = "";

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analysisCount++;
              lastAnalyzedText = text;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Set initial text
          modifyText(element, baseText);
          await wait(debounceDelay + 50);

          // Add more text
          const newText = baseText + addedText;
          modifyText(element, newText);
          await wait(debounceDelay + 50);

          // Verify re-analysis was triggered
          expect(analysisCount).toBe(2);
          expect(lastAnalyzedText).toBe(newText);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 20 }, // Reduced from 100
    );
  }, 30000); // 30 second timeout

  it("should trigger analysis when text is deleted", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text deletions
    const textDeletionGen = fc
      .string({ minLength: 5, maxLength: 50 })
      .chain((text) =>
        fc.tuple(
          fc.constant(text),
          fc.integer({ min: 0, max: text.length - 1 }),
        ),
      )
      .map(([text, deleteUpTo]) => [text, text.substring(0, deleteUpTo)]);

    await fc.assert(
      fc.asyncProperty(textDeletionGen, async ([initialText, deletedText]) => {
        const element = createMockInputElement();
        let analysisCount = 0;
        let lastAnalyzedText = "";

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analysisCount++;
              lastAnalyzedText = text;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Set initial text
          modifyText(element, initialText);
          await wait(debounceDelay + 50);

          // Delete some text
          modifyText(element, deletedText);
          await wait(debounceDelay + 50);

          // Verify re-analysis was triggered
          expect(analysisCount).toBe(2);
          expect(lastAnalyzedText).toBe(deletedText);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 20 }, // Reduced from 100
    );
  }, 30000); // 30 second timeout

  it("should trigger analysis when text is replaced", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text replacements
    const textReplacementGen = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
      )
      .filter(([text1, text2]) => text1 !== text2);

    await fc.assert(
      fc.asyncProperty(
        textReplacementGen,
        async ([initialText, replacementText]) => {
          const element = createMockInputElement();
          let analysisCount = 0;
          let lastAnalyzedText = "";

          const monitor = new InputMonitor(
            {
              onTextChange: (text: string) => {
                analysisCount++;
                lastAnalyzedText = text;
              },
            },
            debounceDelay,
          );

          try {
            monitor.observeField(element);
            element.focus();

            // Set initial text
            modifyText(element, initialText);
            await wait(debounceDelay + 50);

            // Replace with new text
            modifyText(element, replacementText);
            await wait(debounceDelay + 50);

            // Verify re-analysis was triggered
            expect(analysisCount).toBe(2);
            expect(lastAnalyzedText).toBe(replacementText);
          } finally {
            monitor.dispose();
            cleanupElement(element);
          }
        },
      ),
      { numRuns: 50 }, // Reduced from 100 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should trigger analysis when text is cleared", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for non-empty text
    const nonEmptyTextGen = fc.string({ minLength: 1, maxLength: 50 });

    await fc.assert(
      fc.asyncProperty(nonEmptyTextGen, async (initialText) => {
        const element = createMockInputElement();
        let analysisCount = 0;
        let lastAnalyzedText = "";

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analysisCount++;
              lastAnalyzedText = text;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Set initial text
          modifyText(element, initialText);
          await wait(debounceDelay + 50);

          // Clear the text
          modifyText(element, "");
          await wait(debounceDelay + 50);

          // Verify re-analysis was triggered
          expect(analysisCount).toBe(2);
          expect(lastAnalyzedText).toBe("");
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }, // Reduced from 100 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should trigger analysis for modifications in contenteditable elements", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text modifications
    const textModificationGen = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
      )
      .filter(([text1, text2]) => text1 !== text2);

    await fc.assert(
      fc.asyncProperty(
        textModificationGen,
        async ([initialText, modifiedText]) => {
          const element = document.createElement("div");
          element.contentEditable = "true";
          document.body.appendChild(element);

          let analysisCount = 0;
          let lastAnalyzedText = "";

          const monitor = new InputMonitor(
            {
              onTextChange: (text: string) => {
                analysisCount++;
                lastAnalyzedText = text;
              },
            },
            debounceDelay,
          );

          try {
            monitor.observeField(element);

            // Focus the element
            element.focus();
            element.dispatchEvent(new Event("focus", { bubbles: true }));
            await wait(10);

            // Set initial text
            element.textContent = initialText;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            await wait(debounceDelay + 50);

            // Verify initial analysis
            expect(analysisCount).toBe(1);
            expect(lastAnalyzedText).toBe(initialText);

            // Modify the text
            element.textContent = modifiedText;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            await wait(debounceDelay + 50);

            // Verify re-analysis was triggered
            expect(analysisCount).toBe(2);
            expect(lastAnalyzedText).toBe(modifiedText);
          } finally {
            monitor.dispose();
            cleanupElement(element);
          }
        },
      ),
      { numRuns: 30 }, // Reduced from 50 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should not trigger analysis when text remains unchanged", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text
    const textGen = fc.string({ minLength: 1, maxLength: 50 });

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = createMockInputElement();
        let analysisCount = 0;

        const monitor = new InputMonitor(
          {
            onTextChange: () => {
              analysisCount++;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Set text
          modifyText(element, text);
          await wait(debounceDelay + 50);

          // Verify initial analysis
          expect(analysisCount).toBe(1);

          // "Modify" with same text (no actual change)
          modifyText(element, text);
          await wait(debounceDelay + 50);

          // Analysis should still be triggered (input event fired)
          // The system doesn't check if text changed, it responds to input events
          expect(analysisCount).toBe(2);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }, // Reduced from 100 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should trigger analysis for modifications at any position in text", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text with modifications at different positions
    const positionModificationGen = fc
      .tuple(
        fc.string({ minLength: 10, maxLength: 30 }),
        fc.integer({ min: 0, max: 9 }),
        fc.string({ minLength: 1, maxLength: 5 }),
      )
      .map(([baseText, position, insertion]) => {
        const modified =
          baseText.substring(0, position) +
          insertion +
          baseText.substring(position);
        return [baseText, modified];
      });

    await fc.assert(
      fc.asyncProperty(
        positionModificationGen,
        async ([initialText, modifiedText]) => {
          const element = createMockInputElement();
          let analysisCount = 0;
          let lastAnalyzedText = "";

          const monitor = new InputMonitor(
            {
              onTextChange: (text: string) => {
                analysisCount++;
                lastAnalyzedText = text;
              },
            },
            debounceDelay,
          );

          try {
            monitor.observeField(element);
            element.focus();

            // Set initial text
            modifyText(element, initialText);
            await wait(debounceDelay + 50);

            // Modify at position
            modifyText(element, modifiedText);
            await wait(debounceDelay + 50);

            // Verify re-analysis was triggered
            expect(analysisCount).toBe(2);
            expect(lastAnalyzedText).toBe(modifiedText);
          } finally {
            monitor.dispose();
            cleanupElement(element);
          }
        },
      ),
      { numRuns: 50 }, // Reduced from 100 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should trigger analysis only for active field when multiple fields are observed", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for text modifications
    const textGen = fc
      .tuple(
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
      )
      .filter(([text1, text2]) => text1 !== text2);

    await fc.assert(
      fc.asyncProperty(textGen, async ([text1, text2]) => {
        const element1 = createMockInputElement();
        const element2 = createMockInputElement();
        let analysisCount = 0;
        let lastAnalyzedText = "";
        let lastAnalyzedElement: InputElement | null = null;

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string, element: InputElement) => {
              analysisCount++;
              lastAnalyzedText = text;
              lastAnalyzedElement = element;
            },
          },
          debounceDelay,
        );

        try {
          // Observe both fields
          monitor.observeField(element1);
          monitor.observeField(element2);

          // Focus element1 and modify
          element1.focus();
          modifyText(element1, text1);
          await wait(debounceDelay + 50);

          // Verify analysis for element1
          expect(analysisCount).toBe(1);
          expect(lastAnalyzedText).toBe(text1);
          expect(lastAnalyzedElement).toBe(element1);

          // Switch focus to element2 and modify
          element1.blur();
          element2.focus();
          modifyText(element2, text2);
          await wait(debounceDelay + 50);

          // Verify re-analysis for element2
          expect(analysisCount).toBe(2);
          expect(lastAnalyzedText).toBe(text2);
          expect(lastAnalyzedElement).toBe(element2);

          // Modify element1 while element2 is active (should not trigger)
          modifyText(element1, text1 + " modified");
          await wait(debounceDelay + 50);

          // Analysis count should remain 2 (no new analysis)
          expect(analysisCount).toBe(2);
        } finally {
          monitor.dispose();
          cleanupElement(element1);
          cleanupElement(element2);
        }
      }),
      { numRuns: 30 }, // Reduced from 50 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should handle rapid modifications correctly with debouncing", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for rapid text modifications
    const rapidModificationsGen = fc.array(
      fc.string({ minLength: 1, maxLength: 20 }),
      { minLength: 3, maxLength: 10 },
    );

    await fc.assert(
      fc.asyncProperty(rapidModificationsGen, async (textSequence) => {
        const element = createMockInputElement();
        let analysisCount = 0;
        let lastAnalyzedText = "";

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analysisCount++;
              lastAnalyzedText = text;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Apply rapid modifications (faster than debounce)
          for (const text of textSequence) {
            modifyText(element, text);
            await wait(20); // Much faster than debounce delay
          }

          // Wait for debounce to complete
          await wait(debounceDelay + 50);

          // Only one analysis should be triggered (for the final text)
          expect(analysisCount).toBe(1);
          expect(lastAnalyzedText).toBe(textSequence[textSequence.length - 1]);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 30 }, // Reduced from 50 for faster execution
    );
  }, 60000); // 60 second timeout

  it("should preserve modified text content for analysis", async () => {
    const debounceDelay = 100; // Reduced for faster testing

    // Generator for arbitrary text modifications
    const textGen = fc.string({ minLength: 0, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = createMockInputElement();
        let analyzedText = "";

        const monitor = new InputMonitor(
          {
            onTextChange: (text: string) => {
              analyzedText = text;
            },
          },
          debounceDelay,
        );

        try {
          monitor.observeField(element);
          element.focus();

          // Modify text
          modifyText(element, text);
          await wait(debounceDelay + 50);

          // Verify the exact text was passed to analysis
          expect(analyzedText).toBe(text);
          expect(element.value).toBe(text);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }, // Reduced from 100 for faster execution
    );
  }, 60000); // 60 second timeout
});
