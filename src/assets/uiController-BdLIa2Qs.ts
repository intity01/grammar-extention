// UI Controller for Grammar Checker Extension
// Handles error highlighting and correction application using multiple techniques

import { GrammarError, Correction } from "./types";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// CSS properties to copy for mirror div technique
const MIRROR_CSS_PROPERTIES = [
  "box-sizing",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "text-indent",
  "text-transform",
  "white-space",
  "word-spacing",
  "word-wrap",
  "word-break",
  "tab-size",
  "overflow-wrap",
] as const;

/**
 * Creates a mirror div that clones CSS properties from a textarea or input element.
 * This technique allows us to calculate the exact position of text within the element.
 *
 * @param element - The textarea or input element to mirror
 * @returns A hidden div element with identical styling
 */
export function createMirrorDiv(
  element: HTMLTextAreaElement | HTMLInputElement,
): HTMLDivElement {
  const mirrorDiv = document.createElement("div");
  const computedStyle = window.getComputedStyle(element);

  // Copy all relevant CSS properties
  MIRROR_CSS_PROPERTIES.forEach((prop) => {
    mirrorDiv.style[prop as any] = computedStyle.getPropertyValue(prop);
  });

  // Set additional properties for accurate mirroring
  mirrorDiv.style.position = "absolute";
  mirrorDiv.style.visibility = "hidden";
  mirrorDiv.style.overflow = "hidden";
  mirrorDiv.style.whiteSpace = "pre-wrap";
  mirrorDiv.style.wordWrap = "break-word";
  mirrorDiv.style.top = "0";
  mirrorDiv.style.left = "0";
  mirrorDiv.style.width = `${element.clientWidth}px`;
  mirrorDiv.style.height = `${element.clientHeight}px`;
  mirrorDiv.style.pointerEvents = "none";

  // Add to DOM temporarily for measurements
  document.body.appendChild(mirrorDiv);

  return mirrorDiv;
}

/**
 * Calculates the coordinates of an error within a textarea or input element
 * using the mirror div technique.
 *
 * @param element - The textarea or input element
 * @param error - The grammar error to locate
 * @returns Rectangle coordinates of the error
 */
export function calculateErrorCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  error: GrammarError,
): Rect {
  const mirrorDiv = createMirrorDiv(element);
  const text = element.value;

  // Create spans for text before, during, and after the error
  const beforeText = text.substring(0, error.start);
  const errorText = text.substring(error.start, error.end);

  // Set mirror content with measurement span
  mirrorDiv.innerHTML = "";

  // Add text before error
  const beforeSpan = document.createElement("span");
  beforeSpan.textContent = beforeText;
  mirrorDiv.appendChild(beforeSpan);

  // Add error text in a measurable span
  const errorSpan = document.createElement("span");
  errorSpan.textContent = errorText;
  errorSpan.style.display = "inline";
  mirrorDiv.appendChild(errorSpan);

  // Get element position
  const elementRect = element.getBoundingClientRect();
  const errorRect = errorSpan.getBoundingClientRect();

  // Calculate relative position
  const rect: Rect = {
    x: errorRect.left - elementRect.left + element.scrollLeft,
    y: errorRect.top - elementRect.top + element.scrollTop,
    width: errorRect.width,
    height: errorRect.height,
  };

  // Clean up
  document.body.removeChild(mirrorDiv);

  return rect;
}

/**
 * Creates a Range object for an error within a contenteditable element.
 * This technique works with rich text editors like Gmail and Google Docs.
 *
 * @param element - The contenteditable element
 * @param error - The grammar error to locate
 * @returns A Range object representing the error location, or null if not found
 */
