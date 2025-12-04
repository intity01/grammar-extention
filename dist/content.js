// Grammar Checker Extension - Content Script
// Real-time grammar checking with inline suggestions

const DEBUG_MODE = false; // Set to false for production
const log = (...args) => DEBUG_MODE && console.log(...args);
const warn = (...args) => console.warn(...args);
const error = (...args) => console.error(...args);

log("🔍 Grammar Checker: Content script loaded!");

let currentSettings = null;
let inputMonitor = null;
let activeField = null;
let currentErrors = [];
let suggestionPopup = null;
let siteEnabled = true;
let extensionValid = true;
let selectedSuggestionIndex = 0;
let currentSuggestions = [];
let popupAutoHideTimeout = null;

// Clear popup auto-hide timeout
function clearPopupTimeout() {
  if (popupAutoHideTimeout) {
    clearTimeout(popupAutoHideTimeout);
    popupAutoHideTimeout = null;
  }
}

// Start auto-hide countdown
function startPopupAutoHide(delay = 5000) {
  clearPopupTimeout();
  popupAutoHideTimeout = setTimeout(() => {
    if (suggestionPopup && suggestionPopup.style.display !== "none") {
      hideSuggestionPopup();
    }
  }, delay);
}

// Check if extension context is still valid
function isExtensionValid() {
  try {
    // This will throw if context is invalidated
    return !!(chrome.runtime && chrome.runtime.id);
  } catch (e) {
    return false;
  }
}

// Safely send message to background
async function safeSendMessage(message) {
  // Already invalidated - don't try
  if (!extensionValid) return null;
  
  if (!isExtensionValid()) {
    extensionValid = false;
    log("🔍 Grammar Checker: Extension context invalidated, stopping...");
    cleanup();
    return null;
  }
  
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response;
  } catch (e) {
    // Handle all extension errors gracefully
    if (e.message?.includes("Extension context invalidated") ||
        e.message?.includes("Receiving end does not exist") ||
        e.message?.includes("The message port closed")) {
      extensionValid = false;
      cleanup();
    } else {
      console.warn("🔍 Grammar Checker: Message error:", e.message);
    }
    return null; // Always return null on error, never throw
  }
}

// Cleanup when extension is invalidated
function cleanup() {
  try {
    if (inputMonitor) {
      inputMonitor.disconnect();
      inputMonitor = null;
    }
    if (suggestionPopup) {
      suggestionPopup.remove();
      suggestionPopup = null;
    }
    if (shortcutsHint) {
      hideShortcutsHint();
    }
    // Remove injected styles
    const styles = document.getElementById("grammar-checker-styles");
    if (styles) styles.remove();
    
    // Clear all event listeners and marks
    document.querySelectorAll('[data-grammar-original-bg]').forEach(el => {
      if (el.dataset.grammarOriginalBg) {
        el.style.background = el.dataset.grammarOriginalBg;
        delete el.dataset.grammarOriginalBg;
      }
      if (el.dataset.grammarOriginalPosition) {
        el.style.position = el.dataset.grammarOriginalPosition;
        delete el.dataset.grammarOriginalPosition;
      }
      if (el.dataset.grammarOriginalZ) {
        el.style.zIndex = el.dataset.grammarOriginalZ;
        delete el.dataset.grammarOriginalZ;
      }
    });
    
    log("🔍 Grammar Checker: Cleaned up");
  } catch (e) {
    warn('🔍 Cleanup error:', e.message);
  }
}

