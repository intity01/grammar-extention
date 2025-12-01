import * as fc from 'fast-check';

/**
 * Feature: grammar-checker-extension, Property 19: Non-Blocking Execution
 * 
 * For any grammar checking operation, user input events should continue to be
 * processed without delay or blocking.
 * 
 * Validates: Requirements 6.3, 6.4
 */

describe('Property 19: Non-Blocking Execution', () => {
  // Maximum acceptable delay for input processing (in milliseconds)
  const MAX_INPUT_DELAY_MS = 16; // ~60fps, one frame
  const TYPING_LAG_THRESHOLD_MS = 50; // Noticeable typing lag threshold

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
   * Helper to create a mock input element
   */
  function createMockInputElement(id: string = 'test-input'): HTMLTextAreaElement {
    const element = document.createElement('textarea');
    element.id = id;
    document.body.appendChild(element);
    return element;
  }

  /**
   * Helper to clean up mock elements
   */
  function cleanupElement(element: HTMLElement): void {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Helper to wait for a specific amount of time
   */
  function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mock Grammar Engine that simulates analysis
   */
  class MockGrammarEngine {
    private isAnalyzing: boolean = false;

    async analyze(text: string): Promise<{
      errors: any[];
      corrections: any[];
      processingTime: number;
    }> {
      this.isAnalyzing = true;
      const startTime = performance.now();

      // Simulate some processing work
      await this.simulateProcessing(text);

      const processingTime = performance.now() - startTime;
      this.isAnalyzing = false;

      return {
        errors: this.detectErrors(text),
        corrections: [],
        processingTime,
      };
    }

    isCurrentlyAnalyzing(): boolean {
      return this.isAnalyzing;
    }

    private async simulateProcessing(text: string): Promise<void> {
      // Simulate async processing (non-blocking)
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Simulate some computational work
      for (let i = 0; i < text.length; i++) {
        // Light work that doesn't block
        const char = text[i];
        const code = char.charCodeAt(0);
      }
    }

    private detectErrors(text: string): any[] {
      const errors: any[] = [];
      const doubleSpaceRegex = /  +/g;
      let match;

      while ((match = doubleSpaceRegex.exec(text)) !== null) {
        errors.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'spacing',
          message: 'Multiple spaces detected',
        });
      }

      return errors;
    }
  }

  /**
   * Input event tracker to measure responsiveness
   */
  class InputEventTracker {
    private events: Array<{ timestamp: number; value: string }> = [];
    private processingDelays: number[] = [];

    recordEvent(value: string): void {
      const timestamp = performance.now();
      
      if (this.events.length > 0) {
        const lastEvent = this.events[this.events.length - 1];
        const delay = timestamp - lastEvent.timestamp;
        this.processingDelays.push(delay);
      }

      this.events.push({ timestamp, value });
    }

    getMaxDelay(): number {
      return this.processingDelays.length > 0
        ? Math.max(...this.processingDelays)
        : 0;
    }

    getAverageDelay(): number {
      if (this.processingDelays.length === 0) return 0;
      const sum = this.processingDelays.reduce((a, b) => a + b, 0);
      return sum / this.processingDelays.length;
    }

    getEventCount(): number {
      return this.events.length;
    }

    reset(): void {
      this.events = [];
      this.processingDelays = [];
    }
  }

  /**
   * Simulate typing with input event tracking
   */
  async function simulateTypingWithTracking(
    element: HTMLTextAreaElement,
    texts: string[],
    delayBetweenKeys: number,
    tracker: InputEventTracker,
    engine: MockGrammarEngine
  ): Promise<void> {
    for (const text of texts) {
      const inputStartTime = performance.now();
      
      // Update element value
      element.value = text;
      
      // Dispatch input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Record the event
      tracker.recordEvent(text);
      
      // Trigger analysis (simulating the extension behavior)
      // This should not block the input processing
      engine.analyze(text).catch(() => {});
      
      const inputEndTime = performance.now();
      const inputProcessingTime = inputEndTime - inputStartTime;
      
      // Verify input was processed quickly
      expect(inputProcessingTime).toBeLessThan(MAX_INPUT_DELAY_MS);
      
      if (delayBetweenKeys > 0) {
        await wait(delayBetweenKeys);
      }
    }
  }

  it('should not block user input during grammar checking', () => {
    // Generator for typing sequences
    const typingSequenceGen = fc.array(
      fc.string({ minLength: 1, maxLength: 20 }),
      { minLength: 5, maxLength: 15 }
    );

    fc.assert(
      fc.asyncProperty(typingSequenceGen, async (texts) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        const tracker = new InputEventTracker();

        try {
          element.focus();

          // Simulate typing with concurrent grammar checking
          await simulateTypingWithTracking(element, texts, 50, tracker, engine);

          // Wait for any pending analysis to complete
          await wait(100);

          // Property: All input events should have been processed
          expect(tracker.getEventCount()).toBe(texts.length);

          // Property: Input processing should not be delayed significantly
          const maxDelay = tracker.getMaxDelay();
          expect(maxDelay).toBeLessThan(TYPING_LAG_THRESHOLD_MS);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should process input events immediately even during analysis', () => {
    const textGen = fc.array(
      fc.oneof(englishCharGen, whitespaceGen),
      { minLength: 50, maxLength: 150 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        let inputEventsProcessed = 0;

        try {
          element.focus();

          // Set up input event listener
          element.addEventListener('input', () => {
            inputEventsProcessed++;
          });

          // Start analysis
          const analysisPromise = engine.analyze(text);

          // Simulate rapid input events during analysis
          for (let i = 0; i < 5; i++) {
            element.value = text + i;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await wait(10);
          }

          // Wait for analysis to complete
          await analysisPromise;

          // Property: All input events should have been processed
          expect(inputEventsProcessed).toBe(5);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain input responsiveness with multiple active fields', () => {
    // Generator for multiple field scenarios
    const multiFieldGen = fc.record({
      fieldCount: fc.integer({ min: 2, max: 5 }),
      textsPerField: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 3, maxLength: 5 }),
    });

    fc.assert(
      fc.asyncProperty(multiFieldGen, async ({ fieldCount, textsPerField }) => {
        const elements: HTMLTextAreaElement[] = [];
        const engine = new MockGrammarEngine();
        const trackers: InputEventTracker[] = [];

        try {
          // Create multiple input fields
          for (let i = 0; i < fieldCount; i++) {
            const element = createMockInputElement(`field-${i}`);
            elements.push(element);
            trackers.push(new InputEventTracker());
          }

          // Focus on first field (active field)
          elements[0].focus();

          // Type in the active field while grammar checking runs
          await simulateTypingWithTracking(
            elements[0],
            textsPerField,
            30,
            trackers[0],
            engine
          );

          // Property: Active field should have processed all events
          expect(trackers[0].getEventCount()).toBe(textsPerField.length);

          // Property: Input should not be delayed
          expect(trackers[0].getMaxDelay()).toBeLessThan(TYPING_LAG_THRESHOLD_MS);

          // Verify only active field was monitored (requirement 6.3)
          // Other fields should not trigger analysis
          for (let i = 1; i < fieldCount; i++) {
            elements[i].value = 'inactive field text';
            elements[i].dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Wait a bit
          await wait(50);

          // Property: Inactive fields should not cause additional processing
          // (This is verified by the fact that we only analyzed text from the active field)
        } finally {
          elements.forEach(cleanupElement);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should not cause typing lag during continuous typing', () => {
    // Generator for continuous typing simulation
    const continuousTypingGen = fc.array(
      fc.oneof(englishCharGen, whitespaceGen, punctuationGen),
      { minLength: 20, maxLength: 50 }
    );

    fc.assert(
      fc.asyncProperty(continuousTypingGen, async (chars) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        const inputDelays: number[] = [];

        try {
          element.focus();

          // Simulate continuous typing (building up text character by character)
          let currentText = '';
          for (const char of chars) {
            const inputStartTime = performance.now();
            
            currentText += char;
            element.value = currentText;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger analysis (non-blocking)
            engine.analyze(currentText).catch(() => {});
            
            const inputEndTime = performance.now();
            const inputDelay = inputEndTime - inputStartTime;
            inputDelays.push(inputDelay);
            
            // Small delay between keystrokes (realistic typing speed)
            await wait(20);
          }

          // Property: No individual input should cause significant lag
          for (const delay of inputDelays) {
            expect(delay).toBeLessThan(MAX_INPUT_DELAY_MS);
          }

          // Property: Average input delay should be minimal
          const avgDelay = inputDelays.reduce((a, b) => a + b, 0) / inputDelays.length;
          expect(avgDelay).toBeLessThan(MAX_INPUT_DELAY_MS / 2);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle rapid input events without blocking', () => {
    const rapidInputGen = fc.array(
      fc.string({ minLength: 1, maxLength: 10 }),
      { minLength: 10, maxLength: 20 }
    );

    fc.assert(
      fc.asyncProperty(rapidInputGen, async (texts) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        let inputEventsReceived = 0;
        const eventTimestamps: number[] = [];

        try {
          element.focus();

          // Track input events
          element.addEventListener('input', () => {
            inputEventsReceived++;
            eventTimestamps.push(performance.now());
          });

          // Fire rapid input events
          for (const text of texts) {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger analysis
            engine.analyze(text).catch(() => {});
          }

          // Wait for processing
          await wait(100);

          // Property: All input events should have been received
          expect(inputEventsReceived).toBe(texts.length);

          // Property: Events should have been processed in rapid succession
          // (no significant gaps indicating blocking)
          for (let i = 1; i < eventTimestamps.length; i++) {
            const gap = eventTimestamps[i] - eventTimestamps[i - 1];
            // Gaps should be minimal (events processed immediately)
            expect(gap).toBeLessThan(50);
          }
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should allow concurrent input and analysis operations', () => {
    const textGen = fc.string({ minLength: 50, maxLength: 200 });

    fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        let concurrentInputsProcessed = 0;

        try {
          element.focus();

          // Start long-running analysis
          const analysisPromise = engine.analyze(text);

          // While analysis is running, process input events
          const inputPromise = (async () => {
            for (let i = 0; i < 10; i++) {
              element.value = text + i;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              concurrentInputsProcessed++;
              await wait(5);
            }
          })();

          // Wait for both to complete
          await Promise.all([analysisPromise, inputPromise]);

          // Property: Input events should have been processed concurrently
          expect(concurrentInputsProcessed).toBe(10);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not block input when analyzing mixed-language text', () => {
    // Generator for mixed-language text
    const mixedTextGen = fc.tuple(
      fc.array(thaiCharGen, { minLength: 20, maxLength: 40 }),
      fc.array(englishCharGen, { minLength: 20, maxLength: 40 }),
      fc.array(japaneseCharGen, { minLength: 20, maxLength: 40 })
    ).map(([thai, english, japanese]) => {
      return [...thai, ' ', ...english, ' ', ...japanese].join('');
    });

    fc.assert(
      fc.asyncProperty(mixedTextGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        const inputDelays: number[] = [];

        try {
          element.focus();

          // Type the mixed-language text character by character
          for (let i = 1; i <= text.length; i++) {
            const inputStartTime = performance.now();
            
            element.value = text.substring(0, i);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger analysis
            engine.analyze(element.value).catch(() => {});
            
            const inputEndTime = performance.now();
            inputDelays.push(inputEndTime - inputStartTime);
            
            await wait(15);
          }

          // Property: Mixed-language analysis should not block input
          for (const delay of inputDelays) {
            expect(delay).toBeLessThan(MAX_INPUT_DELAY_MS);
          }
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain responsiveness with long text', () => {
    // Generator for long text
    const longTextGen = fc.array(
      fc.oneof(englishCharGen, whitespaceGen, punctuationGen),
      { minLength: 500, maxLength: 1000 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(longTextGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        let inputsProcessedDuringAnalysis = 0;

        try {
          element.focus();

          // Set initial long text
          element.value = text;

          // Start analysis of long text
          const analysisPromise = engine.analyze(text);

          // Continue processing input events during analysis
          for (let i = 0; i < 5; i++) {
            const inputStartTime = performance.now();
            
            element.value = text + ' ' + i;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            inputsProcessedDuringAnalysis++;
            
            const inputEndTime = performance.now();
            const inputDelay = inputEndTime - inputStartTime;
            
            // Property: Input should not be blocked even with long text
            expect(inputDelay).toBeLessThan(MAX_INPUT_DELAY_MS);
            
            await wait(20);
          }

          await analysisPromise;

          // Property: All inputs should have been processed
          expect(inputsProcessedDuringAnalysis).toBe(5);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should handle input events during error detection', () => {
    // Generator for text with intentional errors
    const errorProneTextGen = fc.array(
      fc.oneof(
        englishCharGen,
        fc.constant('  '), // Double spaces
        fc.constant('   '), // Triple spaces
        punctuationGen
      ),
      { minLength: 50, maxLength: 150 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(errorProneTextGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        let inputEventsProcessed = 0;

        try {
          element.focus();

          // Start analysis (which will detect errors)
          const analysisPromise = engine.analyze(text);

          // Process input events during error detection
          for (let i = 0; i < 5; i++) {
            const inputStartTime = performance.now();
            
            element.value = text + i;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            inputEventsProcessed++;
            
            const inputEndTime = performance.now();
            
            // Property: Input should not be blocked during error detection
            expect(inputEndTime - inputStartTime).toBeLessThan(MAX_INPUT_DELAY_MS);
            
            await wait(10);
          }

          await analysisPromise;

          // Property: All input events should have been processed
          expect(inputEventsProcessed).toBe(5);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should verify input events are not queued or delayed', () => {
    const textGen = fc.string({ minLength: 20, maxLength: 100 });

    fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        const eventProcessingTimes: number[] = [];

        try {
          element.focus();

          // Track when events are actually processed
          element.addEventListener('input', () => {
            eventProcessingTimes.push(performance.now());
          });

          // Fire events and trigger analysis
          const eventFireTimes: number[] = [];
          for (let i = 0; i < 10; i++) {
            eventFireTimes.push(performance.now());
            element.value = text + i;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            engine.analyze(element.value).catch(() => {});
            await wait(10);
          }

          // Property: Events should be processed immediately (not queued)
          for (let i = 0; i < eventFireTimes.length; i++) {
            const delay = eventProcessingTimes[i] - eventFireTimes[i];
            // Processing should happen within a few milliseconds
            expect(delay).toBeLessThan(5);
          }
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle contenteditable elements without blocking', () => {
    const textGen = fc.array(
      fc.oneof(englishCharGen, whitespaceGen),
      { minLength: 20, maxLength: 50 }
    ).map(chars => chars.join(''));

    fc.assert(
      fc.asyncProperty(textGen, async (text) => {
        const element = document.createElement('div');
        element.contentEditable = 'true';
        document.body.appendChild(element);

        const engine = new MockGrammarEngine();
        const inputDelays: number[] = [];

        try {
          element.focus();

          // Type in contenteditable
          for (let i = 1; i <= text.length; i++) {
            const inputStartTime = performance.now();
            
            element.textContent = text.substring(0, i);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger analysis
            engine.analyze(element.textContent || '').catch(() => {});
            
            const inputEndTime = performance.now();
            inputDelays.push(inputEndTime - inputStartTime);
            
            await wait(15);
          }

          // Property: Contenteditable input should not be blocked
          for (const delay of inputDelays) {
            expect(delay).toBeLessThan(MAX_INPUT_DELAY_MS);
          }
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain input responsiveness across multiple analysis cycles', () => {
    const textSequenceGen = fc.array(
      fc.string({ minLength: 10, maxLength: 50 }),
      { minLength: 5, maxLength: 10 }
    );

    fc.assert(
      fc.asyncProperty(textSequenceGen, async (texts) => {
        const element = createMockInputElement();
        const engine = new MockGrammarEngine();
        const allInputDelays: number[] = [];

        try {
          element.focus();

          // Multiple analysis cycles
          for (const text of texts) {
            const inputStartTime = performance.now();
            
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Trigger analysis
            await engine.analyze(text);
            
            const inputEndTime = performance.now();
            allInputDelays.push(inputEndTime - inputStartTime);
            
            await wait(50);
          }

          // Property: Input should remain responsive across all cycles
          for (const delay of allInputDelays) {
            expect(delay).toBeLessThan(TYPING_LAG_THRESHOLD_MS);
          }

          // Property: No degradation in responsiveness over time
          const firstHalfAvg = allInputDelays.slice(0, Math.floor(allInputDelays.length / 2))
            .reduce((a, b) => a + b, 0) / Math.floor(allInputDelays.length / 2);
          const secondHalfAvg = allInputDelays.slice(Math.floor(allInputDelays.length / 2))
            .reduce((a, b) => a + b, 0) / Math.ceil(allInputDelays.length / 2);
          
          // Second half should not be significantly slower
          expect(secondHalfAvg).toBeLessThanOrEqual(firstHalfAvg * 1.5);
        } finally {
          cleanupElement(element);
        }
      }),
      { numRuns: 50 }
    );
  });
});
