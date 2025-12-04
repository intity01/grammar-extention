// Background Service Worker (Manifest V3 Ephemeral)
// Implements Requirements 4.3, 1.1, 2.2, 2.3, 5.1, 5.4, 6.6, 8.1, 8.2, 8.3

import type { Language, AnalysisResult } from "../lib/types";
import {
  getSettings,
  updateSettings,
  getDefaultSettings,
} from "../lib/settings";
import {
  loadGrammarRules,
  compileGrammarRules,
  type CompiledGrammarRule,
} from "../lib/grammarRules";
import { hydrateDictionaries } from "../lib/dictionaryStorage";

console.log("Grammar Checker: Background Service Worker initialized");

// ============================================================================
// State Management (Ephemeral - will be lost when Service Worker terminates)
// ============================================================================

let worker: Worker | null = null;
let workerMessageId = 0;
const workerCallbacks = new Map<
  string,
  { resolve: (value: any) => void; reject: (error: any) => void }
>();

// Keep-Alive connections from Content Scripts
const keepAliveConnections = new Map<number, chrome.runtime.Port>();

// Offscreen Document state
let offscreenDocumentCreating: Promise<void> | null = null;
let offscreenDocumentExists = false;

// Grammar rules cache (per language)
const grammarRulesCache = new Map<Language, CompiledGrammarRule[]>();

// ============================================================================
// Lifecycle Handlers
// ============================================================================

/**
 * Handle extension installation and updates
 * Requirement 4.3: Implement onInstalled handler (dictionary hydration)
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed:", details.reason);

  try {
    if (details.reason === "install") {
      // First-time installation
      console.log("First-time installation detected");

      // Initialize default settings
      const defaultSettings = getDefaultSettings();
      await updateSettings(defaultSettings);
      console.log("Default settings initialized:", defaultSettings);

      // Hydrate dictionaries from bundled files to IndexedDB
      console.log("Starting dictionary hydration...");
      await hydrateDictionaries();
      console.log("Dictionary hydration completed");

      // Create context menus
      await createContextMenus();
      console.log("Context menus created");
    } else if (details.reason === "update") {
      // Extension update
      const previousVersion = details.previousVersion || "unknown";
      console.log(
        `Extension updated from version ${previousVersion} to ${chrome.runtime.getManifest().version}`,
      );

      // Handle any migration logic here if needed
      // For now, just ensure context menus are up to date
      await createContextMenus();

      // Optionally re-hydrate dictionaries if format changed
      // await hydrateDictionaries();
    }
  } catch (error) {
    console.error("Error during onInstalled handler:", error);
  }
});

/**
 * Handle browser startup
 * Requirement 4.3: Implement onStartup handler
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started, extension activated");

  try {
    // Recreate context menus
    await createContextMenus();
    console.log("Context menus recreated on startup");

    // Preload settings to warm up the cache
    await getSettings();
    console.log("Settings preloaded");
  } catch (error) {
    console.error("Error during onStartup handler:", error);
  }
});

/**
 * Handle Service Worker activation
 * This is called when the Service Worker starts (including after being terminated)
 */
self.addEventListener("activate", (event: any) => {
  console.log("Service Worker activated");
  // Claim all clients immediately
  event.waitUntil((self as any).clients.claim());
});

// ============================================================================
// Context Menu Management
// ============================================================================

/**
 * Create context menu items for grammar checking
 * Requirement 4.3: Context menu for grammar checking
 */
async function createContextMenus(): Promise<void> {
  try {
    // Remove all existing context menus first
    await chrome.contextMenus.removeAll();

    // Create main context menu item
    chrome.contextMenus.create({
      id: "grammar-check-selection",
      title: "Check Grammar",
      contexts: ["selection"],
    });

    console.log("Context menus created successfully");
  } catch (error) {
    console.error("Error creating context menus:", error);
  }
}

/**
 * Handle context menu clicks
 * Requirement 4.3: Handle context menu clicks and trigger analysis
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "grammar-check-selection" && info.selectionText) {
    console.log("Context menu clicked, analyzing selected text");

    try {
      // Analyze the selected text
      const result = await analyzeTextViaWorker(info.selectionText);

      // Send result to content script in the active tab
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "CONTEXT_MENU_ANALYSIS",
          payload: result,
        });
      }
    } catch (error) {
      console.error("Error analyzing context menu selection:", error);
    }
  }
});

// ============================================================================
// Web Worker Management
// ============================================================================

/**
 * Get or create Web Worker instance
 * Requirement 6.6: Create or reuse Web Worker instance
 */