// ============================================
// STYLES - Inject CSS for highlights and popup (Minimal Design)
// ============================================
function injectStyles() {
  if (document.getElementById("grammar-checker-styles")) return;
  
  const style = document.createElement("style");
  style.id = "grammar-checker-styles";
  style.textContent = `
    /* Error underlines - subtle and clean */
    .grammar-error {
      border-bottom: 2px solid #ef4444;
      cursor: pointer;
      position: relative;
      background: transparent;
    }
    
    .grammar-error:hover {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .grammar-error-warning {
      border-bottom-color: #f59e0b;
    }
    
    .grammar-error-warning:hover {
      background: rgba(245, 158, 11, 0.1);
    }
    
    .grammar-error-info {
      border-bottom-color: #6b7280;
      border-bottom-style: dashed;
    }
    
    .grammar-error-info:hover {
      background: rgba(107, 114, 128, 0.1);
    }
    
    /* Suggestion Popup - Minimal */
    #grammar-suggestion-popup {
      position: fixed;
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      padding: 0;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      min-width: 240px;
      max-width: 320px;
      overflow: hidden;
    }
    
    .grammar-popup-header {
      background: #1a1a1a;
      color: #fff;
      padding: 10px 14px;
      font-weight: 500;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .grammar-popup-header.warning {
      background: #92400e;
    }
    
    .grammar-popup-header.info {
      background: #374151;
    }
    
    .grammar-popup-message {
      padding: 12px 14px;
      color: #4b5563;
      font-size: 12px;
      line-height: 1.5;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .grammar-popup-original {
      padding: 8px 14px;
      background: #fef2f2;
      color: #991b1b;
      font-size: 12px;
    }
    
    .grammar-popup-original span {
      text-decoration: line-through;
      opacity: 0.7;
    }
    
    .grammar-popup-suggestions {
      max-height: 160px;
      overflow-y: auto;
    }
    
    .grammar-popup-suggestion {
      padding: 10px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.1s;
      border-bottom: 1px solid #f9fafb;
    }
    
    .grammar-popup-suggestion:last-child {
      border-bottom: none;
    }
    
    .grammar-popup-suggestion:hover {
      background: #f9fafb;
    }
    
    .grammar-popup-suggestion.selected {
      background: #f3f4f6;
    }
    
    .grammar-popup-suggestion-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .grammar-popup-suggestion-num {
      background: #e5e7eb;
      color: #374151;
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }
    
    .grammar-popup-suggestion.selected .grammar-popup-suggestion-num {
      background: #1a1a1a;
      color: #fff;
    }
    
    .grammar-popup-suggestion-text {
      color: #059669;
      font-weight: 500;
      font-size: 13px;
    }
    
    .grammar-popup-hint {
      font-size: 10px;
      color: #9ca3af;
    }
    
    .grammar-popup-keyboard-hint {
      padding: 8px 14px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      font-size: 10px;
      color: #9ca3af;
      display: flex;
      gap: 12px;
    }
    
    .grammar-popup-keyboard-hint kbd {
      background: #e5e7eb;
      padding: 1px 4px;
      border-radius: 3px;
      font-family: inherit;
      font-size: 9px;
    }
    
    .grammar-popup-actions {
      padding: 10px 14px;
      display: flex;
      gap: 8px;
      background: #fafafa;
      border-top: 1px solid #f3f4f6;
    }
    
    .grammar-popup-btn {
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.15s;
    }
    
    .grammar-popup-btn-add-dict {
      background: #f3f4f6;
      color: #374151;
    }
    
    .grammar-popup-btn-add-dict:hover {
      background: #e5e7eb;
    }
    
    .grammar-popup-btn-ignore {
      background: transparent;
      color: #9ca3af;
    }
    
    .grammar-popup-btn-ignore:hover {
      background: #f3f4f6;
      color: #374151;
    }
    
    /* Error Badge - Minimal */
    .grammar-error-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #1a1a1a;
      color: #fff;
      border-radius: 10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      cursor: pointer;
      z-index: 1000;
      pointer-events: auto;
      transition: transform 0.15s;
    }
    
    .grammar-error-badge:hover {
      transform: scale(1.1);
    }
    
    /* Animations */
    @keyframes grammarSlideIn {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes grammarPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    /* Shortcuts Hint - Minimal */
    .grammar-shortcuts-hint {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #fff;
      padding: 12px 16px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      z-index: 2147483646;
      line-height: 1.8;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .grammar-shortcuts-hint kbd {
      background: rgba(255,255,255,0.15);
      padding: 2px 5px;
      border-radius: 4px;
      margin: 0 2px;
      font-family: inherit;
    }
    
    /* Loading Indicator - Minimal */
    .grammar-loading {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .grammar-loading::after {
      content: '';
      width: 12px;
      height: 12px;
      border: 2px solid #e5e7eb;
      border-top-color: #1a1a1a;
      border-radius: 50%;
      animation: grammarSpin 0.6s linear infinite;
    }
    
    @keyframes grammarSpin {
      to { transform: rotate(360deg); }
    }
    
    /* Success Badge */
    .grammar-success-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #059669;
      color: #fff;
      border-radius: 10px;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      z-index: 1000;
    }
    
    /* Toast - Minimal */
    .grammar-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      z-index: 2147483647;
      animation: grammarSlideIn 0.2s ease;
    }
    
    /* Scrollbar - Minimal */
    .grammar-popup-suggestions::-webkit-scrollbar {
      width: 4px;
    }
    
    .grammar-popup-suggestions::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .grammar-popup-suggestions::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 4px;
    }
    
    .grammar-success-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    /* Highlight overlay for textarea/input */
    .grammar-highlight-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }
    
    .grammar-highlight-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow: hidden;
      color: transparent;
      pointer-events: none;
    }
    
    .grammar-highlight-mark {
      background: rgba(239, 68, 68, 0.25);
      border-bottom: 2px solid #ef4444;
      border-radius: 2px;
      cursor: pointer;
      pointer-events: auto;
    }
    
    .grammar-highlight-mark.warning {
      background: rgba(245, 158, 11, 0.25);
      border-bottom-color: #f59e0b;
    }
    
    .grammar-highlight-mark.info {
      background: rgba(107, 114, 128, 0.2);
      border-bottom-color: #6b7280;
      border-bottom-style: dashed;
    }
    
    .grammar-wrapper {
      position: relative;
      display: inline-block;
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// SUGGESTION POPUP
// ============================================
function createSuggestionPopup() {
  if (suggestionPopup) return suggestionPopup;
  
  suggestionPopup = document.createElement("div");
  suggestionPopup.id = "grammar-suggestion-popup";
  suggestionPopup.style.display = "none";
  suggestionPopup.tabIndex = -1; // Prevent focus stealing
  
  // Prevent popup from stealing focus when clicking inside
  suggestionPopup.addEventListener("mousedown", (e) => {
    e.preventDefault(); // Prevents focus from leaving the input field
  });
  
  document.body.appendChild(suggestionPopup);
  
  return suggestionPopup;
}

function showSuggestionPopup(error, rect, field) {
  const popup = createSuggestionPopup();
  
  const severityClass = error.severity === "warning" ? 'warning' : error.severity === "info" ? 'info' : '';
  const icon = error.severity === "warning" ? '⚠️' : error.severity === "info" ? 'ℹ️' : '❌';
  
  // Build suggestions list - support multiple corrections
  currentSuggestions = [];
  if (error.correction) {
    // If correction is a string, convert to array
    if (typeof error.correction === 'string') {
      currentSuggestions = [error.correction];
    } else if (Array.isArray(error.correction)) {
      currentSuggestions = error.correction;
    }
  }
  
  // Add common alternatives based on error type
  if (error.matchedText && currentSuggestions.length < 5) {
    const alternatives = generateAlternatives(error.matchedText, error.type);
    for (const alt of alternatives) {
      if (!currentSuggestions.includes(alt) && currentSuggestions.length < 5) {
        currentSuggestions.push(alt);
      }
    }
  }
  
  selectedSuggestionIndex = 0;
  
  // Build suggestion section
  const suggestionSection = currentSuggestions.length > 0 ? `
    <div class="grammar-popup-suggestions">
      ${currentSuggestions.map((sug, i) => `
        <div class="grammar-popup-suggestion ${i === 0 ? 'selected' : ''}" data-action="apply" data-index="${i}">
          <div class="grammar-popup-suggestion-left">
            <span class="grammar-popup-suggestion-num">${i + 1}</span>
            <span class="grammar-popup-suggestion-text">${escapeHtml(sug)}</span>
          </div>
          <span class="grammar-popup-hint">${i === 0 ? 'Enter' : i + 1}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  popup.innerHTML = `
    <div class="grammar-popup-header ${severityClass}">
      <span>${icon}</span>
      <span>${error.type || 'Grammar Error'}</span>
    </div>
    <div class="grammar-popup-message">${error.message}</div>
    <div class="grammar-popup-original">
      Found: <span>"${escapeHtml(error.matchedText)}"</span>
    </div>
    ${suggestionSection}
    <div class="grammar-popup-actions">
      <button class="grammar-popup-btn grammar-popup-btn-add-dict" data-action="ignore-word">📖 Add to Dictionary</button>
      <button class="grammar-popup-btn grammar-popup-btn-ignore" data-action="ignore">✕ Ignore</button>
    </div>
    <div class="grammar-popup-keyboard-hint">
      <span><kbd>↑↓</kbd> Navigate</span>
      <span><kbd>Enter</kbd> Apply</span>
      <span><kbd>1-9</kbd> Quick select</span>
      <span><kbd>Esc</kbd> Close</span>
    </div>
  `;
  
  // Position popup near the error - locked to field position
  popup.style.display = "block";
  popup.style.position = "absolute"; // Use absolute positioning relative to document
  
  // Get field position for anchoring
  const fieldRect = field.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  // Calculate position relative to document (not viewport)
  const popupRect = popup.getBoundingClientRect();
  let left = rect.left + scrollX;
  let top = rect.bottom + scrollY + 5;
  
  // Keep within viewport width
  if (left + popupRect.width > window.innerWidth + scrollX) {
    left = window.innerWidth + scrollX - popupRect.width - 10;
  }
  
  // If popup would go below viewport, show above the error
  if (top + popupRect.height > window.innerHeight + scrollY) {
    top = rect.top + scrollY - popupRect.height - 5;
  }
  
  popup.style.left = `${Math.max(10, left)}px`;
  popup.style.top = `${Math.max(10, top)}px`;
  
  // Store error info
  popup._currentError = error;
  popup._currentField = field;
  
  // Event handlers for suggestion clicks (use mouseup instead of click to work with preventDefault on mousedown)
  popup.querySelectorAll(".grammar-popup-suggestion[data-action='apply']").forEach(el => {
    el.addEventListener("mouseup", async (e) => {
      e.stopPropagation();
      const index = parseInt(e.currentTarget.dataset.index, 10);
      await applySuggestionByIndex(field, error, index);
    });
  });
  
  // Event handlers for action buttons
  popup.querySelectorAll(".grammar-popup-actions [data-action]").forEach(el => {
    el.addEventListener("mouseup", async (e) => {
      e.stopPropagation();
      const action = e.currentTarget.dataset.action;
      
      if (action === "ignore-word") {
        await addToIgnoreList(error.matchedText);
        hideSuggestionPopup();
        field.focus();
        analyzeField(field);
        return;
      }
      
      hideSuggestionPopup();
      field.focus();
    });
  });
  
  // Close on outside click (delayed to prevent immediate close)
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick, { once: true });
  }, 100);
  
  // Auto-hide popup after timeout (5 seconds) if user doesn't interact
  startPopupAutoHide(5000);
  
  // Reset timeout when hovering over popup (pause auto-hide)
  popup.onmouseenter = () => {
    clearPopupTimeout();
  };
  
  popup.onmouseleave = () => {
    startPopupAutoHide(3000);
  };
  
  // Hide on scroll
  const scrollHandler = () => {
    hideSuggestionPopup();
    window.removeEventListener("scroll", scrollHandler, true);
  };
  window.addEventListener("scroll", scrollHandler, { capture: true, passive: true });
  
  // Store scroll handler for cleanup
  popup._scrollHandler = scrollHandler;
}

// Apply suggestion by index
async function applySuggestionByIndex(field, error, index) {
  if (index < 0 || index >= currentSuggestions.length) return;
  
  const correction = currentSuggestions[index];
  const modifiedError = { ...error, correction };
  
  // Hide popup first
  hideSuggestionPopup();
  
  // Apply correction (this will set cursor position)
  applyCorrection(field, modifiedError);
  
  // Ensure focus stays on field for continued typing
  requestAnimationFrame(() => {
    field.focus();
  });
  
  // Record correction in stats
  try {
    await safeSendMessage({ type: "RECORD_CORRECTION" });
  } catch (e) {}
}

// Update selected suggestion visually
function updateSelectedSuggestion() {
  if (!suggestionPopup) return;
  
  const suggestions = suggestionPopup.querySelectorAll(".grammar-popup-suggestion");
  suggestions.forEach((el, i) => {
    if (i === selectedSuggestionIndex) {
      el.classList.add("selected");
      el.querySelector(".grammar-popup-hint").textContent = "Enter";
      // Scroll into view if needed
      el.scrollIntoView({ block: "nearest" });
    } else {
      el.classList.remove("selected");
      el.querySelector(".grammar-popup-hint").textContent = String(i + 1);
    }
  });
}

// Generate alternative suggestions
function generateAlternatives(text, errorType) {
  const alternatives = [];
  
  // Common Thai alternatives
  const thaiAlternatives = {
    'กะ': ['กับ'],
    'คะ': ['ค่ะ', 'ครับ'],
    'ครับ': ['ค่ะ'],
    'นะคะ': ['นะค่ะ', 'นะครับ'],
    'เปน': ['เป็น'],
    'เกิ้น': ['เกิน'],
    'มั้ย': ['ไหม'],
    'ป่าว': ['หรือเปล่า', 'ไหม'],
    'เค้า': ['เขา'],
    'ทำไหม': ['ทำไม'],
    'ยังงัย': ['อย่างไร', 'ยังไง'],
    'งัย': ['ไง', 'อย่างไร'],
  };
  
  // Common English alternatives
  const englishAlternatives = {
    'dont': ["don't", 'do not'],
    'doesnt': ["doesn't", 'does not'],
    'cant': ["can't", 'cannot'],
    'wont': ["won't", 'will not'],
    'didnt': ["didn't", 'did not'],
    'isnt': ["isn't", 'is not'],
    'arent': ["aren't", 'are not'],
    'wasnt': ["wasn't", 'was not'],
    'werent': ["weren't", 'were not'],
    'havent': ["haven't", 'have not'],
    'hasnt': ["hasn't", 'has not'],
    'hadnt': ["hadn't", 'had not'],
    'wouldnt': ["wouldn't", 'would not'],
    'couldnt': ["couldn't", 'could not'],
    'shouldnt': ["shouldn't", 'should not'],
    'its': ["it's", 'its'],
    'your': ["you're", 'your'],
    'youre': ["you're", 'your'],
    'their': ["they're", 'there', 'their'],
    'there': ["they're", 'there', 'their'],
    'theyre': ["they're", 'there', 'their'],
    'teh': ['the'],
    'taht': ['that'],
    'adn': ['and'],
    'hte': ['the'],
    'recieve': ['receive'],
    'beleive': ['believe'],
    'occured': ['occurred'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'accomodate': ['accommodate'],
  };
  
  const lowerText = text.toLowerCase();
  
  // Check Thai alternatives
  if (thaiAlternatives[text]) {
    alternatives.push(...thaiAlternatives[text]);
  }
  
  // Check English alternatives
  if (englishAlternatives[lowerText]) {
    alternatives.push(...englishAlternatives[lowerText]);
  }
  
  // Add capitalized version if starts with uppercase
  if (text[0] === text[0].toUpperCase() && text.length > 1) {
    const lower = text.toLowerCase();
    if (englishAlternatives[lower]) {
      alternatives.push(...englishAlternatives[lower].map(a => 
        a.charAt(0).toUpperCase() + a.slice(1)
      ));
    }
  }
  
  return alternatives;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-show popup when cursor is in an error position
function autoShowPopupAtCursor(field, errors) {
  if (!errors || errors.length === 0) return;
  
  // Get cursor position
  let cursorPos = 0;
  
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    cursorPos = field.selectionStart || 0;
  } else if (field.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Calculate position from start of field
      const preRange = document.createRange();
      preRange.selectNodeContents(field);
      preRange.setEnd(range.startContainer, range.startOffset);
      cursorPos = preRange.toString().length;
    }
  }
  
  // Find error at cursor position (with small tolerance for just-typed text)
  const error = errors.find(e => {
    // Check if cursor is at end of error (just finished typing the error)
    return cursorPos >= e.start && cursorPos <= e.end + 1;
  });
  
  if (error) {
    // Show popup for this error
    const rect = getErrorRect(field, error);
    showSuggestionPopup(error, rect, field);
  }
}

function hideSuggestionPopup() {
  clearPopupTimeout();
  if (suggestionPopup) {
    // Remove scroll handler
    if (suggestionPopup._scrollHandler) {
      window.removeEventListener("scroll", suggestionPopup._scrollHandler, true);
      suggestionPopup._scrollHandler = null;
    }
    // Remove outside click handler
    document.removeEventListener("click", handleOutsideClick);
    
    suggestionPopup.style.display = "none";
    suggestionPopup._currentError = null;
    suggestionPopup._currentField = null;
  }
}

function handleOutsideClick(e) {
  if (!suggestionPopup) return;
  
  // Don't close if clicking inside popup
  if (suggestionPopup.contains(e.target)) return;
  
  // Don't close if clicking inside the current field (user is still typing)
  if (suggestionPopup._currentField && suggestionPopup._currentField.contains(e.target)) {
    return;
  }
  
  hideSuggestionPopup();
}

// ============================================
// APPLY CORRECTION
// ============================================
function applyCorrection(field, error) {
  // Validate correction exists and is not empty
  if (!error.correction || typeof error.correction !== 'string') {
    warn("🔍 No valid correction available for:", error.matchedText);
    return;
  }
  
  log("🔍 Applying correction:", error.matchedText, "→", error.correction);
  
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    const text = field.value;
    const before = text.substring(0, error.start);
    const after = text.substring(error.end);
    field.value = before + error.correction + after;
    
    // Set cursor after correction - allow continued typing
    const newPos = error.start + error.correction.length;
    field.setSelectionRange(newPos, newPos);
    field.focus();
    
    // Trigger re-analysis
    field.dispatchEvent(new Event("input", { bubbles: true }));
    
  } else if (field.isContentEditable) {
    // Use execCommand for better compatibility and undo support
    const selection = window.getSelection();
    const text = field.textContent || field.innerText || "";
    
    // Find the text node and position
    const result = findTextNodeAtPosition(field, error.start, error.end);
    
    if (result && result.startNode) {
      try {
        // Create range for the error text
        const range = document.createRange();
        range.setStart(result.startNode, result.startOffset);
        range.setEnd(result.endNode || result.startNode, result.endOffset);
        
        // Select the error text
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Replace with correction using execCommand (supports undo)
        document.execCommand("insertText", false, error.correction);
        
        // Cursor is now at end of inserted text - ready for typing
        field.focus();
        
      } catch (e) {
        console.error("execCommand failed, using fallback:", e);
        // Fallback: direct text replacement
        const before = text.substring(0, error.start);
        const after = text.substring(error.end);
        field.textContent = before + error.correction + after;
        
        // Set cursor position
        setCursorInContentEditable(field, error.start + error.correction.length);
      }
    } else {
      // Fallback for complex structures
      const before = text.substring(0, error.start);
      const after = text.substring(error.end);
      field.textContent = before + error.correction + after;
      setCursorInContentEditable(field, error.start + error.correction.length);
    }
    
    // Trigger input event for frameworks
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Find text node at a given character position
function findTextNodeAtPosition(element, startPos, endPos) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let currentPos = 0;
  let startNode = null, endNode = null;
  let startOffset = 0, endOffset = 0;
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLength = node.textContent.length;
    
    // Find start node
    if (!startNode && currentPos + nodeLength > startPos) {
      startNode = node;
      startOffset = startPos - currentPos;
    }
    
    // Find end node
    if (currentPos + nodeLength >= endPos) {
      endNode = node;
      endOffset = endPos - currentPos;
      break;
    }
    
    currentPos += nodeLength;
  }
  
  return startNode ? { startNode, startOffset, endNode, endOffset } : null;
}

// Set cursor position in contentEditable
function setCursorInContentEditable(element, position) {
  const selection = window.getSelection();
  const result = findTextNodeAtPosition(element, position, position);
  
  if (result && result.startNode) {
    try {
      const range = document.createRange();
      range.setStart(result.startNode, result.startOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      element.focus();
    } catch (e) {
      // Just focus the element
      element.focus();
    }
  } else {
    element.focus();
  }
}

// ============================================
// AUTO-CORRECT
// ============================================
function autoCorrectErrors(field, errors) {
  if (!currentSettings?.autoCorrect || errors.length === 0) return;
  
  // Only auto-correct high-confidence errors
  const autoCorrectErrors = errors.filter(e => 
    e.severity === "error" && 
    e.correction && 
    e.type !== "style" && 
    e.type !== "info"
  );
  
  if (autoCorrectErrors.length === 0) return;
  
  // Apply from end to start to preserve positions
  const sorted = [...autoCorrectErrors].sort((a, b) => b.start - a.start);
  
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    let text = field.value;
    const originalLength = text.length;
    
    for (const error of sorted) {
      // Validate positions are within bounds
      if (error.start < 0 || error.end > text.length || error.start >= error.end) {
        warn("🔍 Invalid error position:", error);
        continue;
      }
      text = text.substring(0, error.start) + error.correction + text.substring(error.end);
    }
    
    // Preserve cursor position if possible
    const cursorPos = field.selectionStart;
    field.value = text;
    
    // Try to restore cursor near original position
    if (cursorPos !== null && cursorPos !== undefined) {
      const newPos = Math.min(cursorPos, text.length);
      field.setSelectionRange(newPos, newPos);
    }
  } else if (field.isContentEditable) {
    let text = field.textContent || "";
    
    for (const error of sorted) {
      // Validate positions
      if (error.start < 0 || error.end > text.length || error.start >= error.end) {
        console.warn("🔍 Invalid error position:", error);
        continue;
      }
      text = text.substring(0, error.start) + error.correction + text.substring(error.end);
    }
    field.textContent = text;
  }
}

// ============================================
// IGNORE LIST
// ============================================
async function addToIgnoreList(word) {
  try {
    await chrome.runtime.sendMessage({
      type: "ADD_TO_IGNORE_LIST",
      payload: { word }
    });
  } catch (e) {
    console.error("Failed to add to ignore list:", e);
  }
}

// ============================================
// ERROR DISPLAY
// ============================================
function displayErrors(field, errors) {
  // Save cursor position FIRST before any DOM changes
  let savedCursor = null;
  let hadFocus = document.activeElement === field;
  
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    savedCursor = {
      start: field.selectionStart,
      end: field.selectionEnd
    };
  } else if (field.isContentEditable && hadFocus) {
    savedCursor = saveCursorPosition(field);
  }
  
  // Clear previous (but don't change cursor)
  clearErrors(field);
  
  if (errors.length === 0) {
    // Restore cursor even when no errors
    if (hadFocus && savedCursor) {
      restoreCursor(field, savedCursor);
    }
    return;
  }
  
  // Store errors on field
  field._grammarErrors = errors;
  
  // For textarea/input - try to create highlight overlay (optional - don't break if fails)
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    try {
      // Check if we can safely wrap this field
      const parent = field.parentElement;
      let wrapper = parent;
      
      // Only create wrapper if parent is simple and not already wrapped
      if (parent && !parent.classList.contains("grammar-wrapper")) {
        // Skip wrapping for complex layouts that might break
        const parentStyle = window.getComputedStyle(parent);
        const canWrap = parentStyle.display !== "flex" && 
                        parentStyle.display !== "grid" &&
                        parent.tagName !== "FORM" &&
                        parent.tagName !== "TABLE" &&
                        parent.tagName !== "TR" &&
                        parent.tagName !== "TD";
        
        if (canWrap) {
          wrapper = document.createElement("div");
          wrapper.className = "grammar-wrapper";
          wrapper.style.cssText = `
            position: relative;
            display: inline-block;
            width: ${field.offsetWidth}px;
            min-height: ${field.offsetHeight}px;
          `;
          parent.insertBefore(wrapper, field);
          wrapper.appendChild(field);
        }
      }
      
      // Only create overlay if we have a proper wrapper
      if (wrapper.classList.contains("grammar-wrapper")) {
        createHighlightOverlay(field, wrapper, errors);
      }
    } catch (e) {
      warn("🔍 Grammar Checker: Could not create highlight overlay", e);
    }
  }
  
  // For contenteditable - add inline highlights
  if (field.isContentEditable) {
    highlightContentEditable(field, errors, savedCursor);
  }
  
  // Restore cursor position for textarea/input
  if (hadFocus && savedCursor && (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)) {
    requestAnimationFrame(() => {
      try {
        field.setSelectionRange(savedCursor.start, savedCursor.end);
        field.focus();
      } catch (e) {}
    });
  }
  
  console.log(`🔍 Grammar Checker: Displaying ${errors.length} errors`);
}

// Save cursor position in contentEditable
function saveCursorPosition(element) {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    
    // Calculate character offset from start
    const preRange = document.createRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    
    preRange.setEnd(range.endContainer, range.endOffset);
    const end = preRange.toString().length;
    
    return { start, end };
  } catch (e) {
    // Range might be invalid if DOM changed
    console.warn('🔍 Could not save cursor position:', e.message);
    return null;
  }
}

// Restore cursor position
function restoreCursor(field, cursor) {
  if (!cursor || !field) return;
  
  try {
    if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
      requestAnimationFrame(() => {
        try {
          const maxPos = field.value?.length || 0;
          const start = Math.min(cursor.start, maxPos);
          const end = Math.min(cursor.end, maxPos);
          field.setSelectionRange(start, end);
          field.focus();
        } catch (e) {}
      });
    } else if (field.isContentEditable) {
      requestAnimationFrame(() => {
        setCursorInContentEditable(field, cursor.start);
      });
    }
  } catch (e) {
    console.warn('🔍 Could not restore cursor:', e.message);
  }
}

// Create highlight overlay for textarea/input
function createHighlightOverlay(field, wrapper, errors) {
  // Remove existing overlay
  const existingOverlay = wrapper.querySelector(".grammar-highlight-container");
  if (existingOverlay) existingOverlay.remove();
  
  // Remember original background so we can restore later
  if (!field.dataset.grammarOriginalBg) {
    const bg = window.getComputedStyle(field).backgroundColor;
    field.dataset.grammarOriginalBg = bg;
  }
  if (!field.dataset.grammarOriginalPosition) {
    field.dataset.grammarOriginalPosition = field.style.position || "";
  }
  if (!field.dataset.grammarOriginalZ) {
    field.dataset.grammarOriginalZ = field.style.zIndex || "";
  }
  
  // Create container
  const container = document.createElement("div");
  container.className = "grammar-highlight-container";
  
  // Create backdrop with same styling as input
  const backdrop = document.createElement("div");
  backdrop.className = "grammar-highlight-backdrop";
  
  // Copy styles from field
  const fieldStyle = window.getComputedStyle(field);
  backdrop.style.cssText = `
    font-family: ${fieldStyle.fontFamily};
    font-size: ${fieldStyle.fontSize};
    font-weight: ${fieldStyle.fontWeight};
    line-height: ${fieldStyle.lineHeight};
    letter-spacing: ${fieldStyle.letterSpacing};
    padding: ${fieldStyle.padding};
    border: ${fieldStyle.borderWidth} solid transparent;
    text-align: ${fieldStyle.textAlign};
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
  `;
  
  // Build highlighted text
  const text = field.value || "";
  const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
  
  let html = "";
  let lastEnd = 0;
  
  for (const error of sortedErrors) {
    // Validate error bounds
    if (error.start < 0 || error.end > text.length || error.start >= error.end) {
      console.warn('🔍 Invalid error bounds:', error);
      continue;
    }
    
    // Add text before error
    html += escapeHtml(text.substring(lastEnd, error.start));
    
    // Add highlighted error
    const severityClass = error.severity === "warning" ? "warning" : error.severity === "info" ? "info" : "";
    const errorText = text.substring(error.start, error.end);
    html += `<mark class="grammar-highlight-mark ${severityClass}" data-start="${error.start}" data-end="${error.end}">${escapeHtml(errorText)}</mark>`;
    
    lastEnd = error.end;
  }
  
  // Add remaining text
  html += escapeHtml(text.substring(lastEnd));
  
  backdrop.innerHTML = html;
  container.appendChild(backdrop);
  
  // Insert before field
  wrapper.insertBefore(container, field);
  
  // Make field background transparent so highlight shows through
  field.style.background = "transparent";
  field.style.position = "relative";
  field.style.zIndex = "1";
  
  // Sync scroll position with debounce for better performance
  let scrollTimeout = null;
  const syncScroll = () => {
    if (scrollTimeout) return; // Skip if already scheduled
    
    scrollTimeout = setTimeout(() => {
      backdrop.scrollTop = field.scrollTop;
      backdrop.scrollLeft = field.scrollLeft;
      scrollTimeout = null;
    }, 16); // ~60fps
  };
  field.addEventListener("scroll", syncScroll, { passive: true });
  field._grammarScrollSync = syncScroll;
  
  // Add click handlers to highlights
  backdrop.querySelectorAll(".grammar-highlight-mark").forEach(mark => {
    mark.addEventListener("click", (e) => {
      e.stopPropagation();
      const start = parseInt(mark.dataset.start);
      const end = parseInt(mark.dataset.end);
      const error = errors.find(err => err.start === start && err.end === end);
      if (error) {
        const rect = mark.getBoundingClientRect();
        showSuggestionPopup(error, rect, field);
      }
    });
  });
  
  // Click handler for field
  if (field._grammarClickHandler) {
    field.removeEventListener("click", field._grammarClickHandler);
  }
  
  field._grammarClickHandler = () => {
    const currentErrors = field._grammarErrors || [];
    const pos = field.selectionStart;
    const error = currentErrors.find(e => pos >= e.start && pos <= e.end);
    if (error) {
      const rect = field.getBoundingClientRect();
      showSuggestionPopup(error, rect, field);
    }
  };
  field.addEventListener("click", field._grammarClickHandler);
}

function highlightContentEditable(field, errors, savedCursor) {
  if (!field || !field.isContentEditable) return;
  
  const text = field.textContent || "";
  
  // Skip if no actual changes needed
  if (errors.length === 0) return;
  
  // Sort by position ascending (for proper building)
  const sorted = [...errors].sort((a, b) => a.start - b.start);
  
  // Build HTML piece by piece (to handle escaping correctly)
  let html = "";
  let lastEnd = 0;
  
  for (const error of sorted) {
    const idx = errors.indexOf(error);
    const cls = error.severity === "warning" ? "grammar-error grammar-error-warning" : "grammar-error";
    
    // Add escaped text before error
    html += escapeHtml(text.substring(lastEnd, error.start));
    
    // Add error span with escaped match text
    const matchText = text.substring(error.start, error.end);
    html += `<span class="${cls}" data-idx="${idx}">${escapeHtml(matchText)}</span>`;
    
    lastEnd = error.end;
  }
  
  // Add remaining text (escaped)
  html += escapeHtml(text.substring(lastEnd));
  
  // Only update DOM if different
  if (field.innerHTML !== html) {
    field.innerHTML = html;
  }
  
  // Add click handlers
  field.querySelectorAll(".grammar-error").forEach(span => {
    span.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(span.dataset.idx);
      const error = errors[idx];
      if (error) {
        showSuggestionPopup(error, span.getBoundingClientRect(), field);
      }
    };
  });
  
  // Restore cursor position after DOM update
  if (savedCursor) {
    requestAnimationFrame(() => {
      setCursorInContentEditable(field, savedCursor.start);
    });
  }
}

function clearErrors(field) {
  field._grammarErrors = [];
  
  const wrapper = field.parentElement;
  if (wrapper?.classList.contains("grammar-wrapper")) {
    const badge = wrapper.querySelector(".grammar-error-badge");
    if (badge) {
      badge._currentErrorIdx = 0;
      badge.remove();
    }
    
    // Remove highlight overlay
    const overlay = wrapper.querySelector(".grammar-highlight-container");
    if (overlay) overlay.remove();
  }
  
  // Remove scroll sync handler
  if (field._grammarScrollSync) {
    field.removeEventListener("scroll", field._grammarScrollSync);
    delete field._grammarScrollSync;
  }
  
  // Remove click handler
  if (field._grammarClickHandler) {
    field.removeEventListener("click", field._grammarClickHandler);
    delete field._grammarClickHandler;
  }
  
  // Restore background if we changed it for overlay
  if (field.dataset?.grammarOriginalBg) {
    field.style.background = field.dataset.grammarOriginalBg;
    delete field.dataset.grammarOriginalBg;
  }
  if (field.dataset?.grammarOriginalPosition) {
    field.style.position = field.dataset.grammarOriginalPosition;
    delete field.dataset.grammarOriginalPosition;
  }
  if (field.dataset?.grammarOriginalZ) {
    field.style.zIndex = field.dataset.grammarOriginalZ;
    delete field.dataset.grammarOriginalZ;
  }
  
  // Note: Don't reset text - let displayErrors handle content; prevents cursor jumping
  
  // For contenteditable - only remove error spans, keep text
  if (field.isContentEditable) {
    field.querySelectorAll(".grammar-error").forEach(span => {
      const text = span.textContent;
      span.replaceWith(document.createTextNode(text));
    });
    // Normalize to merge adjacent text nodes
    field.normalize();
  }
}

// Get approximate position of error in field for popup positioning
function getErrorRect(field, error) {
  const baseRect = field.getBoundingClientRect();
  
  // For contenteditable, try to find the error span
  if (field.isContentEditable) {
    const errorSpan = field.querySelector(`[data-idx="${field._grammarErrors?.indexOf(error)}"]`);
    if (errorSpan) {
      return errorSpan.getBoundingClientRect();
    }
  }
  
  // For textarea/input, calculate approximate position
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    // Create a temporary element to measure text position
    const measureDiv = document.createElement('div');
    const computedStyle = window.getComputedStyle(field);
    
    // Copy relevant styles
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font: ${computedStyle.font};
      padding: ${computedStyle.padding};
      width: ${field.clientWidth}px;
      line-height: ${computedStyle.lineHeight};
    `;
    
    const text = field.value || '';
    const beforeError = text.substring(0, error.start);
    
    measureDiv.textContent = beforeError;
    document.body.appendChild(measureDiv);
    
    const measureRect = measureDiv.getBoundingClientRect();
    document.body.removeChild(measureDiv);
    
    // Calculate lines
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;
    const lines = Math.floor(measureRect.height / lineHeight);
    
    return {
      left: baseRect.left + (measureRect.width % field.clientWidth),
      right: baseRect.left + (measureRect.width % field.clientWidth) + 50,
      top: baseRect.top + (lines * lineHeight) - field.scrollTop,
      bottom: baseRect.top + ((lines + 1) * lineHeight) - field.scrollTop,
      width: 50,
      height: lineHeight
    };
  }
  
  return baseRect;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
let shortcutsHint = null;

function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    const popupVisible = suggestionPopup?.style.display !== "none" && suggestionPopup?._currentError;
    
    // Handle popup navigation when popup is visible
    if (popupVisible) {
      // Arrow Up - move selection up
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentSuggestions.length > 0) {
          selectedSuggestionIndex = (selectedSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
          updateSelectedSuggestion();
        }
        return;
      }
      
      // Arrow Down - move selection down
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentSuggestions.length > 0) {
          selectedSuggestionIndex = (selectedSuggestionIndex + 1) % currentSuggestions.length;
          updateSelectedSuggestion();
        }
        return;
      }
      
      // Enter - apply selected suggestion
      if (e.key === "Enter") {
        e.preventDefault();
        if (currentSuggestions.length > 0) {
          applySuggestionByIndex(suggestionPopup._currentField, suggestionPopup._currentError, selectedSuggestionIndex);
        }
        return;
      }
      
      // Tab - apply selected suggestion (alternative)
      if (e.key === "Tab") {
        e.preventDefault();
        if (currentSuggestions.length > 0) {
          applySuggestionByIndex(suggestionPopup._currentField, suggestionPopup._currentError, selectedSuggestionIndex);
        }
        return;
      }
      
      // Number keys 1-9 - quick select suggestion
      if (e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key, 10) - 1;
        if (index < currentSuggestions.length) {
          e.preventDefault();
          applySuggestionByIndex(suggestionPopup._currentField, suggestionPopup._currentError, index);
        }
        return;
      }
      
      // Escape to close popup
      if (e.key === "Escape") {
        e.preventDefault();
        hideSuggestionPopup();
        return;
      }
    }
    
    // Escape to close popup or shortcuts hint
    if (e.key === "Escape") {
      hideSuggestionPopup();
      hideShortcutsHint();
    }
    
    // Ctrl+. or Cmd+. to show suggestions at cursor
    if ((e.ctrlKey || e.metaKey) && e.key === ".") {
      e.preventDefault();
      showSuggestionsAtCursor();
      return;
    }
    
    // Ctrl+Shift+G to show all errors in field
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "G") {
      e.preventDefault();
      showAllErrors();
      return;
    }
    
    // Ctrl+/ to show shortcuts help
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      toggleShortcutsHint();
      return;
    }
    
    // Alt+Enter to auto-correct all errors
    if (e.altKey && e.key === "Enter" && activeField) {
      e.preventDefault();
      const errors = activeField._grammarErrors || [];
      if (errors.length > 0) {
        autoCorrectErrors(activeField, errors);
        analyzeField(activeField);
      }
      return;
    }
  });
}