export function createRangeForError(
  element: HTMLElement,
  error: GrammarError,
): Range | null {
  const range = document.createRange();

  // Helper function to find text nodes and their cumulative offsets
  function findTextNodeAtOffset(
    node: Node,
    targetStart: number,
    targetEnd: number,
    currentOffset = 0,
  ): {
    startNode: Text | null;
    startOffset: number;
    endNode: Text | null;
    endOffset: number;
    found: boolean;
  } {
    let offset = currentOffset;
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;
    let foundStart = false;
    let foundEnd = false;

    function traverse(n: Node) {
      if (foundStart && foundEnd) return;

      if (n.nodeType === Node.TEXT_NODE) {
        const textNode = n as Text;
        const textLength = textNode.textContent?.length || 0;

        // Check if target start is in this text node
        if (!foundStart && offset + textLength >= targetStart) {
          startNode = textNode;
          startOffset = targetStart - offset;
          foundStart = true;
        }

        // Check if target end is in this text node
        if (!foundEnd && offset + textLength >= targetEnd) {
          endNode = textNode;
          endOffset = targetEnd - offset;
          foundEnd = true;
        }

        offset += textLength;
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        // Traverse child nodes
        for (let i = 0; i < n.childNodes.length; i++) {
          traverse(n.childNodes[i]);
          if (foundStart && foundEnd) return;
        }
      }
    }

    traverse(node);

    return {
      startNode,
      startOffset,
      endNode,
      endOffset,
      found: foundStart && foundEnd,
    };
  }

  // Find the text nodes containing the error
  const result = findTextNodeAtOffset(element, error.start, error.end);

  if (!result.found || !result.startNode || !result.endNode) {
    return null;
  }

  try {
    range.setStart(result.startNode, result.startOffset);
    range.setEnd(result.endNode, result.endOffset);
    return range;
  } catch (e) {
    console.error("Failed to create range for error:", e);
    return null;
  }
}

/**
 * Gets the bounding rectangle for an error using the Range API.
 * This works for contenteditable elements.
 *
 * @param element - The contenteditable element
 * @param error - The grammar error to locate
 * @returns Rectangle coordinates of the error, or null if not found
 */
export function getErrorBoundingRect(
  element: HTMLElement,
  error: GrammarError,
): Rect | null {
  const range = createRangeForError(element, error);

  if (!range) {
    return null;
  }

  const domRect = range.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  // Calculate relative position
  const rect: Rect = {
    x: domRect.left - elementRect.left + element.scrollLeft,
    y: domRect.top - elementRect.top + element.scrollTop,
    width: domRect.width,
    height: domRect.height,
  };

  return rect;
}

// Store shadow roots for cleanup
const shadowRootMap = new WeakMap<HTMLElement, ShadowRoot>();

/**
 * Creates a Shadow DOM overlay for an element to provide CSS isolation.
 * This prevents conflicts with the host page's styles.
 *
 * @param element - The element to attach the shadow overlay to
 * @returns The created ShadowRoot
 */
