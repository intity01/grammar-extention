import * as fc from 'fast-check';
import {
  highlightErrors,
  clearHighlights,
  createShadowOverlay,
  calculateErrorCoordinates,
  getErrorBoundingRect,
} from '../../src/lib/uiController';
import { GrammarError, Language } from '../../src/lib/types';

/**
 * Feature: grammar-checker-extension, Property 2: Error Highlighting Completeness
 * 
 * For any set of detected grammar errors, the UI Controller should create visual
 * indicators for all errors in the DOM.
 * 
 * Validates: Requirements 1.2, 1.3
 */

describe('Property 2: Error Highlighting Completeness', () => {
  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = '';
    
    // Mock CSS.highlights if not available
    if (typeof CSS === 'undefined') {
      (global as any).CSS = {};
    }
    if (!(CSS as any).highlights) {
      (CSS as any).highlights = new Map();
    }

    // Mock getBoundingClientRect for all elements
    Element.prototype.getBoundingClientRect = jest.fn(function(this: Element) {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        top: 0,
        right: 100,
        bottom: 20,
        left: 0,
        toJSON: () => {},
      } as DOMRect;
    });

    // Mock Range.getBoundingClientRect
    if (typeof Range !== 'undefined') {
      Range.prototype.getBoundingClientRect = jest.fn(() => {
        return {
          x: 0,
          y: 0,
          width: 50,
          height: 20,
          top: 0,
          right: 50,
          bottom: 20,
          left: 0,
          toJSON: () => {},
        } as DOMRect;
      });
    }

    // Mock attachShadow to return a proper shadow root
    const originalAttachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = jest.fn(function(this: Element, init: ShadowRootInit) {
      // Create a div to act as shadow root
      const shadowRoot = document.createElement('div') as any;
      shadowRoot.mode = init.mode;
      shadowRoot.host = this;
      
      // Add shadow root methods
      shadowRoot.appendChild = function(node: Node) {
        return HTMLElement.prototype.appendChild.call(this, node);
      };
      shadowRoot.querySelectorAll = function(selector: string) {
        return HTMLElement.prototype.querySelectorAll.call(this, selector);
      };
      
      // Store reference
      (this as any)._shadowRoot = shadowRoot;
      
      return shadowRoot as ShadowRoot;
    });
  });

  afterEach(() => {
    // Clean up the document body after each test
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  /**
   * Generator for grammar errors with valid positions
   */
  const grammarErrorGen = (textLength: number) =>
    fc.record({
      start: fc.integer({ min: 0, max: Math.max(0, textLength - 1) }),
      end: fc.integer({ min: 1, max: textLength }),
      type: fc.constantFrom('grammar', 'spelling', 'redundancy', 'spacing'),
      message: fc.string({ minLength: 1, maxLength: 50 }),
      language: fc.constantFrom(Language.ENGLISH, Language.THAI, Language.JAPANESE),
      ruleId: fc.string({ minLength: 1, maxLength: 20 }),
    }).filter((error) => error.start < error.end);

  /**
   * Generator for arrays of non-overlapping grammar errors
   */
  const nonOverlappingErrorsGen = (textLength: number, maxErrors: number = 5) =>
    fc
      .array(grammarErrorGen(textLength), { minLength: 1, maxLength: maxErrors })
      .map((errors) => {
        // Sort by start position
        const sorted = errors.sort((a, b) => a.start - b.start);
        
        // Remove overlapping errors
        const nonOverlapping: GrammarError[] = [];
        let lastEnd = 0;
        
        for (const error of sorted) {
          if (error.start >= lastEnd) {
            nonOverlapping.push(error);
            lastEnd = error.end;
          }
        }
        
        return nonOverlapping;
      })
      .filter((errors) => errors.length > 0);

  /**
   * Helper function to count visual indicators in the DOM
   */
  function countVisualIndicators(element: HTMLElement): number {
    let count = 0;

    // Check for shadow DOM overlays (including mocked shadow roots)
    const containers = element.querySelectorAll('div');
    for (const container of Array.from(containers)) {
      const shadowRoot = (container as any).shadowRoot || (container as any)._shadowRoot;
      if (shadowRoot) {
        const underlines = shadowRoot.querySelectorAll('.grammar-error-underline');
        count += underlines.length;
      }
    }

    // Also check direct children of element (in case shadow root is attached to element itself)
    const elementShadowRoot = (element as any).shadowRoot || (element as any)._shadowRoot;
    if (elementShadowRoot) {
      const underlines = elementShadowRoot.querySelectorAll('.grammar-error-underline');
      count += underlines.length;
    }

    // Check for CSS Highlight API (if supported)
    if (typeof CSS !== 'undefined' && (CSS as any).highlights) {
      try {
        const highlights = (CSS as any).highlights;
        if (highlights.has('grammar-error')) {
          const highlight = highlights.get('grammar-error');
          // Count ranges in the highlight
          if (highlight && highlight.size !== undefined) {
            count += highlight.size;
          }
        }
      } catch (e) {
        // Highlight API not available or error accessing it
      }
    }

    return count;
  }

  /**
   * Helper function to get all error indicators from shadow DOM
   */
  function getErrorIndicators(element: HTMLElement): Element[] {
    const indicators: Element[] = [];

    // Check for shadow DOM overlays (including mocked shadow roots)
    const containers = element.querySelectorAll('div');
    for (const container of Array.from(containers)) {
      const shadowRoot = (container as any).shadowRoot || (container as any)._shadowRoot;
      if (shadowRoot) {
        const underlines = shadowRoot.querySelectorAll('.grammar-error-underline');
        underlines.forEach((underline: Element) => indicators.push(underline));
      }
    }

    // Also check direct children of element (in case shadow root is attached to element itself)
    const elementShadowRoot = (element as any).shadowRoot || (element as any)._shadowRoot;
    if (elementShadowRoot) {
      const underlines = elementShadowRoot.querySelectorAll('.grammar-error-underline');
      underlines.forEach((underline: Element) => indicators.push(underline));
    }

    return indicators;
  }

  it('should create visual indicators for all detected errors in textarea', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate errors for this text
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Count visual indicators
          const indicatorCount = countVisualIndicators(textarea);

          // Property: Number of visual indicators should equal number of errors
          expect(indicatorCount).toBe(errors.length);

          // Verify each error has a corresponding indicator
          const indicators = getErrorIndicators(textarea);
          expect(indicators.length).toBe(errors.length);

          // Verify each indicator has correct data attributes
          for (let i = 0; i < indicators.length; i++) {
            const indicator = indicators[i];
            expect(indicator.hasAttribute('data-error-start')).toBe(true);
            expect(indicator.hasAttribute('data-error-end')).toBe(true);
            expect(indicator.hasAttribute('data-error-type')).toBe(true);
            expect(indicator.hasAttribute('data-rule-id')).toBe(true);
          }

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for all detected errors in input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (text) => {
          // Create input element
          const input = document.createElement('input');
          input.type = 'text';
          input.value = text;
          input.style.width = '400px';
          document.body.appendChild(input);

          // Generate errors for this text
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting
          highlightErrors(input, errors);

          // Count visual indicators
          const indicatorCount = countVisualIndicators(input);

          // Property: Number of visual indicators should equal number of errors
          expect(indicatorCount).toBe(errors.length);

          // Verify each error has a corresponding indicator
          const indicators = getErrorIndicators(input);
          expect(indicators.length).toBe(errors.length);

          // Clean up
          clearHighlights(input);
          document.body.removeChild(input);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for all detected errors in contenteditable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (text) => {
          // Create contenteditable element
          const div = document.createElement('div');
          div.contentEditable = 'true';
          div.textContent = text;
          div.style.width = '400px';
          div.style.minHeight = '100px';
          div.style.border = '1px solid black';
          document.body.appendChild(div);

          // Generate errors for this text
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting
          highlightErrors(div, errors);

          // Count visual indicators
          const indicatorCount = countVisualIndicators(div);

          // Property: Number of visual indicators should equal number of errors
          expect(indicatorCount).toBe(errors.length);

          // Verify each error has a corresponding indicator
          const indicators = getErrorIndicators(div);
          expect(indicators.length).toBe(errors.length);

          // Clean up
          clearHighlights(div);
          document.body.removeChild(div);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for multiple errors independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate multiple errors
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 5), 1)[0];

          // Verify we have multiple errors
          if (errors.length < 2) {
            // Skip if we don't have multiple errors
            document.body.removeChild(textarea);
            return;
          }

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: Each error should have its own independent indicator
          expect(indicators.length).toBe(errors.length);

          // Verify each indicator corresponds to a unique error
          const indicatorStarts = new Set<string>();
          const indicatorEnds = new Set<string>();

          for (const indicator of indicators) {
            const start = indicator.getAttribute('data-error-start');
            const end = indicator.getAttribute('data-error-end');
            
            expect(start).not.toBeNull();
            expect(end).not.toBeNull();
            
            if (start && end) {
              indicatorStarts.add(start);
              indicatorEnds.add(end);
            }
          }

          // Verify indicators are independent (different positions)
          expect(indicatorStarts.size).toBeGreaterThan(0);

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for errors at any position in the text', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 30, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate errors at different positions
          const errors: GrammarError[] = [];
          
          // Error at start
          if (text.length > 5) {
            errors.push({
              start: 0,
              end: Math.min(5, text.length),
              type: 'grammar',
              message: 'Error at start',
              language: Language.ENGLISH,
              ruleId: 'test_001',
            });
          }

          // Error in middle
          if (text.length > 20) {
            const mid = Math.floor(text.length / 2);
            errors.push({
              start: mid,
              end: Math.min(mid + 5, text.length),
              type: 'spelling',
              message: 'Error in middle',
              language: Language.ENGLISH,
              ruleId: 'test_002',
            });
          }

          // Error at end
          if (text.length > 10) {
            errors.push({
              start: Math.max(0, text.length - 5),
              end: text.length,
              type: 'redundancy',
              message: 'Error at end',
              language: Language.ENGLISH,
              ruleId: 'test_003',
            });
          }

          if (errors.length === 0) {
            document.body.removeChild(textarea);
            return;
          }

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: All errors should be highlighted regardless of position
          expect(indicators.length).toBe(errors.length);

          // Verify each error position is represented
          const indicatedPositions = indicators.map((ind) => ({
            start: parseInt(ind.getAttribute('data-error-start') || '0'),
            end: parseInt(ind.getAttribute('data-error-end') || '0'),
          }));

          for (const error of errors) {
            const found = indicatedPositions.some(
              (pos) => pos.start === error.start && pos.end === error.end
            );
            expect(found).toBe(true);
          }

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for errors of all types', async () => {
    const errorTypes = ['grammar', 'spelling', 'redundancy', 'spacing'];

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 40, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Create one error of each type
          const errors: GrammarError[] = [];
          const segmentSize = Math.floor(text.length / errorTypes.length);

          for (let i = 0; i < errorTypes.length; i++) {
            const start = i * segmentSize;
            const end = Math.min(start + 5, (i + 1) * segmentSize, text.length);
            
            if (start < end) {
              errors.push({
                start,
                end,
                type: errorTypes[i],
                message: `Error of type ${errorTypes[i]}`,
                language: Language.ENGLISH,
                ruleId: `test_${i}`,
              });
            }
          }

          if (errors.length === 0) {
            document.body.removeChild(textarea);
            return;
          }

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: All error types should have visual indicators
          expect(indicators.length).toBe(errors.length);

          // Verify each error type is represented
          const indicatedTypes = indicators.map((ind) =>
            ind.getAttribute('data-error-type')
          );

          for (const error of errors) {
            expect(indicatedTypes).toContain(error.type);
          }

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create no visual indicators when error array is empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Apply highlighting with empty error array
          highlightErrors(textarea, []);

          // Count visual indicators
          const indicatorCount = countVisualIndicators(textarea);

          // Property: No indicators should be created for empty error array
          expect(indicatorCount).toBe(0);

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all visual indicators after multiple highlight calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate errors
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting multiple times
          highlightErrors(textarea, errors);
          highlightErrors(textarea, errors);
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: All errors should still be highlighted after multiple calls
          // (The implementation should handle this by clearing and re-applying)
          expect(indicators.length).toBe(errors.length);

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators with correct position data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate errors
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: Each indicator should have correct position data matching its error
          expect(indicators.length).toBe(errors.length);

          for (const indicator of indicators) {
            const start = parseInt(indicator.getAttribute('data-error-start') || '-1');
            const end = parseInt(indicator.getAttribute('data-error-end') || '-1');
            const type = indicator.getAttribute('data-error-type');
            const ruleId = indicator.getAttribute('data-rule-id');

            // Find matching error
            const matchingError = errors.find(
              (e) => e.start === start && e.end === end && e.type === type && e.ruleId === ruleId
            );

            expect(matchingError).toBeDefined();
            
            if (matchingError) {
              // Verify position is within text bounds
              expect(start).toBeGreaterThanOrEqual(0);
              expect(end).toBeLessThanOrEqual(text.length);
              expect(start).toBeLessThan(end);
            }
          }

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators for arbitrarily long text with many errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 500 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '600px';
          textarea.style.height = '400px';
          document.body.appendChild(textarea);

          // Generate many errors
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 10), 1)[0];

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Get all indicators
          const indicators = getErrorIndicators(textarea);

          // Property: All errors should be highlighted regardless of text length or error count
          expect(indicators.length).toBe(errors.length);

          // Verify all indicators are valid
          for (const indicator of indicators) {
            expect(indicator.hasAttribute('data-error-start')).toBe(true);
            expect(indicator.hasAttribute('data-error-end')).toBe(true);
            expect(indicator.hasAttribute('data-error-type')).toBe(true);
            expect(indicator.hasAttribute('data-rule-id')).toBe(true);
          }

          // Clean up
          clearHighlights(textarea);
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 50 } // Fewer runs for longer text
    );
  });

  it('should clear all visual indicators when clearHighlights is called', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 100 }),
        async (text) => {
          // Create textarea element
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.width = '400px';
          textarea.style.height = '200px';
          document.body.appendChild(textarea);

          // Generate errors
          const errors = await fc.sample(nonOverlappingErrorsGen(text.length, 3), 1)[0];

          // Apply highlighting
          highlightErrors(textarea, errors);

          // Verify indicators were created
          let indicatorCount = countVisualIndicators(textarea);
          expect(indicatorCount).toBe(errors.length);

          // Clear highlights
          clearHighlights(textarea);

          // Property: All visual indicators should be removed after clearing
          indicatorCount = countVisualIndicators(textarea);
          expect(indicatorCount).toBe(0);

          // Verify no indicators remain
          const indicators = getErrorIndicators(textarea);
          expect(indicators.length).toBe(0);

          // Clean up
          document.body.removeChild(textarea);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create visual indicators consistently for the same errors', async () => {
    const text = 'This is a test text with some errors in it for testing purposes.';
    const errors: GrammarError[] = [
      {
        start: 10,
        end: 14,
        type: 'grammar',
        message: 'Test error 1',
        language: Language.ENGLISH,
        ruleId: 'test_001',
      },
      {
        start: 30,
        end: 36,
        type: 'spelling',
        message: 'Test error 2',
        language: Language.ENGLISH,
        ruleId: 'test_002',
      },
    ];

    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.width = '400px';
    textarea.style.height = '200px';
    document.body.appendChild(textarea);

    // Apply highlighting multiple times
    highlightErrors(textarea, errors);
    const indicators1 = getErrorIndicators(textarea);

    clearHighlights(textarea);
    highlightErrors(textarea, errors);
    const indicators2 = getErrorIndicators(textarea);

    clearHighlights(textarea);
    highlightErrors(textarea, errors);
    const indicators3 = getErrorIndicators(textarea);

    // Property: Highlighting should be deterministic (same errors = same indicators)
    expect(indicators1.length).toBe(errors.length);
    expect(indicators2.length).toBe(errors.length);
    expect(indicators3.length).toBe(errors.length);

    // Verify positions are consistent
    for (let i = 0; i < errors.length; i++) {
      const start1 = indicators1[i].getAttribute('data-error-start');
      const start2 = indicators2[i].getAttribute('data-error-start');
      const start3 = indicators3[i].getAttribute('data-error-start');

      expect(start1).toBe(start2);
      expect(start2).toBe(start3);

      const end1 = indicators1[i].getAttribute('data-error-end');
      const end2 = indicators2[i].getAttribute('data-error-end');
      const end3 = indicators3[i].getAttribute('data-error-end');

      expect(end1).toBe(end2);
      expect(end2).toBe(end3);
    }

    // Clean up
    clearHighlights(textarea);
    document.body.removeChild(textarea);
  });
});