function showSuggestionsAtCursor() {
  if (!activeField) return;
  
  const errors = activeField._grammarErrors || [];
  if (errors.length === 0) {
    return;
  }
  
  // Find error at cursor position
  let pos = 0;
  if (activeField instanceof HTMLTextAreaElement || activeField instanceof HTMLInputElement) {
    pos = activeField.selectionStart;
  }
  
  const errorAtCursor = errors.find(e => pos >= e.start && pos <= e.end);
  const errorToShow = errorAtCursor || errors[0];
  
  const rect = activeField.getBoundingClientRect();
  showSuggestionPopup(errorToShow, rect, activeField);
}

function showAllErrors() {
  if (!activeField) return;
  
  const errors = activeField._grammarErrors || [];
  if (errors.length === 0) {
    return;
  }
  
  const messages = errors.map((e, i) => `${i + 1}. "${e.matchedText}" → ${e.correction || '(no suggestion)'}`).join('\n');
  // Errors displayed in popup
}

function toggleShortcutsHint() {
  if (shortcutsHint) {
    hideShortcutsHint();
  } else {
    showShortcutsHint();
  }
}

function showShortcutsHint() {
  if (shortcutsHint) return;
  
  shortcutsHint = document.createElement("div");
  shortcutsHint.className = "grammar-shortcuts-hint";
  shortcutsHint.innerHTML = `
    <strong>⌨️ Keyboard Shortcuts</strong><br>
    <kbd>Ctrl</kbd>+<kbd>.</kbd> Show suggestion<br>
    <kbd>Tab</kbd> Apply suggestion<br>
    <kbd>Esc</kbd> Close popup<br>
    <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd> Show all errors<br>
    <kbd>Alt</kbd>+<kbd>Enter</kbd> Auto-fix all<br>
    <kbd>Ctrl</kbd>+<kbd>/</kbd> Toggle this help
  `;
  document.body.appendChild(shortcutsHint);
  
  // Store timeout ID for cleanup
  shortcutsHint._hideTimeout = setTimeout(hideShortcutsHint, 5000);
}

