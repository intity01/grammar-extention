// Offscreen document for clipboard operations
let autoCloseTimer = null;

function scheduleAutoClose() {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
  }
  autoCloseTimer = setTimeout(() => {
    window.close();
  }, 30000); // 30 seconds
}

function sanitizeText(text) {
  if (typeof text !== "string") {
    return "";
  }
  
  // Remove script tags
  let sanitized = text.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  
  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  return sanitized.trim();
}

async function writeToClipboard(text) {
  const sanitized = sanitizeText(text);
  
  if (!sanitized) {
    throw new Error("No valid text to copy");
  }
  
  await navigator.clipboard.writeText(sanitized);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "WRITE_TO_CLIPBOARD") {
    sendResponse({ success: false, error: "Unknown message type" });
    return false;
  }
  
  writeToClipboard(message.text)
    .then(() => {
      sendResponse({ success: true });
      scheduleAutoClose();
    })
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: errorMessage });
      scheduleAutoClose();
    });
  
  return true; // Keep message channel open for async response
});