export function createShadowOverlay(element: HTMLElement): ShadowRoot {
  // Check if shadow root already exists
  const existing = shadowRootMap.get(element);
  if (existing) {
    return existing;
  }

  // Create a container div for the shadow overlay
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.pointerEvents = "none";
  container.style.zIndex = "999999";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";

  // Attach shadow root in closed mode for better isolation
  const shadowRoot = container.attachShadow({ mode: "closed" });

  // Add base styles to shadow root
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      display: block;
      position: relative;
    }
    
    .grammar-error-underline {
      position: absolute;
      border-bottom: 2px wavy #ff4444;
      pointer-events: auto;
      cursor: pointer;
      box-sizing: border-box;
    }
    
    .grammar-error-underline:hover {
      background-color: rgba(255, 68, 68, 0.1);
    }
  `;
  shadowRoot.appendChild(style);

  // Position container relative to element
  const elementRect = element.getBoundingClientRect();
  const parent = element.offsetParent || document.body;

  if (element.style.position === "static" || !element.style.position) {
    element.style.position = "relative";
  }

  element.appendChild(container);

  // Store reference
  shadowRootMap.set(element, shadowRoot);

  return shadowRoot;
}

/**
 * Draws an error underline in the shadow DOM overlay.
 *
 * @param shadowRoot - The shadow root to draw in
 * @param rect - The rectangle coordinates for the underline
 * @param error - The grammar error (for data attributes)
 */
export function drawErrorUnderline(
  shadowRoot: ShadowRoot,
  rect: Rect,
  error: GrammarError,
): void {
  const underline = document.createElement("div");
  underline.className = "grammar-error-underline";
  underline.style.left = `${rect.x}px`;
  underline.style.top = `${rect.y}px`;
  underline.style.width = `${rect.width}px`;
  underline.style.height = `${rect.height}px`;

  // Store error data for later retrieval
  underline.setAttribute("data-error-start", error.start.toString());
  underline.setAttribute("data-error-end", error.end.toString());
  underline.setAttribute("data-error-type", error.type);
  underline.setAttribute("data-rule-id", error.ruleId);

  shadowRoot.appendChild(underline);
}

/**
 * Clears all error underlines from a shadow root.
 *
 * @param shadowRoot - The shadow root to clear
 */
export function clearShadowOverlay(shadowRoot: ShadowRoot): void {
  const underlines = shadowRoot.querySelectorAll(".grammar-error-underline");
  underlines.forEach((underline) => underline.remove());
}

/**
 * Checks if the browser supports the CSS Custom Highlight API.
 * This is a progressive enhancement feature for modern browsers.
 *
 * @returns true if the Highlight API is supported
 */
export function supportsHighlightAPI(): boolean {
  return (
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof (CSS as any).highlights !== "undefined"
  );
}

/**
 * Applies error highlighting using the CSS Custom Highlight API.
 * This is the most performant method but only works in modern browsers.
 *
 * @param element - The element to highlight errors in
 * @param errors - Array of grammar errors to highlight
 * @returns true if highlighting was successful, false if API not supported
 */
export function applyHighlightAPI(
  element: HTMLElement,
  errors: GrammarError[],
): boolean {
  if (!supportsHighlightAPI()) {
    return false;
  }

  try {
    // Clear existing highlights
    const highlights = (CSS as any).highlights;
    if (highlights.has("grammar-error")) {
      highlights.delete("grammar-error");
    }

    // Create ranges for all errors
    const ranges: Range[] = [];

    for (const error of errors) {
      let range: Range | null = null;

      // Determine element type and create appropriate range
      if (
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLInputElement
      ) {
        // For textarea/input, we need to use a different approach
        // The Highlight API doesn't work directly with form controls
        // Fall back to other methods
        return false;
      } else if (element.isContentEditable) {
        // For contenteditable, use Range API
        range = createRangeForError(element, error);
      } else {
        // For regular elements, create range from text content
        range = createRangeForError(element, error);
      }

      if (range) {
        ranges.push(range);
      }
    }

    if (ranges.length === 0) {
      return false;
    }

    // Create and register highlight
    const highlight = new (window as any).Highlight(...ranges);
    highlights.set("grammar-error", highlight);

    // Inject CSS for the highlight
    injectHighlightStyles();

    return true;
  } catch (e) {
    console.error("Failed to apply Highlight API:", e);
    return false;
  }
}

/**
 * Injects CSS styles for the Custom Highlight API.
 * This only needs to be done once per page.
 */
let highlightStylesInjected = false;

function injectHighlightStyles(): void {
  if (highlightStylesInjected) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    ::highlight(grammar-error) {
      background-color: transparent;
      text-decoration: wavy underline #ff4444;
      text-decoration-thickness: 2px;
    }
  `;
  document.head.appendChild(style);
  highlightStylesInjected = true;
}

/**
 * Highlights grammar errors in an element using the most appropriate technique.
 * Automatically selects between Highlight API, Shadow DOM, Mirror Div, or Range API.
 *
 * @param element - The element to highlight errors in
 * @param errors - Array of grammar errors to highlight
 */
export function highlightErrors(
  element: HTMLElement,
  errors: GrammarError[],
): void {
  if (errors.length === 0) {
    return;
  }

  // Strategy 1: Try CSS Custom Highlight API (most performant, modern browsers)
  if (element.isContentEditable && supportsHighlightAPI()) {
    const success = applyHighlightAPI(element, errors);
    if (success) {
      return;
    }
  }

  // Strategy 2: Use appropriate technique based on element type
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    // Use Mirror Div technique for textarea/input
    highlightWithMirrorDiv(element, errors);
  } else if (element.isContentEditable) {
    // Use Range API + Shadow DOM for contenteditable
    highlightWithRangeAPI(element, errors);
  } else {
    // For other elements, try Range API
    highlightWithRangeAPI(element, errors);
  }
}