function hideShortcutsHint() {
  if (shortcutsHint) {
    // Clear pending timeout
    if (shortcutsHint._hideTimeout) {
      clearTimeout(shortcutsHint._hideTimeout);
      delete shortcutsHint._hideTimeout;
    }
    shortcutsHint.remove();
    shortcutsHint = null;
  }
}

// ============================================
// TEXT ANALYSIS
// ============================================
let isAutoCorrectingRef = false; // Prevent infinite loop
const MAX_TEXT_LENGTH = 10000; // Max characters to analyze at once

async function analyzeField(field) {
  // Quick exit if disabled or invalid
  if (!siteEnabled) return;
  if (!extensionValid) {
    cleanup();
    return;
  }
  
  // Double-check extension validity before making API call
  if (!isExtensionValid()) {
    extensionValid = false;
    cleanup();
    return;
  }
  
  let text = field.value || field.textContent || "";
  
  if (text.trim().length < 3) {
    clearErrors(field);
    return;
  }
  
  log(`🔍 Grammar Checker: Analyzing ${text.length} characters...`);
  
  // Show loading indicator
  showLoadingIndicator(field);

  try {
    let allErrors = [];
    
    // For very long text, split into chunks
    if (text.length > MAX_TEXT_LENGTH) {
      console.log(`🔍 Grammar Checker: Text too long (${text.length}), splitting into chunks...`);
      const chunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH);
      
      let offset = 0;
      for (const chunk of chunks) {
        const response = await safeSendMessage({
          type: "ANALYZE_TEXT",
          payload: { text: chunk }
        });
        
        if (!response) {
          hideLoadingIndicator(field);
          return; // Extension invalidated
        }
        
        if (response?.success && response.result?.errors) {
          // Adjust error positions based on offset
          const adjustedErrors = response.result.errors.map(e => ({
            ...e,
            start: e.start + offset,
            end: e.end + offset
          }));
          allErrors.push(...adjustedErrors);
        }
        
        offset += chunk.length;
      }
    } else {
      const response = await safeSendMessage({
        type: "ANALYZE_TEXT",
        payload: { text }
      });
      
      if (!response) {
        hideLoadingIndicator(field);
        return; // Extension invalidated
      }
      
      if (response?.success && response.result) {
        allErrors = response.result.errors || [];
      }
    }
    
    // Hide loading indicator
    hideLoadingIndicator(field);
    
    console.log(`🔍 Grammar Checker: Found ${allErrors.length} errors`);
    
    // Auto-correct if enabled (with loop prevention)
    if (currentSettings?.autoCorrect && allErrors.length > 0 && !isAutoCorrectingRef) {
      isAutoCorrectingRef = true;
      autoCorrectErrors(field, allErrors);
      // Re-analyze after auto-correct with delay
      setTimeout(() => {
        if (!extensionValid) return;
        isAutoCorrectingRef = false;
        analyzeField(field);
      }, 500);
      return;
    }
    
    displayErrors(field, allErrors);
    
    // Auto-show popup if cursor is in an error position
    autoShowPopupAtCursor(field, allErrors);
  } catch (e) {
    hideLoadingIndicator(field);
    isAutoCorrectingRef = false; // Reset flag on error
    // All extension errors are now handled by safeSendMessage
    // This catch is only for other unexpected errors
    if (!extensionValid) return; // Already handled
    console.error("🔍 Grammar Checker: Unexpected error", e);
  }
}

