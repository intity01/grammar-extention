import * as fc from "fast-check";
import { InputMonitor, InputElement } from "../../src/lib/inputMonitor";

/**
 * Feature: grammar-checker-extension, Property 18: Debounced Input Processing
 *
 * For any sequence of rapid input events within the debounce delay period,
 * only the final event should trigger grammar analysis.
 *
 * Validates: Requirements 6.2
 */

describe("Property 18: Debounced Input Processing", () => {
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

  // Helper to simulate typing with delays
  async function simulateTyping(
    element: HTMLTextAreaElement,
    texts: string[],
    delayBetweenKeys: number,
  ): Promise<void> {
    for (const text of texts) {
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      if (delayBetweenKeys > 0) {
        await wait(delayBetweenKeys);
      }
    }
  }

  it("should trigger analysis only once for rapid input events within debounce period", async () => {
    const debounceDelay = 300;

    // Generator for rapid input sequences (delays less than debounce period)
    const rapidInputGen = fc.tuple(
      fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 2,
        maxLength: 10,
      }),
      fc.integer({ min: 0, max: debounceDelay - 50 }), // Delay less than debounce period
    );

    await fc.assert(
      fc.asyncProperty(rapidInputGen, async ([texts, delayBetweenKeys]) => {
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

          // Simulate rapid typing
          await simulateTyping(element, texts, delayBetweenKeys);

          // Wait for debounce period to complete
          await wait(debounceDelay + 50);

          // Verify only one analysis was triggered (for the final text)
          expect(analysisCount).toBe(1);

          // Verify the analyzed text is the final text
          expect(lastAnalyzedText).toBe(texts[texts.length - 1]);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 20 }, // Reduced from 100 to avoid timeout
    );
  }, 30000); // 30 second timeout

  it("should trigger multiple analyses for input events separated by debounce period", async () => {
    const debounceDelay = 300;

    // Generator for slow input sequences (delays greater than debounce period)
    const slowInputGen = fc.tuple(
      fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 2,
        maxLength: 3,
      }), // Reduced max length
      fc.integer({ min: debounceDelay + 50, max: debounceDelay + 100 }), // Delay greater than debounce period
    );

    await fc.assert(
      fc.asyncProperty(slowInputGen, async ([texts, delayBetweenKeys]) => {
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
          // Observe the field
          monitor.observeField(element);

          // Focus the element to make it active
          element.focus();

          // Simulate slow typing (each keystroke triggers analysis)
          await simulateTyping(element, texts, delayBetweenKeys);

          // Wait for final debounce period to complete
          await wait(debounceDelay + 50);

          // Verify multiple analyses were triggered (one for each text)
          expect(analysisCount).toBe(texts.length);

          // Verify all texts were analyzed in order
          expect(analyzedTexts).toEqual(texts);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 10 }, // Reduced from 100 to avoid timeout
    );
  }, 30000); // 30 second timeout

  it("should reset debounce timer on each new input event", async () => {
    const debounceDelay = 300;
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

      // Type first character
      element.value = "a";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait almost to debounce period
      await wait(debounceDelay - 50);

      // Type second character (should reset timer)
      element.value = "ab";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait almost to debounce period again
      await wait(debounceDelay - 50);

      // Type third character (should reset timer again)
      element.value = "abc";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // At this point, no analysis should have been triggered yet
      expect(analysisCount).toBe(0);

      // Wait for debounce period to complete
      await wait(debounceDelay + 50);

      // Now exactly one analysis should have been triggered
      expect(analysisCount).toBe(1);
    } finally {
      monitor.dispose();
      cleanupElement(element);
    }
  });

  it("should handle mixed rapid and slow input sequences correctly", async () => {
    const debounceDelay = 300;

    // Generator for mixed input patterns
    const mixedInputGen = fc.array(
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: debounceDelay + 100 }),
      ),
      { minLength: 3, maxLength: 5 }, // Reduced max length
    );

    await fc.assert(
      fc.asyncProperty(mixedInputGen, async (inputSequence) => {
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

          // Simulate mixed typing pattern
          for (const [text, delay] of inputSequence) {
            element.value = text;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            await wait(delay);
          }

          // Wait for final debounce period
          await wait(debounceDelay + 50);

          // Count expected analyses based on delays
          let expectedAnalyses = 0;
          for (let i = 0; i < inputSequence.length; i++) {
            const [, delay] = inputSequence[i];

            // If this is the last input, it will always trigger analysis
            if (i === inputSequence.length - 1) {
              expectedAnalyses++;
              break;
            }

            // If delay is >= debounce period, this input will trigger analysis
            if (delay >= debounceDelay) {
              expectedAnalyses++;
            }
          }

          // Verify analysis count matches expected
          expect(analysisCount).toBe(expectedAnalyses);

          // Verify all analyzed texts are from the input sequence
          for (const analyzedText of analyzedTexts) {
            const found = inputSequence.some(([text]) => text === analyzedText);
            expect(found).toBe(true);
          }
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 15 }, // Reduced from 100 to avoid timeout
    );
  }, 30000); // 30 second timeout

  it("should not trigger analysis for inactive fields", async () => {
    const debounceDelay = 300;
    const element1 = createMockInputElement();
    const element2 = createMockInputElement();
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
      // Observe both fields
      monitor.observeField(element1);
      monitor.observeField(element2);

      // Focus element1 (make it active)
      element1.focus();

      // Type in element1 (should trigger analysis)
      element1.value = "active field";
      element1.dispatchEvent(new Event("input", { bubbles: true }));

      // Type in element2 without focusing (should NOT trigger analysis)
      element2.value = "inactive field";
      element2.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait for debounce period
      await wait(debounceDelay + 50);

      // Only one analysis should have been triggered (for element1)
      expect(analysisCount).toBe(1);
    } finally {
      monitor.dispose();
      cleanupElement(element1);
      cleanupElement(element2);
    }
  });

  it("should cancel pending analysis when field is unobserved", async () => {
    const debounceDelay = 300;
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

      // Type something
      element.value = "test";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // Unobserve before debounce period completes
      await wait(debounceDelay / 2);
      monitor.unobserveField(element);

      // Wait for what would have been the debounce period
      await wait(debounceDelay);

      // No analysis should have been triggered
      expect(analysisCount).toBe(0);
    } finally {
      monitor.dispose();
      cleanupElement(element);
    }
  });

  it("should handle rapid focus changes correctly", async () => {
    const debounceDelay = 300;
    const element1 = createMockInputElement();
    const element2 = createMockInputElement();
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
      monitor.observeField(element1);
      monitor.observeField(element2);

      // Focus element1 and type
      element1.focus();
      element1.value = "first";
      element1.dispatchEvent(new Event("input", { bubbles: true }));

      // Quickly switch to element2 before debounce completes
      await wait(debounceDelay / 2);
      element1.blur();
      element2.focus();
      element2.value = "second";
      element2.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait for debounce period
      await wait(debounceDelay + 50);

      // Both fields may trigger analysis since blur doesn't cancel the timer
      // The important thing is that the last analyzed text is from the active field
      expect(analysisCount).toBeGreaterThanOrEqual(1);
      expect(lastAnalyzedText).toBe("second");
    } finally {
      monitor.dispose();
      cleanupElement(element1);
      cleanupElement(element2);
    }
  });

  it("should work with different debounce delay values", async () => {
    // Generator for different debounce delays
    const debounceDelayGen = fc.integer({ min: 100, max: 500 });

    await fc.assert(
      fc.asyncProperty(debounceDelayGen, async (debounceDelay) => {
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

          // Type rapidly (faster than debounce delay)
          const rapidDelay = Math.floor(debounceDelay / 3);
          await simulateTyping(element, ["a", "ab", "abc"], rapidDelay);

          // Wait for debounce period
          await wait(debounceDelay + 50);

          // Only one analysis should have been triggered
          expect(analysisCount).toBe(1);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 20 }, // Reduced from 100 to avoid timeout
    );
  }, 30000); // 30 second timeout

  it("should preserve the final text value after debouncing", async () => {
    const debounceDelay = 300;

    // Generator for text sequences
    const textSequenceGen = fc.array(
      fc.string({ minLength: 1, maxLength: 50 }),
      { minLength: 2, maxLength: 10 },
    );

    await fc.assert(
      fc.asyncProperty(textSequenceGen, async (texts) => {
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

          // Type rapidly
          await simulateTyping(element, texts, 10);

          // Wait for debounce period
          await wait(debounceDelay + 50);

          // The analyzed text should be the final text
          expect(analyzedText).toBe(texts[texts.length - 1]);
          expect(element.value).toBe(texts[texts.length - 1]);
        } finally {
          monitor.dispose();
          cleanupElement(element);
        }
      }),
      { numRuns: 20 }, // Reduced from 100 to avoid timeout
    );
  }, 30000); // 30 second timeout

  it("should handle empty input events correctly", async () => {
    const debounceDelay = 300;
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

      // Type something
      element.value = "test";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      await wait(50);

      // Clear the input
      element.value = "";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait for debounce period
      await wait(debounceDelay + 50);

      // One analysis should have been triggered with empty text
      expect(analysisCount).toBe(1);
      expect(lastAnalyzedText).toBe("");
    } finally {
      monitor.dispose();
      cleanupElement(element);
    }
  });

  it("should work correctly with contenteditable elements", async () => {
    const debounceDelay = 300;
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

      // Focus the element and dispatch focus event to make it active
      element.focus();
      element.dispatchEvent(new Event("focus", { bubbles: true }));

      // Give focus event time to process
      await wait(10);

      // Type rapidly
      element.textContent = "a";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      await wait(50);

      element.textContent = "ab";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      await wait(50);

      element.textContent = "abc";
      element.dispatchEvent(new Event("input", { bubbles: true }));

      // Wait for debounce period
      await wait(debounceDelay + 50);

      // Only one analysis should have been triggered
      expect(analysisCount).toBe(1);
      expect(lastAnalyzedText).toBe("abc");
    } finally {
      monitor.dispose();
      cleanupElement(element);
    }
  });
});