function getOrCreateWorker(): Worker {
  if (!worker) {
    console.log("Creating new Web Worker instance");
    worker = new Worker(new URL("../worker/index.ts", import.meta.url), {
      type: "module",
    });

    // Set up message handler
    worker.onmessage = (event) => {
      const { id, type, payload, error } = event.data;

      if (id && workerCallbacks.has(id)) {
        const { resolve, reject } = workerCallbacks.get(id)!;
        workerCallbacks.delete(id);

        if (type === "ERROR" || error) {
          reject(new Error(error || "Worker error"));
        } else {
          resolve(payload);
        }
      }
    };

    // Handle worker errors
    worker.onerror = (error) => {
      console.error("Web Worker error:", error);
      // Restart worker on crash
      terminateWorker();
      worker = null;
    };
  }

  return worker;
}

/**
 * Send message to Web Worker and wait for response
 */
function sendToWorker(type: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = `msg_${++workerMessageId}`;
    const worker = getOrCreateWorker();

    // Store callback
    workerCallbacks.set(id, { resolve, reject });

    // Set timeout for worker response (5 seconds)
    setTimeout(() => {
      if (workerCallbacks.has(id)) {
        workerCallbacks.delete(id);
        reject(new Error("Worker timeout"));
      }
    }, 5000);

    // Send message
    worker.postMessage({ type, payload, id });
  });
}

/**
 * Terminate Web Worker
 * Requirement 6.6: Handle worker termination on idle
 */
function terminateWorker(): void {
  if (worker) {
    console.log("Terminating Web Worker");
    worker.terminate();
    worker = null;
    workerCallbacks.clear();
  }
}

/**
 * Analyze text via Web Worker
 */
async function analyzeTextViaWorker(text: string): Promise<AnalysisResult> {
  try {
    const result = await sendToWorker("ANALYZE", { text });
    return result;
  } catch (error) {
    console.error("Error analyzing text via worker:", error);

    // Attempt recovery: restart worker and retry once
    console.log("Attempting to recover by restarting worker...");
    terminateWorker();

    try {
      const result = await sendToWorker("ANALYZE", { text });
      console.log("Recovery successful");
      return result;
    } catch (retryError) {
      console.error("Recovery failed:", retryError);
      throw retryError;
    }
  }
}

// ============================================================================
// Offscreen Document Management
// ============================================================================

/**
 * Check if Offscreen Document exists
 */
async function hasOffscreenDocument(): Promise<boolean> {
  if ("getContexts" in chrome.runtime) {
    const contexts = await (chrome.runtime as any).getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    return contexts.length > 0;
  }
  return offscreenDocumentExists;
}

/**
 * Create Offscreen Document for clipboard access
 * Requirement 8.1, 8.2: Create Offscreen Document with reason 'CLIPBOARD'
 */
async function createOffscreenDocument(): Promise<void> {
  // Check if already exists
  if (await hasOffscreenDocument()) {
    console.log("Offscreen Document already exists");
    offscreenDocumentExists = true;
    return;
  }

  // Check if already creating
  if (offscreenDocumentCreating) {
    await offscreenDocumentCreating;
    return;
  }

  // Create new Offscreen Document
  offscreenDocumentCreating = chrome.offscreen
    .createDocument({
      url: chrome.runtime.getURL("offscreen.html"),
      reasons: ["CLIPBOARD" as any],
      justification: "Write corrected text to clipboard without user gesture",
    })
    .then(() => {
      console.log("Offscreen Document created");
      offscreenDocumentExists = true;
      offscreenDocumentCreating = null;
    })
    .catch((error) => {
      console.error("Failed to create Offscreen Document:", error);
      offscreenDocumentCreating = null;
      throw error;
    });

  await offscreenDocumentCreating;
}

/**
 * Close Offscreen Document
 * Requirement 8.3: Close Offscreen Document after use
 */
async function closeOffscreenDocument(): Promise<void> {
  if (!(await hasOffscreenDocument())) {
    console.log("No Offscreen Document to close");
    return;
  }

  try {
    await chrome.offscreen.closeDocument();
    console.log("Offscreen Document closed");
    offscreenDocumentExists = false;
  } catch (error) {
    console.error("Failed to close Offscreen Document:", error);
  }
}

/**
 * Send message to Offscreen Document
 */