// Show loading indicator on field
function showLoadingIndicator(field) {
  // Remove existing indicators
  hideLoadingIndicator(field);
  
  // Get or find wrapper (don't create if not needed for loading)
  let wrapper = field.parentElement;
  if (wrapper?.classList.contains("grammar-wrapper")) {
    const loader = document.createElement("div");
    loader.className = "grammar-loading";
    wrapper.appendChild(loader);
  }
  // If no wrapper, skip loading indicator (will show when errors found)
}

// Hide loading indicator
function hideLoadingIndicator(field) {
  const wrapper = field.parentElement;
  if (wrapper?.classList.contains("grammar-wrapper")) {
    const loader = wrapper.querySelector(".grammar-loading");
    if (loader) loader.remove();
  }
}

// Show success indicator briefly
function showSuccessIndicator(field) {
  const wrapper = field.parentElement;
  if (!wrapper?.classList.contains("grammar-wrapper")) return;
  
  const badge = document.createElement("div");
  badge.className = "grammar-success-badge";
  badge.textContent = "✓";
  wrapper.appendChild(badge);
  
  setTimeout(() => badge.remove(), 2000);
}

// Split text into chunks while preserving word boundaries
function splitTextIntoChunks(text, maxLength) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);
    
    // Try to break at sentence or word boundary
    if (end < text.length) {
      // Look for sentence break (. ! ? newline)
      const sentenceBreak = text.lastIndexOf('.', end);
      const exclamBreak = text.lastIndexOf('!', end);
      const questionBreak = text.lastIndexOf('?', end);
      const newlineBreak = text.lastIndexOf('\n', end);
      
      const breakPoint = Math.max(sentenceBreak, exclamBreak, questionBreak, newlineBreak);
      
      if (breakPoint > start + maxLength / 2) {
        end = breakPoint + 1;
      } else {
        // Fall back to word break
        const spaceBreak = text.lastIndexOf(' ', end);
        if (spaceBreak > start + maxLength / 2) {
          end = spaceBreak + 1;
        }
      }
    }
    
    chunks.push(text.substring(start, end));
    start = end;
  }
  
  return chunks;
}

