/**
 * Content Script Entry Point
 * Initializes the grammar checker on web pages
 * Requirements: 1.1, 1.4, 4.4
 */

import { InputMonitor, InputElement } from "../lib/inputMonitor";
import {
  highlightErrors,
  clearHighlights,
  applyInlineCorrection,
  requestClipboardCorrection,
  showNotification,
} from "../lib/uiController";
import { AnalysisResult, Correction, ExtensionSettings } from "../lib/types";

// Keep-Alive connection to Service Worker
let keepAlivePort: chrome.runtime.Port | null = null;

// Input Monitor instance
let inputMonitor: InputMonitor | null = null;

// Current settings
let currentSettings: ExtensionSettings | null = null;

// Performance monitoring
const performanceMetrics = {
  analysisCount: 0,
  totalTime: 0,
  maxTime: 0,
  minTime: Infinity,
  recentTimes: [] as number[], // Track last 10 analysis times
  slowAnalysisCount: 0, // Count analyses that exceed 50ms target
};

/**
 * Initialize the grammar checker extension on page load
 */
async function initialize(): Promise<void> {
  console.log("Grammar Checker: Initializing content script");

  try {
    // Establish Keep-Alive connection to Service Worker
    establishKeepAliveConnection();

    // Get current settings
    currentSettings = await getSettings();

    // Check if extension is enabled
    if (!currentSettings.enabled) {
      console.log("Grammar Checker: Extension is disabled");
      return;
    }

    // Initialize Input Monitor with callbacks
    inputMonitor = new InputMonitor(
      {
        onTextChange: handleTextChange,
      },
      currentSettings.debounceDelay,
    );

    // Attach to all text input fields on the page
    attachToInputFields();

    // Observe DOM for dynamically added input fields
    observeDOMForNewInputs();

    console.log("Grammar Checker: Initialization complete");
  } catch (error) {
    console.error("Grammar Checker: Failed to initialize:", error);
  }
}

/**
 * Establish Keep-Alive connection to Service Worker
 * This prevents the Service Worker from terminating while content scripts are active
 */
function establishKeepAliveConnection(): void {
  try {
    // Create a long-lived connection
    keepAlivePort = chrome.runtime.connect({ name: "keep-alive" });

    // Handle disconnection
    keepAlivePort.onDisconnect.addListener(() => {
      console.log("Grammar Checker: Keep-Alive connection disconnected");

      // Attempt to reconnect after a short delay
      setTimeout(() => {
        if (chrome.runtime?.id) {
          establishKeepAliveConnection();
        }
      }, 1000);
    });

    console.log("Grammar Checker: Keep-Alive connection established");
  } catch (error) {
    console.error(
      "Grammar Checker: Failed to establish Keep-Alive connection:",
      error,
    );
  }
}

/**
 * Get current settings from Service Worker
 */
async function getSettings(): Promise<ExtensionSettings> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_SETTINGS",
    });

    if (response && response.settings) {
      return response.settings;
    }

    // Return default settings if none available
    return {
      enabled: true,
      correctionMode: "inline",
      languages: [],
      debounceDelay: 300,
      performanceMode: "balanced",
    };
  } catch (error) {
    console.error("Grammar Checker: Failed to get settings:", error);
    // Return default settings on error
    return {
      enabled: true,
      correctionMode: "inline",
      languages: [],
      debounceDelay: 300,
      performanceMode: "balanced",
    };
  }
}

/**
 * Attach to all text input fields on the page
 * Supports textarea, input, and contenteditable elements
 */
function attachToInputFields(): void {
  if (!inputMonitor) {
    return;
  }

  // Find all text input fields
  const textareas = document.querySelectorAll("textarea");
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
  );
  const contentEditables = document.querySelectorAll(
    '[contenteditable="true"]',
  );

  // Attach to textareas
  textareas.forEach((textarea) => {
    inputMonitor!.observeField(textarea as InputElement);
  });

  // Attach to inputs
  inputs.forEach((input) => {
    inputMonitor!.observeField(input as InputElement);
  });

  // Attach to contenteditable elements
  contentEditables.forEach((element) => {
    inputMonitor!.observeField(element as InputElement);
  });

  const totalFields =
    textareas.length + inputs.length + contentEditables.length;
  console.log(`Grammar Checker: Attached to ${totalFields} input fields`);
}