/**
 * Highlights errors using the Mirror Div technique (for textarea/input).
 *
 * @param element - The textarea or input element
 * @param errors - Array of grammar errors to highlight
 */
function highlightWithMirrorDiv(
  element: HTMLTextAreaElement | HTMLInputElement,
  errors: GrammarError[],
): void {
  const shadowRoot = createShadowOverlay(element);
  clearShadowOverlay(shadowRoot);

  for (const error of errors) {
    const rect = calculateErrorCoordinates(element, error);
    drawErrorUnderline(shadowRoot, rect, error);
  }
}

/**
 * Highlights errors using the Range API + Shadow DOM (for contenteditable).
 *
 * @param element - The contenteditable element
 * @param errors - Array of grammar errors to highlight
 */
function highlightWithRangeAPI(
  element: HTMLElement,
  errors: GrammarError[],
): void {
  const shadowRoot = createShadowOverlay(element);
  clearShadowOverlay(shadowRoot);

  for (const error of errors) {
    const rect = getErrorBoundingRect(element, error);
    if (rect) {
      drawErrorUnderline(shadowRoot, rect, error);
    }
  }
}

/**
 * Clears all error highlights from an element.
 *
 * @param element - The element to clear highlights from
 */
export function clearHighlights(element: HTMLElement): void {
  // Clear Highlight API if used
  if (supportsHighlightAPI()) {
    try {
      const highlights = (CSS as any).highlights;
      if (highlights.has("grammar-error")) {
        highlights.delete("grammar-error");
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Clear Shadow DOM overlay
  const shadowRoot = shadowRootMap.get(element);
  if (shadowRoot) {
    clearShadowOverlay(shadowRoot);
  }
}

/**
 * Applies an inline correction to an element.
 * Replaces the error text with the correction while preserving surrounding text.
 *
 * @param element - The element to apply the correction to
 * @param correction - The correction to apply
 */
export function applyInlineCorrection(
  element: HTMLElement,
  correction: Correction,
): void {
  const { error, corrected } = correction;

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    // For textarea/input, use value property
    applyInlineCorrectionToInput(element, error, corrected);
  } else if (element.isContentEditable) {
    // For contenteditable, use Range API
    applyInlineCorrectionToContentEditable(element, error, corrected);
  } else {
    console.warn("Cannot apply inline correction to non-editable element");
  }
}

/**
 * Applies inline correction to textarea or input element.
 *
 * @param element - The textarea or input element
 * @param error - The grammar error
 * @param corrected - The corrected text
 */
function applyInlineCorrectionToInput(
  element: HTMLTextAreaElement | HTMLInputElement,
  error: GrammarError,
  corrected: string,
): void {
  const text = element.value;
  const before = text.substring(0, error.start);
  const after = text.substring(error.end);

  // Calculate cursor position before change
  const cursorPos = element.selectionStart || 0;

  // Apply correction
  element.value = before + corrected + after;

  // Adjust cursor position
  const lengthDiff = corrected.length - (error.end - error.start);
  let newCursorPos = cursorPos;

  if (cursorPos > error.end) {
    // Cursor is after the error
    newCursorPos = cursorPos + lengthDiff;
  } else if (cursorPos >= error.start && cursorPos <= error.end) {
    // Cursor is within or at the boundaries of the error
    // Place cursor at end of corrected text
    newCursorPos = error.start + corrected.length;
  }
  // If cursor is before error, no adjustment needed (newCursorPos = cursorPos)

  // Set new cursor position
  element.setSelectionRange(newCursorPos, newCursorPos);
  element.focus();

  // Trigger input event for any listeners
  const event = new Event("input", { bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Applies inline correction to contenteditable element.
 *
 * @param element - The contenteditable element
 * @param error - The grammar error
 * @param corrected - The corrected text
 */
function applyInlineCorrectionToContentEditable(
  element: HTMLElement,
  error: GrammarError,
  corrected: string,
): void {
  const range = createRangeForError(element, error);

  if (!range) {
    console.warn("Could not create range for error correction");
    return;
  }

  // Save selection before modification
  const selection = window.getSelection();
  const savedRange =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : null;

  // Delete the error text
  range.deleteContents();

  // Insert corrected text
  const textNode = document.createTextNode(corrected);
  range.insertNode(textNode);

  // Restore or adjust selection
  if (savedRange) {
    const lengthDiff = corrected.length - (error.end - error.start);

    // Adjust saved range if needed
    if (savedRange.startOffset > error.end) {
      // Selection was after the error - adjust by length difference
      // This is a simplified adjustment; full implementation would need
      // to traverse the DOM tree to find the correct position
    }

    try {
      selection?.removeAllRanges();
      selection?.addRange(savedRange);
    } catch (e) {
      // If restoration fails, place cursor at end of correction
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }
  }

  // Trigger input event
  const event = new Event("input", { bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Preserves and adjusts cursor position after a text modification.
 * Handles edge cases like cursor at start/end of text.
 *
 * @param element - The element to adjust cursor in
 * @param modificationStart - Start position of the modification
 * @param modificationEnd - End position of the modification
 * @param newTextLength - Length of the new text that replaced the modification
 */
export function preserveCursor(
  element: HTMLElement,
  modificationStart: number,
  modificationEnd: number,
  newTextLength: number,
): void {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    preserveCursorInInput(
      element,
      modificationStart,
      modificationEnd,
      newTextLength,
    );
  } else if (element.isContentEditable) {
    preserveCursorInContentEditable(
      element,
      modificationStart,
      modificationEnd,
      newTextLength,
    );
  }
}

/**
 * Preserves cursor position in textarea or input element.
 *
 * @param element - The textarea or input element
 * @param modificationStart - Start position of the modification
 * @param modificationEnd - End position of the modification
 * @param newTextLength - Length of the new text
 */
function preserveCursorInInput(
  element: HTMLTextAreaElement | HTMLInputElement,
  modificationStart: number,
  modificationEnd: number,
  newTextLength: number,
): void {
  const cursorPos = element.selectionStart || 0;
  const lengthDiff = newTextLength - (modificationEnd - modificationStart);

  let newCursorPos = cursorPos;

  // Edge case: cursor at start (position 0)
  if (cursorPos === 0) {
    newCursorPos = 0;
  }
  // Edge case: cursor at end
  else if (cursorPos >= element.value.length) {
    newCursorPos = element.value.length;
  }
  // Cursor is after the modification
  else if (cursorPos > modificationEnd) {
    newCursorPos = cursorPos + lengthDiff;
  }
  // Cursor is within the modification
  else if (cursorPos >= modificationStart && cursorPos <= modificationEnd) {
    // Place cursor at end of new text
    newCursorPos = modificationStart + newTextLength;
  }
  // Cursor is before the modification - no adjustment needed
  else {
    newCursorPos = cursorPos;
  }

  // Ensure cursor position is within bounds
  newCursorPos = Math.max(0, Math.min(newCursorPos, element.value.length));

  // Set cursor position
  element.setSelectionRange(newCursorPos, newCursorPos);
}

/**
 * Preserves cursor position in contenteditable element.
 *
 * @param element - The contenteditable element
 * @param modificationStart - Start position of the modification
 * @param modificationEnd - End position of the modification
 * @param newTextLength - Length of the new text
 */
function preserveCursorInContentEditable(
  element: HTMLElement,
  modificationStart: number,
  modificationEnd: number,
  newTextLength: number,
): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const lengthDiff = newTextLength - (modificationEnd - modificationStart);

  // Get current cursor position in text content
  const currentOffset = getOffsetInElement(
    element,
    range.startContainer,
    range.startOffset,
  );

  if (currentOffset === null) {
    return;
  }

  let newOffset = currentOffset;

  // Adjust offset based on modification position
  if (currentOffset > modificationEnd) {
    newOffset = currentOffset + lengthDiff;
  } else if (
    currentOffset >= modificationStart &&
    currentOffset <= modificationEnd
  ) {
    newOffset = modificationStart + newTextLength;
  }
  // If before modification, no adjustment needed

  // Set new cursor position
  setOffsetInElement(element, newOffset);
}

/**
 * Gets the text offset of a position within an element.
 *
 * @param element - The element
 * @param node - The node containing the position
 * @param offset - The offset within the node
 * @returns The text offset, or null if not found
 */
function getOffsetInElement(
  element: HTMLElement,
  node: Node,
  offset: number,
): number | null {
  let currentOffset = 0;
  let found = false;
  let targetOffset = 0;

  function traverse(n: Node): boolean {
    if (found) return true;

    if (n === node) {
      targetOffset = currentOffset + offset;
      found = true;
      return true;
    }

    if (n.nodeType === Node.TEXT_NODE) {
      currentOffset += n.textContent?.length || 0;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < n.childNodes.length; i++) {
        if (traverse(n.childNodes[i])) {
          return true;
        }
      }
    }

    return false;
  }

  traverse(element);
  return found ? targetOffset : null;
}

/**
 * Sets the cursor position in an element by text offset.
 *
 * @param element - The element
 * @param offset - The text offset to set cursor to
 */
function setOffsetInElement(element: HTMLElement, offset: number): void {
  let currentOffset = 0;
  let found = false;

  function traverse(n: Node): boolean {
    if (found) return true;

    if (n.nodeType === Node.TEXT_NODE) {
      const textNode = n as Text;
      const textLength = textNode.textContent?.length || 0;

      if (currentOffset + textLength >= offset) {
        // Found the target text node
        const range = document.createRange();
        const localOffset = offset - currentOffset;
        range.setStart(textNode, Math.min(localOffset, textLength));
        range.collapse(true);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        found = true;
        return true;
      }

      currentOffset += textLength;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < n.childNodes.length; i++) {
        if (traverse(n.childNodes[i])) {
          return true;
        }
      }
    }

    return false;
  }

  traverse(element);
}

/**
 * Requests clipboard correction by sending a message to the Service Worker.
 * The Service Worker will create an Offscreen Document to access the clipboard.
 * This ensures the text field is not modified in clipboard mode.
 *
 * @param text - The corrected text to copy to clipboard
 * @returns Promise that resolves when clipboard operation completes
 */
export async function requestClipboardCorrection(text: string): Promise<void> {
  try {
    // Send message to Service Worker
    const response = await chrome.runtime.sendMessage({
      type: "WRITE_TO_CLIPBOARD",
      text: text,
    });

    if (response && response.success) {
      // Show success notification
      showNotification("Corrected text copied to clipboard", "success");
    } else {
      // Show error notification
      const errorMsg = response?.error || "Unknown error";
      showNotification(`Failed to copy to clipboard: ${errorMsg}`, "error");
    }
  } catch (error) {
    console.error("Failed to request clipboard correction:", error);
    showNotification("Failed to copy to clipboard", "error");
  }
}

/**
 * Shows a notification to the user.
 *
 * @param message - The notification message
 * @param type - The notification type (success, error, info)
 */
export function showNotification(
  message: string,
  type: "success" | "error" | "info" = "info",
): void {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `grammar-checker-notification grammar-checker-notification-${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "4px",
    backgroundColor:
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3",
    color: "white",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    zIndex: "1000000",
    maxWidth: "300px",
    wordWrap: "break-word",
    animation: "grammar-checker-fade-in 0.3s ease-in",
  });

  // Add to page
  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "grammar-checker-fade-out 0.3s ease-out";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Inject notification animations
let notificationStylesInjected = false;

function injectNotificationStyles(): void {
  if (notificationStylesInjected) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    @keyframes grammar-checker-fade-in {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes grammar-checker-fade-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
  `;
  document.head.appendChild(style);
  notificationStylesInjected = true;
}

// Inject styles on module load
if (typeof document !== "undefined") {
  injectNotificationStyles();
}