// ============================================
// INPUT MONITOR
// ============================================
class InputMonitor {
  constructor(debounceDelay = 800) { // Increased to 800ms for smoother typing
    this.debounceDelay = debounceDelay;
    this.timers = new Map();
    this.observed = new Set();
    this.lastText = new Map(); // Track last analyzed text to skip duplicates
  }

  observe(field) {
    if (this.observed.has(field)) return;
    this.observed.add(field);
    
    const handler = () => {
      // Stop if extension is invalidated
      if (!extensionValid) {
        this.disconnect();
        return;
      }
      
      activeField = field;
      
      // Cancel pending analysis
      if (this.timers.has(field)) {
        clearTimeout(this.timers.get(field));
      }
      
      // Get current text
      const currentText = field.value || field.textContent || "";
      
      // Skip if text is too short to analyze
      if (currentText.trim().length < 3) {
        clearErrors(field);
        this.timers.delete(field);
        return;
      }
      
      this.timers.set(field, setTimeout(() => {
        // Double check extension validity
        if (!extensionValid) {
          this.disconnect();
          return;
        }
        
        // Check if text actually changed since last analysis
        const lastText = this.lastText.get(field);
        if (lastText === currentText) {
          this.timers.delete(field);
          return; // Skip analysis - no change
        }
        
        this.lastText.set(field, currentText);
        analyzeField(field);
        this.timers.delete(field);
      }, this.debounceDelay));
    };
    
    // Handler for paste - analyze with short delay
    const pasteHandler = () => {
      // Stop if extension is invalidated
      if (!extensionValid) {
        this.disconnect();
        return;
      }
      
      activeField = field;
      
      if (this.timers.has(field)) {
        clearTimeout(this.timers.get(field));
      }
      
      // Short delay for paste to complete
      this.timers.set(field, setTimeout(() => {
        if (!extensionValid) return;
        
        const currentText = field.value || field.textContent || "";
        this.lastText.set(field, currentText);
        console.log("🔍 Grammar Checker: Analyzing pasted text...");
        analyzeField(field);
        this.timers.delete(field);
      }, 200));
    };
    
    field.addEventListener("input", handler);
    field.addEventListener("paste", pasteHandler);
    field.addEventListener("focus", () => { activeField = field; });
    field._grammarInputHandler = handler;
    field._grammarPasteHandler = pasteHandler;
  }

