// Grammar Engine interface
// Provides high-level API for grammar checking using Web Worker
//
// LOCAL PROCESSING GUARANTEE:
// All operations are performed locally without external API calls.
// - Wasm module is loaded from bundled extension resources
// - Dictionaries are loaded from IndexedDB (hydrated from bundle)
// - Grammar rules are loaded from bundled JSON files
// - No HTTP requests to external servers
// - No AI/ML API calls

import type {
  AnalysisResult,
  GrammarError,
  Correction,
  Language,
} from "./types";

/**
 * Message types for worker communication
 */
interface WorkerMessage {
  type:
    | "ANALYZE"
    | "LOAD_DICTIONARY"
    | "LOAD_RULES"
    | "UNLOAD_DICTIONARY"
    | "GET_STATUS";
  payload?: any;
  id?: string;
}

interface WorkerResponse {
  type:
    | "ANALYSIS_RESULT"
    | "DICTIONARY_LOADED"
    | "RULES_LOADED"
    | "STATUS"
    | "ERROR";
  payload?: any;
  id?: string;
  error?: string;
}

/**
 * Grammar Engine class
 * Manages Web Worker and provides grammar checking API
 */
export class GrammarEngine {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();

  /**
   * Initialize the Grammar Engine
   * Creates and sets up the Web Worker
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      return;
    }

    try {
      // Create Web Worker
      this.worker = new Worker(new URL("../worker/index.ts", import.meta.url), {
        type: "module",
      });

      // Set up message handler
      this.worker.addEventListener(
        "message",
        this.handleWorkerMessage.bind(this),
      );

      // Set up error handler
      this.worker.addEventListener("error", (error) => {
        console.error("Web Worker error:", error);
        // Reject all pending requests
        for (const [id, { reject }] of this.pendingRequests) {
          reject(new Error(`Worker error: ${error.message}`));
        }
        this.pendingRequests.clear();
      });

      console.log("Grammar Engine initialized");
    } catch (error) {
      console.error("Failed to initialize Grammar Engine:", error);
      throw error;
    }
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    const { id } = response;

    if (!id) {
      console.warn("Received worker message without ID:", response);
      return;
    }

    const pending = this.pendingRequests.get(id);
    if (!pending) {
      console.warn("Received response for unknown request ID:", id);
      return;
    }

    this.pendingRequests.delete(id);

    if (response.type === "ERROR") {
      pending.reject(new Error(response.error || "Unknown worker error"));
    } else {
      pending.resolve(response.payload);
    }
  }

  /**
   * Send a message to the Web Worker and wait for response
   */
  private async sendMessage(
    type: WorkerMessage["type"],
    payload?: any,
  ): Promise<any> {
    if (!this.worker) {
      throw new Error("Grammar Engine not initialized");
    }

    const id = `msg_${++this.messageId}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message: WorkerMessage = { type, payload, id };
      this.worker!.postMessage(message);

      // Set timeout for request (5 seconds)
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${type}`));
        }
      }, 5000);
    });
  }

  /**
   * Analyze text for grammar errors
   * Main entry point for grammar checking
   *
   * @param text - The text to analyze
   * @returns Promise resolving to analysis result with errors and corrections
   */
  async analyze(text: string): Promise<AnalysisResult> {
    if (!text || text.trim().length === 0) {
      return {
        errors: [],
        corrections: [],
        segments: [],
        processingTime: 0,
      };
    }

    const startTime = performance.now();

    try {
      const result = await this.sendMessage("ANALYZE", { text });

      // Add performance monitoring
      const totalTime = performance.now() - startTime;
      console.log(`Grammar analysis completed in ${totalTime.toFixed(2)}ms`);

      return result;
    } catch (error) {
      console.error("Error during grammar analysis:", error);
      throw error;
    }
  }

  /**
   * Detect all grammar errors in the text
   * Returns all matching errors based on loaded rules
   *
   * @param text - The text to check
   * @returns Promise resolving to array of grammar errors
   */
  async detectErrors(text: string): Promise<GrammarError[]> {
    const result = await this.analyze(text);
    return result.errors;
  }

  /**
   * Generate corrections for detected errors
   * Each error will have at least one correction suggestion
   *
   * @param text - The text to check
   * @returns Promise resolving to array of corrections
   */
  async generateCorrections(text: string): Promise<Correction[]> {
    const result = await this.analyze(text);
    return result.corrections;
  }

  /**
   * Get a specific correction for an error
   *
   * @param error - The grammar error
   * @param text - The original text
   * @returns Correction object
   */
  getCorrectionForError(error: GrammarError, text: string): Correction {
    const original = text.substring(error.start, error.end);

    // For now, return a basic correction
    // The actual correction logic is in the Wasm module
    return {
      error,
      original,
      corrected: original, // Will be replaced by actual correction from rules
      confidence: 0.9,
    };
  }

  /**
   * Load a dictionary for a specific language
   *
   * @param language - The language to load
   */
  async loadDictionary(language: Language): Promise<void> {
    await this.sendMessage("LOAD_DICTIONARY", { language });
  }

  /**
   * Load grammar rules for a specific language
   *
   * @param language - The language to load rules for
   */
  async loadGrammarRules(language: Language): Promise<void> {
    await this.sendMessage("LOAD_RULES", { language });
  }

  /**
   * Unload a dictionary to free memory
   *
   * @param language - The language to unload
   */
  async unloadDictionary(language: Language): Promise<void> {
    await this.sendMessage("UNLOAD_DICTIONARY", { language });
  }

  /**
   * Get the current status of the Grammar Engine
   *
   * @returns Status information including loaded dictionaries and memory usage
   */
  async getStatus(): Promise<{
    initialized: boolean;
    loadedDictionaries: Language[];
    loadedRules: Language[];
    memoryUsage: number;
  }> {
    return await this.sendMessage("GET_STATUS");
  }

  /**
   * Terminate the Web Worker and clean up resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
      console.log("Grammar Engine terminated");
    }
  }
}

/**
 * Singleton instance of Grammar Engine
 */
let grammarEngineInstance: GrammarEngine | null = null;

/**
 * Get the singleton Grammar Engine instance
 * Creates and initializes the instance if it doesn't exist
 */
export async function getGrammarEngine(): Promise<GrammarEngine> {
  if (!grammarEngineInstance) {
    grammarEngineInstance = new GrammarEngine();
    await grammarEngineInstance.initialize();
  }
  return grammarEngineInstance;
}

/**
 * Terminate the Grammar Engine singleton
 */
export function terminateGrammarEngine(): void {
  if (grammarEngineInstance) {
    grammarEngineInstance.terminate();
    grammarEngineInstance = null;
  }
}
