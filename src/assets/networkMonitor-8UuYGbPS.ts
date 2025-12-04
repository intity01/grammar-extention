// Network Monitor
// Ensures all operations are performed locally without external API calls

/**
 * List of allowed URL patterns for local resources
 * Only chrome-extension:// URLs are allowed
 */
const ALLOWED_URL_PATTERNS = [/^chrome-extension:\/\//, /^blob:/, /^data:/];

/**
 * Check if a URL is allowed (local resource)
 */
function isAllowedUrl(url: string): boolean {
  return ALLOWED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Monitor for network requests
 * This is a development/testing utility to ensure no external calls are made
 */
export class NetworkMonitor {
  private static originalFetch: typeof fetch;
  private static originalXHR: typeof XMLHttpRequest;
  private static isMonitoring = false;
  private static violations: string[] = [];

  /**
   * Start monitoring network requests
   */
  static startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.violations = [];
    this.isMonitoring = true;

    // Store original fetch
    this.originalFetch = globalThis.fetch;

    // Override fetch
    globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (!isAllowedUrl(url)) {
        const violation = `Blocked external fetch request: ${url}`;
        console.error(violation);
        this.violations.push(violation);
        throw new Error(`Network request blocked: ${url}`);
      }

      return this.originalFetch(input, init);
    };

    // Store original XMLHttpRequest
    this.originalXHR = globalThis.XMLHttpRequest;

    // Override XMLHttpRequest
    const violations = this.violations;
    globalThis.XMLHttpRequest = class extends this.originalXHR {
      open(method: string, url: string | URL, ...args: any[]): void {
        const urlString = typeof url === "string" ? url : url.href;

        if (!isAllowedUrl(urlString)) {
          const violation = `Blocked external XHR request: ${urlString}`;
          console.error(violation);
          violations.push(violation);
          throw new Error(`Network request blocked: ${urlString}`);
        }

        return super.open(method, url, ...args);
      }
    } as any;

    console.log("Network monitoring started");
  }

  /**
   * Stop monitoring network requests
   */
  static stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    // Restore original fetch
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
    }

    // Restore original XMLHttpRequest
    if (this.originalXHR) {
      globalThis.XMLHttpRequest = this.originalXHR;
    }

    this.isMonitoring = false;
    console.log("Network monitoring stopped");
  }

  /**
   * Get list of network violations
   */
  static getViolations(): string[] {
    return [...this.violations];
  }

  /**
   * Check if there were any violations
   */
  static hasViolations(): boolean {
    return this.violations.length > 0;
  }

  /**
   * Clear violations list
   */
  static clearViolations(): void {
    this.violations = [];
  }
}

/**
 * Verify that all grammar checking operations are local
 * This function can be called during testing to ensure no external calls
 */
export async function verifyLocalProcessing(
  operation: () => Promise<any>,
): Promise<{ success: boolean; violations: string[] }> {
  NetworkMonitor.startMonitoring();
  NetworkMonitor.clearViolations();

  try {
    await operation();
    const violations = NetworkMonitor.getViolations();
    return {
      success: violations.length === 0,
      violations,
    };
  } finally {
    NetworkMonitor.stopMonitoring();
  }
}

/**
 * Assert that no network calls are made during an operation
 * Throws an error if any external network requests are detected
 */
export async function assertNoNetworkCalls(
  operation: () => Promise<any>,
): Promise<void> {
  const result = await verifyLocalProcessing(operation);

  if (!result.success) {
    throw new Error(
      `Network violations detected:\n${result.violations.join("\n")}`,
    );
  }
}