/**
 * Observe DOM for dynamically added input fields
 * Uses MutationObserver to detect new elements
 */
function observeDOMForNewInputs(): void {
  if (!inputMonitor) {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;

          // Check if the node itself is an input field
          if (isInputField(element)) {
            inputMonitor!.observeField(element as InputElement);
          }

          // Check for input fields within the added node
          const textareas = element.querySelectorAll("textarea");
          const inputs = element.querySelectorAll(
            'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
          );
          const contentEditables = element.querySelectorAll(
            '[contenteditable="true"]',
          );

          textareas.forEach((textarea) => {
            inputMonitor!.observeField(textarea as InputElement);
          });

          inputs.forEach((input) => {
            inputMonitor!.observeField(input as InputElement);
          });

          contentEditables.forEach((el) => {
            inputMonitor!.observeField(el as InputElement);
          });
        }
      });
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("Grammar Checker: Observing DOM for new input fields");
}

/**
 * Check if an element is an input field
 */
function isInputField(element: HTMLElement): boolean {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  if (element instanceof HTMLInputElement) {
    const type = element.type;
    return (
      type === "text" ||
      type === "email" ||
      type === "search" ||
      type === "url" ||
      !type
    );
  }

  if (element.contentEditable === "true" || element.isContentEditable) {
    return true;
  }

  return false;
}

// Store current analysis results per element
const elementAnalysisResults = new WeakMap<InputElement, AnalysisResult>();

/**
 * Handle text change events from Input Monitor
 * Sends text to Service Worker for analysis
 */
async function handleTextChange(
  text: string,
  element: InputElement,
): Promise<void> {
  if (!text || text.trim().length === 0) {
    // Clear highlights if text is empty
    clearHighlights(element);
    elementAnalysisResults.delete(element);
    return;
  }

  try {
    // Send text to Service Worker for analysis
    const startTime = performance.now();

    const response = await chrome.runtime.sendMessage({
      type: "ANALYZE_TEXT",
      text: text,
    });

    const endTime = performance.now();
    const analysisTime = endTime - startTime;

    // Update performance metrics
    updatePerformanceMetrics(analysisTime);

    if (response && response.result) {
      const result: AnalysisResult = response.result;

      // Store result for this element
      elementAnalysisResults.set(element, result);

      // Clear previous highlights
      clearHighlights(element);

      // Highlight new errors
      if (result.errors.length > 0) {
        highlightErrors(element, result.errors);

        // Attach click handlers to error highlights
        attachErrorClickHandlers(element, result);
      }

      // Log performance in dev mode
      if (process.env.NODE_ENV === "development") {
        console.log(
          `Grammar Checker: Analysis completed in ${analysisTime.toFixed(2)}ms`,
          `(${result.errors.length} errors found)`,
        );
      }
    }
  } catch (error) {
    console.error("Grammar Checker: Failed to analyze text:", error);
  }
}

/**
 * Update performance metrics
 * Tracks analysis time for each request and logs metrics in dev mode
 * Ensures analysis completes within 50ms target (after debounce)
 */