  disconnect() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.lastText.clear();
    
    // Remove event listeners from observed fields
    for (const field of this.observed) {
      if (field._grammarInputHandler) {
        field.removeEventListener("input", field._grammarInputHandler);
        delete field._grammarInputHandler;
      }
      if (field._grammarPasteHandler) {
        field.removeEventListener("paste", field._grammarPasteHandler);
        delete field._grammarPasteHandler;
      }
      // Clear error display
      clearErrors(field);
    }
    this.observed.clear();
  }
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = "info") {
  const existing = document.querySelector(".grammar-toast");
  if (existing) existing.remove();
  
  const toast = document.createElement("div");
  toast.className = "grammar-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1a1a1a;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    z-index: 2147483647;
    animation: grammarSlideIn 0.2s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ============================================
// INIT
// ============================================
async function initialize() {
  log("🔍 Grammar Checker: Initializing...");
  
  // Check extension validity first
  if (!isExtensionValid()) {
    log("🔍 Grammar Checker: Extension context not available");
    return;
  }
  
  injectStyles();
  createSuggestionPopup();
  setupKeyboard();
  
  // Check if site is enabled
  try {
    const siteResponse = await safeSendMessage({
      type: "CHECK_SITE_ENABLED",
      payload: { url: window.location.href }
    });
    if (!siteResponse) return; // Extension invalidated
    siteEnabled = siteResponse?.enabled !== false;
  } catch (e) {
    siteEnabled = true;
  }
  
  if (!siteEnabled) {
    console.log("🔍 Grammar Checker: Disabled on this site");
    return;
  }
  
  // Get settings
  try {
    const response = await safeSendMessage({ type: "GET_SETTINGS" });
    if (!response) return; // Extension invalidated
    currentSettings = response?.settings || { enabled: true, debounceDelay: 300, autoCorrect: false };
  } catch (e) {
    currentSettings = { enabled: true, debounceDelay: 300, autoCorrect: false };
  }
  
  if (!currentSettings.enabled) {
    console.log("🔍 Grammar Checker: Disabled");
    return;
  }
  
  inputMonitor = new InputMonitor(currentSettings.debounceDelay);
  
  // Observe fields
  const observe = (el) => inputMonitor.observe(el);
  document.querySelectorAll("textarea").forEach(observe);
  document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])').forEach(observe);
  document.querySelectorAll('[contenteditable="true"]').forEach(observe);
  
  // Special handling for ChatGPT, Claude, and other AI chat interfaces
  findAndObserveSpecialEditors(observe);
  
  // Watch for new fields
  new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.("textarea, input, [contenteditable]")) observe(node);
        node.querySelectorAll?.("textarea, input, [contenteditable]").forEach(observe);
        
        // Check for special editors in new nodes
        findAndObserveSpecialEditors(observe, node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  
  console.log("🔍 Grammar Checker: Ready! Press Ctrl+/ for shortcuts");
  // Grammar Checker ready
}

