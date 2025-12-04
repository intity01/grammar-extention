/**
 * Performance Monitoring
 * Tracks and reports performance metrics
 */

import { logMessage } from "./errorMonitoring";

interface PerformanceMetrics {
  analysisCount: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  slowAnalysisCount: number; // > 50ms
  recentTimes: number[]; // Last 10
}

const metrics: PerformanceMetrics = {
  analysisCount: 0,
  totalTime: 0,
  maxTime: 0,
  minTime: Infinity,
  slowAnalysisCount: 0,
  recentTimes: [],
};

const PERFORMANCE_TARGET_MS = 50;
const REPORT_INTERVAL = 100; // Report every 100 analyses

/**
 * Record an analysis performance measurement
 */
export function recordAnalysisTime(timeMs: number, textLength: number): void {
  metrics.analysisCount++;
  metrics.totalTime += timeMs;
  metrics.maxTime = Math.max(metrics.maxTime, timeMs);
  metrics.minTime = Math.min(metrics.minTime, timeMs);

  // Track recent times
  metrics.recentTimes.push(timeMs);
  if (metrics.recentTimes.length > 10) {
    metrics.recentTimes.shift();
  }

  // Count slow analyses
  if (timeMs > PERFORMANCE_TARGET_MS) {
    metrics.slowAnalysisCount++;

    // Log warning for very slow analyses
    if (timeMs > PERFORMANCE_TARGET_MS * 2) {
      logMessage(
        `Slow grammar analysis detected: ${timeMs.toFixed(2)}ms`,
        "warning",
        {
          timeMs,
          textLength,
          target: PERFORMANCE_TARGET_MS,
        },
      );
    }
  }

  // Periodic reporting
  if (metrics.analysisCount % REPORT_INTERVAL === 0) {
    reportMetrics();
  }
}

/**
 * Get current performance metrics
 */
export function getMetrics(): PerformanceMetrics & {
  avgTime: number;
  recentAvg: number;
  slowPercentage: number;
} {
  const avgTime =
    metrics.analysisCount > 0 ? metrics.totalTime / metrics.analysisCount : 0;

  const recentAvg =
    metrics.recentTimes.length > 0
      ? metrics.recentTimes.reduce((a, b) => a + b, 0) /
        metrics.recentTimes.length
      : 0;

  const slowPercentage =
    metrics.analysisCount > 0
      ? (metrics.slowAnalysisCount / metrics.analysisCount) * 100
      : 0;

  return {
    ...metrics,
    avgTime,
    recentAvg,
    slowPercentage,
  };
}

/**
 * Report metrics to monitoring service
 */
function reportMetrics(): void {
  const stats = getMetrics();

  logMessage("Performance metrics report", "info", {
    analysisCount: stats.analysisCount,
    avgTime: stats.avgTime.toFixed(2),
    recentAvg: stats.recentAvg.toFixed(2),
    maxTime: stats.maxTime.toFixed(2),
    minTime: stats.minTime === Infinity ? 0 : stats.minTime.toFixed(2),
    slowPercentage: stats.slowPercentage.toFixed(1),
    target: PERFORMANCE_TARGET_MS,
  });
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics(): void {
  metrics.analysisCount = 0;
  metrics.totalTime = 0;
  metrics.maxTime = 0;
  metrics.minTime = Infinity;
  metrics.slowAnalysisCount = 0;
  metrics.recentTimes = [];
}