function updatePerformanceMetrics(analysisTime: number): void {
  performanceMetrics.analysisCount++;
  performanceMetrics.totalTime += analysisTime;
  performanceMetrics.maxTime = Math.max(
    performanceMetrics.maxTime,
    analysisTime,
  );
  performanceMetrics.minTime = Math.min(
    performanceMetrics.minTime,
    analysisTime,
  );

  // Track recent times (last 10)
  performanceMetrics.recentTimes.push(analysisTime);
  if (performanceMetrics.recentTimes.length > 10) {
    performanceMetrics.recentTimes.shift();
  }

  // Count slow analyses (exceeding 50ms target)
  if (analysisTime > 50) {
    performanceMetrics.slowAnalysisCount++;

    // Log warning for slow analysis in dev mode
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Grammar Checker: Slow analysis detected (${analysisTime.toFixed(2)}ms > 50ms target)`,
      );
    }
  }

  // Log performance summary every 10 analyses in dev mode
  if (
    process.env.NODE_ENV === "development" &&
    performanceMetrics.analysisCount % 10 === 0
  ) {
    const avgTime =
      performanceMetrics.totalTime / performanceMetrics.analysisCount;
    const recentAvg =
      performanceMetrics.recentTimes.reduce((a, b) => a + b, 0) /
      performanceMetrics.recentTimes.length;
    const slowPercentage =
      (performanceMetrics.slowAnalysisCount /
        performanceMetrics.analysisCount) *
      100;

    console.log("Grammar Checker: Performance Summary", {
      count: performanceMetrics.analysisCount,
      avgTime: avgTime.toFixed(2) + "ms",
      recentAvg: recentAvg.toFixed(2) + "ms",
      minTime: performanceMetrics.minTime.toFixed(2) + "ms",
      maxTime: performanceMetrics.maxTime.toFixed(2) + "ms",
      slowAnalyses: `${performanceMetrics.slowAnalysisCount} (${slowPercentage.toFixed(1)}%)`,
      target: "50ms",
    });
  }
}

/**
 * Get current performance metrics
 * Useful for debugging and monitoring
 */
export function getPerformanceMetrics() {
  const avgTime =
    performanceMetrics.analysisCount > 0
      ? performanceMetrics.totalTime / performanceMetrics.analysisCount
      : 0;

  const recentAvg =
    performanceMetrics.recentTimes.length > 0
      ? performanceMetrics.recentTimes.reduce((a, b) => a + b, 0) /
        performanceMetrics.recentTimes.length
      : 0;

  return {
    analysisCount: performanceMetrics.analysisCount,
    avgTime,
    recentAvg,
    minTime:
      performanceMetrics.minTime === Infinity ? 0 : performanceMetrics.minTime,
    maxTime: performanceMetrics.maxTime,
    slowAnalysisCount: performanceMetrics.slowAnalysisCount,
    slowPercentage:
      performanceMetrics.analysisCount > 0
        ? (performanceMetrics.slowAnalysisCount /
            performanceMetrics.analysisCount) *
          100
        : 0,
  };
}

/**
 * Attach click handlers to error highlights
 * Allows users to click on errors to see corrections and apply them
 */
function attachErrorClickHandlers(
  element: InputElement,
  _result: AnalysisResult,
): void {
  // For Shadow DOM overlays, we need to attach handlers to the underline elements
  // This is a simplified implementation - in production, you'd want to use
  // a more sophisticated approach with proper event delegation

  // Add click handler to the element itself to detect clicks on error highlights
  const clickHandler = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    // Get the analysis result for this element
    const analysisResult = elementAnalysisResults.get(element);
    if (!analysisResult) {
      return;
    }

    // Find which error was clicked (if any)
    const clickedError = findErrorAtPosition(
      element,
      mouseEvent,
      analysisResult.errors,
    );

    if (clickedError) {
      // Find the correction for this error
      const correction = analysisResult.corrections.find(
        (c) => c.error === clickedError,
      );

      if (correction) {
        // Show correction popup or apply directly based on settings
        showCorrectionPopup(element, clickedError, correction, mouseEvent);
      }
    }
  };

  // Store handler for cleanup
  element.addEventListener("click", clickHandler);
}

/**
 * Find which error (if any) was clicked based on mouse position
 */
function findErrorAtPosition(
  _element: InputElement,
  _event: MouseEvent,
  errors: any[],
): any | null {
  // This is a simplified implementation
  // In production, you'd calculate the exact position based on the element type

  // For now, we'll use a simple approach: check if click is within element bounds
  // and show the first error (in a real implementation, you'd calculate exact positions)

  if (errors.length > 0) {
    // Return the first error for now
    // TODO: Implement proper position-based error detection
    return errors[0];
  }

  return null;
}

/**
 * Show correction popup when user clicks on an error
 */
function showCorrectionPopup(
  element: InputElement,
  error: any,
  correction: Correction,
  event: MouseEvent,
): void {
  // Create popup element
  const popup = document.createElement("div");
  popup.className = "grammar-checker-correction-popup";

  // Style the popup
  Object.assign(popup.style, {
    position: "fixed",
    left: `${event.clientX}px`,
    top: `${event.clientY + 10}px`,
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: "1000001",
    maxWidth: "300px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
  });

  // Add error message
  const errorMsg = document.createElement("div");
  errorMsg.textContent = error.message;
  errorMsg.style.marginBottom = "8px";
  errorMsg.style.color = "#333";
  popup.appendChild(errorMsg);

  // Add correction suggestion
  const suggestionDiv = document.createElement("div");
  suggestionDiv.style.marginBottom = "8px";

  const originalSpan = document.createElement("span");
  originalSpan.textContent = correction.original;
  originalSpan.style.textDecoration = "line-through";
  originalSpan.style.color = "#f44336";
  originalSpan.style.marginRight = "8px";

  const arrowSpan = document.createElement("span");
  arrowSpan.textContent = "→";
  arrowSpan.style.marginRight = "8px";

  const correctedSpan = document.createElement("span");
  correctedSpan.textContent = correction.corrected;
  correctedSpan.style.color = "#4caf50";
  correctedSpan.style.fontWeight = "bold";

  suggestionDiv.appendChild(originalSpan);
  suggestionDiv.appendChild(arrowSpan);
  suggestionDiv.appendChild(correctedSpan);
  popup.appendChild(suggestionDiv);

  // Add apply button
  const applyButton = document.createElement("button");
  applyButton.textContent =
    currentSettings?.correctionMode === "clipboard"
      ? "Copy to Clipboard"
      : "Apply Correction";
  Object.assign(applyButton.style, {
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "13px",
    marginRight: "8px",
  });

  applyButton.addEventListener("click", async () => {
    await handleCorrectionAccepted(element, correction);
    document.body.removeChild(popup);
  });

  popup.appendChild(applyButton);

  // Add dismiss button
  const dismissButton = document.createElement("button");
  dismissButton.textContent = "Dismiss";
  Object.assign(dismissButton.style, {
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "13px",
  });

  dismissButton.addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  popup.appendChild(dismissButton);

  // Add to page
  document.body.appendChild(popup);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (popup.parentNode) {
      document.body.removeChild(popup);
    }
  }, 10000);

  // Dismiss on click outside
  const outsideClickHandler = (e: MouseEvent) => {
    if (!popup.contains(e.target as Node)) {
      if (popup.parentNode) {
        document.body.removeChild(popup);
      }
      document.removeEventListener("click", outsideClickHandler);
    }
  };

  // Add listener after a short delay to prevent immediate dismissal
  setTimeout(() => {
    document.addEventListener("click", outsideClickHandler);
  }, 100);
}

/**
 * Handle user accepting a correction
 * This will be called from UI event handlers (to be implemented in next subtask)
 */
export async function handleCorrectionAccepted(
  element: InputElement,
  correction: Correction,
): Promise<void> {
  if (!currentSettings) {
    console.error("Grammar Checker: Settings not loaded");
    return;
  }

  try {
    if (currentSettings.correctionMode === "inline") {
      // Apply inline correction
      applyInlineCorrection(element, correction);

      // Re-analyze after correction
      const text = inputMonitor?.extractText(element) || "";
      await handleTextChange(text, element);
    } else if (currentSettings.correctionMode === "clipboard") {
      // Copy corrected text to clipboard
      const text = inputMonitor?.extractText(element) || "";
      const before = text.substring(0, correction.error.start);
      const after = text.substring(correction.error.end);
      const correctedText = before + correction.corrected + after;

      await requestClipboardCorrection(correctedText);
    }
  } catch (error) {
    console.error("Grammar Checker: Failed to apply correction:", error);
    showNotification("Failed to apply correction", "error");
  }
}

/**
 * Listen for settings changes
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.settings) {
    const newSettings = changes.settings.newValue as ExtensionSettings;
    currentSettings = newSettings;

    // Update debounce delay if changed
    if (
      inputMonitor &&
      newSettings.debounceDelay !== currentSettings?.debounceDelay
    ) {
      // Recreate input monitor with new debounce delay
      inputMonitor.dispose();
      inputMonitor = new InputMonitor(
        {
          onTextChange: handleTextChange,
        },
        newSettings.debounceDelay,
      );
      attachToInputFields();
    }

    console.log("Grammar Checker: Settings updated", newSettings);
  }
});

/**
 * Clean up on page unload
 */
window.addEventListener("beforeunload", () => {
  if (inputMonitor) {
    inputMonitor.dispose();
  }

  if (keepAlivePort) {
    keepAlivePort.disconnect();
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