// Special editor selectors for popular sites
function findAndObserveSpecialEditors(observe, root = document) {
  const specialSelectors = [
    // ChatGPT
    '#prompt-textarea',
    '[data-id="root"] [contenteditable]',
    'div[contenteditable="true"][data-placeholder]',
    '.ProseMirror[contenteditable="true"]',
    // Claude
    '[contenteditable="true"].ProseMirror',
    'div[enterkeyhint="enter"][contenteditable]',
    // Google Docs
    '.docs-texteventtarget-iframe',
    // Notion
    '.notion-page-content [contenteditable]',
    // Slack
    '.ql-editor[contenteditable]',
    // Discord
    '[data-slate-editor="true"]',
    // Generic rich text editors
    '.tox-edit-area [contenteditable]',
    '.ck-editor__editable[contenteditable]',
    '.jodit-wysiwyg[contenteditable]',
    '[role="textbox"][contenteditable]',
    '[aria-label*="message"][contenteditable]',
    '[aria-label*="Message"][contenteditable]',
    '[placeholder][contenteditable]'
  ];
  
  for (const selector of specialSelectors) {
    try {
      root.querySelectorAll?.(selector).forEach(el => {
        if (el && (el.isContentEditable || el.tagName === 'TEXTAREA')) {
          observe(el);
        }
      });
      // Also check root itself
      if (root !== document && root.matches?.(selector)) {
        if (root.isContentEditable || root.tagName === 'TEXTAREA') {
          observe(root);
        }
      }
    } catch (e) {
      // Ignore invalid selectors
    }
  }
}

// Message listener
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!extensionValid) return;
    
    if (msg.type === "SETTINGS_UPDATED") {
      currentSettings = msg.settings;
    }
    
    // Handle context menu analysis result
    if (msg.type === "CONTEXT_MENU_ANALYSIS" && msg.payload) {
      showContextMenuResult(msg.payload);
    }
    
    return true;
  });
} catch (e) {
  console.log("🔍 Grammar Checker: Could not add message listener");
}

// Show context menu analysis result as a popup
function showContextMenuResult(result) {
  const { errors } = result;
  
  if (errors.length === 0) {
    // No errors in selection
    return;
  }
  
  // Create a floating result panel
  const panel = document.createElement("div");
  panel.className = "grammar-context-result";
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    padding: 0;
    z-index: 2147483647;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    font-family: system-ui, sans-serif;
  `;
  
  panel.innerHTML = `
    <div style="background: #f44336; color: white; padding: 16px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
      <span>🔍 Found ${errors.length} Error${errors.length > 1 ? 's' : ''}</span>
      <button id="grammar-close-panel" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 8px;">×</button>
    </div>
    <div style="max-height: 400px; overflow-y: auto; padding: 16px;">
      ${errors.map((e, i) => `
        <div style="margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid ${e.severity === 'error' ? '#f44336' : e.severity === 'warning' ? '#ff9800' : '#2196f3'};">
          <div style="font-weight: 600; margin-bottom: 4px;">${e.type}</div>
          <div style="color: #666; margin-bottom: 8px;">${e.message}</div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="text-decoration: line-through; color: #c62828;">${escapeHtml(e.matchedText)}</span>
            ${e.correction ? `<span>→</span><span style="color: #2e7d32; font-weight: 600;">${escapeHtml(e.correction)}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="padding: 12px 16px; background: #f5f5f5; border-top: 1px solid #eee; text-align: right;">
      <button id="grammar-copy-corrections" style="background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 8px;">📋 Copy Corrections</button>
      <button id="grammar-close-panel-btn" style="background: #e0e0e0; color: #333; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Close handlers
  panel.querySelector("#grammar-close-panel").onclick = () => panel.remove();
  panel.querySelector("#grammar-close-panel-btn").onclick = () => panel.remove();
  
  // Copy corrections
  panel.querySelector("#grammar-copy-corrections").onclick = () => {
    const corrections = errors
      .filter(e => e.correction)
      .map(e => `${e.matchedText} → ${e.correction}`)
      .join('\n');
    navigator.clipboard.writeText(corrections);
    // Corrections copied
  };
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener("click", function closePanel(e) {
      if (!panel.contains(e.target)) {
        panel.remove();
        document.removeEventListener("click", closePanel);
      }
    });
  }, 100);
}

// Start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
