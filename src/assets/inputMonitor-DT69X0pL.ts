/**
 * Input Monitor Component
 * Monitors text input fields and triggers grammar analysis
 */

export type InputElement = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

export interface InputMonitorCallbacks {
  onTextChange: (text: string, element: InputElement) => void;
  onFieldUnobserved?: (element: InputElement) => void;
}

export class InputMonitor {
  private observedFields: Map<InputElement, AbortController> = new Map();
  private activeField: InputElement | null = null;
  private callbacks: InputMonitorCallbacks;
  private debounceTimers: Map<InputElement, number> = new Map();
  private debounceDelay: number = 300; // 300ms default

  constructor(callbacks: InputMonitorCallbacks, debounceDelay: number = 300) {
    this.callbacks = callbacks;
    this.debounceDelay = debounceDelay;
  }

  /**
   * Observe an input field for text changes
   * Supports textarea, input, and contenteditable elements
   */
  observeField(element: InputElement): void {
    // Don't observe if already observing
    if (this.observedFields.has(element)) {
      return;
    }

    // Create abort controller for cleanup
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Attach event listeners based on element type
    if (this.isContentEditable(element)) {
      // For contenteditable elements
      element.addEventListener("input", this.handleInput.bind(this), {
        signal,
      });
      element.addEventListener("focus", this.handleFocus.bind(this), {
        signal,
      });
      element.addEventListener("blur", this.handleBlur.bind(this), { signal });
    } else if (this.isTextInput(element)) {
      // For textarea and input elements
      element.addEventListener("input", this.handleInput.bind(this), {
        signal,
      });
      element.addEventListener("focus", this.handleFocus.bind(this), {
        signal,
      });
      element.addEventListener("blur", this.handleBlur.bind(this), { signal });
    }

    this.observedFields.set(element, abortController);
  }

  /**
   * Stop observing an input field
   */
  unobserveField(element: InputElement): void {
    const abortController = this.observedFields.get(element);
    if (abortController) {
      abortController.abort();
      this.observedFields.delete(element);
    }

    // Clear any pending debounce timer
    const timer = this.debounceTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(element);
    }

    // Clear active field if it's this element
    if (this.activeField === element) {
      this.activeField = null;
    }

    // Notify cleanup callback if provided
    if (this.callbacks.onFieldUnobserved) {
      this.callbacks.onFieldUnobserved(element);
    }
  }

  /**
   * Get the currently active input field
   */
  getActiveField(): InputElement | null {
    return this.activeField;
  }

  /**
   * Extract text content from various input types
   */
  extractText(element: InputElement): string {
    if (this.isContentEditable(element)) {
      // For contenteditable, use textContent or innerText
      return element.textContent || "";
    } else if (this.isTextInput(element)) {
      // For textarea and input elements
      return (element as HTMLTextAreaElement | HTMLInputElement).value || "";
    }
    return "";
  }

  /**
   * Set text content in an input field
   */
  setText(element: InputElement, text: string, cursorPos?: number): void {
    if (this.isContentEditable(element)) {
      element.textContent = text;
      if (cursorPos !== undefined) {
        this.setCursorPosition(element, cursorPos);
      }
    } else if (this.isTextInput(element)) {
      const inputElement = element as HTMLTextAreaElement | HTMLInputElement;
      inputElement.value = text;
      if (cursorPos !== undefined) {
        inputElement.selectionStart = cursorPos;
        inputElement.selectionEnd = cursorPos;
      }
    }
  }

  /**
   * Handle input events with debouncing
   */
  private handleInput(event: Event): void {
    const element = event.target as InputElement;

    // Only process if this is the active field
    if (element !== this.activeField) {
      return;
    }

    // Clear existing timer for this element
    const existingTimer = this.debounceTimers.get(element);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = window.setTimeout(() => {
      const text = this.extractText(element);
      this.callbacks.onTextChange(text, element);
      this.debounceTimers.delete(element);
    }, this.debounceDelay);

    this.debounceTimers.set(element, timer);
  }

  /**
   * Handle focus events - track active field
   */
  private handleFocus(event: Event): void {
    const element = event.target as InputElement;
    this.activeField = element;
  }

  /**
   * Handle blur events - clear active field
   */
  private handleBlur(event: Event): void {
    const element = event.target as InputElement;
    if (this.activeField === element) {
      this.activeField = null;
    }
  }

  /**
   * Check if element is a contenteditable element
   */
  private isContentEditable(element: HTMLElement): boolean {
    return element.contentEditable === "true" || element.isContentEditable;
  }

  /**
   * Check if element is a text input or textarea
   */
  private isTextInput(
    element: HTMLElement,
  ): element is HTMLTextAreaElement | HTMLInputElement {
    return (
      element instanceof HTMLTextAreaElement ||
      (element instanceof HTMLInputElement &&
        (element.type === "text" ||
          element.type === "email" ||
          element.type === "search" ||
          element.type === "url"))
    );
  }

  /**
   * Set cursor position in contenteditable element
   */
  private setCursorPosition(element: HTMLElement, position: number): void {
    const range = document.createRange();
    const selection = window.getSelection();

    if (!selection) return;

    try {
      const textNode = this.getTextNodeAtPosition(element, position);
      if (textNode) {
        range.setStart(textNode.node, textNode.offset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // Silently fail if cursor positioning fails
      console.warn("Failed to set cursor position:", e);
    }
  }

  /**
   * Get text node and offset at a given position
   */
  private getTextNodeAtPosition(
    element: HTMLElement,
    position: number,
  ): { node: Node; offset: number } | null {
    let currentPos = 0;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const textLength = node.textContent?.length || 0;
      if (currentPos + textLength >= position) {
        return {
          node,
          offset: position - currentPos,
        };
      }
      currentPos += textLength;
    }

    return null;
  }

  /**
   * Clean up all observers
   */
  dispose(): void {
    // Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Unobserve all fields
    this.observedFields.forEach((controller, element) => {
      controller.abort();
    });
    this.observedFields.clear();

    this.activeField = null;
  }
}
