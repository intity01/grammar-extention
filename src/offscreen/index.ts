// Offscreen Document for Clipboard Access
// Implements Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

import type { OffscreenMessage, OffscreenResponse } from '../lib/types';

console.log('Grammar Checker: Offscreen Document initialized');

// Auto-cleanup timeout (30 seconds)
let cleanupTimeout: NodeJS.Timeout | null = null;

/**
 * Sanitize text to prevent XSS attacks
 * Requirement 8.4: Text sanitization before clipboard write
 */
function sanitizeText(text: string): string {
  // First, remove script tags and their content
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove any event handlers (e.g., onclick="...")
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  return sanitized.trim();
}

/**
 * Write text to clipboard using navigator.clipboard API
 * Requirement 8.1: Use Offscreen Document for clipboard access
 * Requirement 8.6: No user gesture required
 */
async function writeToClipboard(text: string): Promise<void> {
  // Sanitize text before writing
  const sanitizedText = sanitizeText(text);
  
  try {
    await navigator.clipboard.writeText(sanitizedText);
    console.log('Grammar Checker: Text written to clipboard successfully');
  } catch (error) {
    console.error('Grammar Checker: Failed to write to clipboard:', error);
    throw error;
  }
}

/**
 * Show notification to user
 * Requirement 8.5: Display notifications for success/failure
 */
function showNotification(message: string, type: 'success' | 'error'): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: 'Grammar Checker',
    message: message,
    priority: type === 'error' ? 2 : 1,
  });
}

/**
 * Schedule auto-cleanup of Offscreen Document
 * Requirement 8.3: Close within 30 seconds to free resources
 */
function scheduleCleanup(): void {
  // Clear any existing timeout
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
  }
  
  // Schedule cleanup after 30 seconds
  cleanupTimeout = setTimeout(() => {
    console.log('Grammar Checker: Auto-closing Offscreen Document after 30 seconds');
    window.close();
  }, 30000);
}

/**
 * Handle messages from Service Worker
 * Requirement 8.1: Message listener for WRITE_TO_CLIPBOARD
 */
chrome.runtime.onMessage.addListener(
  (
    message: OffscreenMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: OffscreenResponse) => void
  ) => {
    console.log('Offscreen received message:', message.type);

    if (message.type === 'WRITE_TO_CLIPBOARD') {
      // Handle clipboard write asynchronously
      writeToClipboard(message.text)
        .then(() => {
          // Show success notification
          showNotification('Corrected text copied to clipboard', 'success');
          
          // Send success response
          sendResponse({ success: true });
          
          // Schedule auto-cleanup
          scheduleCleanup();
        })
        .catch((error) => {
          // Show error notification
          showNotification(
            'Failed to copy to clipboard: ' + (error as Error).message,
            'error'
          );
          
          // Send error response
          sendResponse({
            success: false,
            error: (error as Error).message,
          });
          
          // Still schedule cleanup even on error
          scheduleCleanup();
        });

      // Return true to indicate async response
      return true;
    }

    // Unknown message type
    sendResponse({ success: false, error: 'Unknown message type' });
    return false;
  }
);
