/**
 * Telemetry Helper Functions
 * Provides easy access to telemetry data from browser console
 */

/**
 * Get telemetry metrics from background service worker
 * Usage in console: await getTelemetry()
 */
export async function getTelemetry(): Promise<any> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_TELEMETRY",
    });

    if (response && response.success) {
      return {
        metrics: response.metrics,
        health: response.health,
      };
    }

    throw new Error("Failed to get telemetry");
  } catch (error) {
    console.error("Error getting telemetry:", error);
    throw error;
  }
}

/**
 * Clear all telemetry metrics
 * Usage in console: await clearTelemetry()
 */
export async function clearTelemetry(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "CLEAR_TELEMETRY",
    });

    if (response && response.success) {
      console.log("Telemetry cleared successfully");
    } else {
      throw new Error("Failed to clear telemetry");
    }
  } catch (error) {
    console.error("Error clearing telemetry:", error);
    throw error;
  }
}

/**
 * Display telemetry summary in console
 * Usage in console: await showTelemetrySummary()
 */
export async function showTelemetrySummary(): Promise<void> {
  try {
    const data = await getTelemetry();
    const { metrics, health } = data;

    console.log("=== Grammar Checker Telemetry Summary ===");
    console.log(`\nHealth Status: ${health.status.toUpperCase()}`);

    if (health.issues.length > 0) {
      console.log("\nIssues:");
      health.issues.forEach((issue: string) => console.log(`  - ${issue}`));
    }

    console.log("\nMetrics:");
    console.log(
      `  - Average Analysis Time: ${health.metrics.avgAnalysisTime.toFixed(2)}ms`,
    );
    console.log(
      `  - Error Rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`,
    );
    console.log(`  - Slow Operations: ${health.metrics.slowOperations}`);

    console.log("\nPerformance Metrics:");
    console.log(`  - Total: ${metrics.performance.length}`);
    if (metrics.performance.length > 0) {
      const durations = metrics.performance.map((m: any) => m.duration);
      const avg =
        durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      console.log(`  - Average: ${avg.toFixed(2)}ms`);
      console.log(`  - Min: ${min.toFixed(2)}ms`);
      console.log(`  - Max: ${max.toFixed(2)}ms`);
    }

    console.log("\nUsage Metrics:");
    console.log(`  - Total Events: ${metrics.usage.length}`);
    if (metrics.usage.length > 0) {
      const eventCounts: Record<string, number> = {};
      metrics.usage.forEach((m: any) => {
        eventCounts[m.event] = (eventCounts[m.event] || 0) + 1;
      });
      Object.entries(eventCounts).forEach(([event, count]) => {
        console.log(`  - ${event}: ${count}`);
      });
    }

    console.log("\nError Metrics:");
    console.log(`  - Total Errors: ${metrics.errors.length}`);
    if (metrics.errors.length > 0) {
      const errorCounts: Record<string, number> = {};
      metrics.errors.forEach((m: any) => {
        errorCounts[m.error] = (errorCounts[m.error] || 0) + 1;
      });
      const topErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      console.log("  - Top Errors:");
      topErrors.forEach(([error, count]) => {
        console.log(`    - ${error}: ${count}`);
      });
    }

    console.log("\n=========================================");
  } catch (error) {
    console.error("Error showing telemetry summary:", error);
  }
}

/**
 * Export telemetry data as JSON
 * Usage in console: await exportTelemetry()
 */
export async function exportTelemetry(): Promise<string> {
  try {
    const data = await getTelemetry();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error exporting telemetry:", error);
    throw error;
  }
}

// Make functions available globally for console access
if (typeof window !== "undefined") {
  (window as any).grammarCheckerTelemetry = {
    getTelemetry,
    clearTelemetry,
    showTelemetrySummary,
    exportTelemetry,
  };

  console.log("Grammar Checker Telemetry helpers loaded. Available commands:");
  console.log("  - await grammarCheckerTelemetry.showTelemetrySummary()");
  console.log("  - await grammarCheckerTelemetry.getTelemetry()");
  console.log("  - await grammarCheckerTelemetry.clearTelemetry()");
  console.log("  - await grammarCheckerTelemetry.exportTelemetry()");
}