async function sendToOffscreen(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Write text to clipboard via Offscreen Document
 * Requirement 8.1, 8.2, 8.3: Manage Offscreen Document lifecycle
 */
async function writeToClipboard(text: string): Promise<void> {
  try {
    // Create Offscreen Document if needed
    await createOffscreenDocument();

    // Send message to write to clipboard
    const response = await sendToOffscreen({
      type: "WRITE_TO_CLIPBOARD",
      text,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to write to clipboard");
    }

    console.log("Text written to clipboard successfully");

    // Schedule cleanup after 30 seconds
    setTimeout(async () => {
      await closeOffscreenDocument();
    }, 30000);
  } catch (error) {
    console.error("Error writing to clipboard:", error);
    throw error;
  }
}

// ============================================================================
// Grammar Rules Management
// ============================================================================

/**
 * Load and cache grammar rules for a language
 * Requirement 5.1, 5.4: Load grammar rules from JSON files
 */
async function loadAndCacheGrammarRules(
  language: Language,
): Promise<CompiledGrammarRule[]> {
  // Check cache first
  if (grammarRulesCache.has(language)) {
    console.log(`Grammar rules for ${language} loaded from cache`);
    return grammarRulesCache.get(language)!;
  }

  try {
    // Load rules from JSON file
    const rules = await loadGrammarRules(language);

    // Compile regex patterns
    const compiledRules = compileGrammarRules(rules);

    // Cache the compiled rules
    grammarRulesCache.set(language, compiledRules);

    console.log(
      `Grammar rules loaded and cached for ${language}: ${compiledRules.length} rules`,
    );

    return compiledRules;
  } catch (error) {
    console.error(`Failed to load grammar rules for ${language}:`, error);
    return [];
  }
}

/**
 * Get grammar rules for a language (with caching)
 */
async function getGrammarRules(
  language: Language,
): Promise<CompiledGrammarRule[]> {
  return loadAndCacheGrammarRules(language);
}

// ============================================================================
// Keep-Alive Strategy
// ============================================================================

/**
 * Handle Port connections from Content Scripts
 * Requirement 4.3: Keep-Alive strategy to prevent Service Worker termination
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keep-alive") {
    const tabId = port.sender?.tab?.id;

    if (tabId) {
      console.log(`Keep-Alive connection established from tab ${tabId}`);
      keepAliveConnections.set(tabId, port);

      // Handle disconnection
      port.onDisconnect.addListener(() => {
        console.log(`Keep-Alive connection closed for tab ${tabId}`);
        keepAliveConnections.delete(tabId);
      });

      // Send acknowledgment
      port.postMessage({ type: "KEEP_ALIVE_ACK" });
    }
  }
});

/**
 * Clean up connections for closed tabs
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (keepAliveConnections.has(tabId)) {
    console.log(`Tab ${tabId} closed, cleaning up Keep-Alive connection`);
    keepAliveConnections.delete(tabId);
  }
});

// ============================================================================
// Message Routing
// ============================================================================

/**
 * Handle messages from Content Scripts
 * Requirement 1.1: Route analysis requests to Web Worker
 * Requirement 2.2, 2.3: Provide settings to content scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Background received message:", message.type);

  // Handle async messages
  (async () => {
    try {
      switch (message.type) {
        case "ANALYZE_TEXT": {
          // Route to Web Worker
          const result = await analyzeTextViaWorker(message.payload.text);
          sendResponse({ success: true, result });
          break;
        }

        case "GET_SETTINGS": {
          // Get settings from storage
          const settings = await getSettings();
          sendResponse({ success: true, settings });
          break;
        }

        case "UPDATE_SETTINGS": {
          // Update settings in storage
          const updatedSettings = await updateSettings(message.payload);
          sendResponse({ success: true, settings: updatedSettings });
          break;
        }

        case "APPLY_CORRECTION": {
          // Handle correction application based on mode
          const settings = await getSettings();

          if (settings.correctionMode === "clipboard") {
            // Write to clipboard via Offscreen Document
            await writeToClipboard(message.payload.correctedText);
            sendResponse({ success: true, mode: "clipboard" });
          } else {
            // Inline mode - content script handles it
            sendResponse({ success: true, mode: "inline" });
          }
          break;
        }

        case "GET_GRAMMAR_RULES": {
          // Get grammar rules for a language
          const { language } = message.payload;
          const rules = await getGrammarRules(language);
          sendResponse({ success: true, rules });
          break;
        }

        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  // Return true to indicate async response
  return true;
});

console.log("Background Service Worker fully initialized");
