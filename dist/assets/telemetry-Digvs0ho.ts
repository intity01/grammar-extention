/**
 * Telemetry and Analytics Module
 * Collects performance and usage metrics for monitoring
 * All data is stored locally and never sent to external servers
 */

export interface PerformanceMetric {
  timestamp: number;
  operation: string;
  duration: number;
  textLength?: number;
  errorCount?: number;
  language?: string;
}

export interface UsageMetric {
  timestamp: number;
  event: string;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  timestamp: number;
  error: string;
  context: string;
  stack?: string;
}

// In-memory storage for metrics (last 100 of each type)
const performanceMetrics: PerformanceMetric[] = [];
const usageMetrics: UsageMetric[] = [];
const errorMetrics: ErrorMetric[] = [];

const MAX_METRICS_PER_TYPE = 100;

/**
 * Record a performance metric
 */
export function recordPerformance(
  operation: string,
  duration: number,
  metadata?: {
    textLength?: number;
    errorCount?: number;
    language?: string;
  },
): void {
  const metric: PerformanceMetric = {
    timestamp: Date.now(),
    operation,
    duration,
    ...metadata,
  };

  performanceMetrics.push(metric);

  // Keep only last MAX_METRICS_PER_TYPE entries
  if (performanceMetrics.length > MAX_METRICS_PER_TYPE) {
    performanceMetrics.shift();
  }

  // Log slow operations in development
  if (process.env.NODE_ENV === "development" && duration > 100) {
    console.warn(
      `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`,
      metadata,
    );
  }
}

/**
 * Record a usage event
 */
export function recordUsage(
  event: string,
  metadata?: Record<string, any>,
): void {
  const metric: UsageMetric = {
    timestamp: Date.now(),
    event,
    metadata,
  };

  usageMetrics.push(metric);

  if (usageMetrics.length > MAX_METRICS_PER_TYPE) {
    usageMetrics.shift();
  }
}

/**
 * Record an error
 */
export function recordError(error: Error, context: string): void {
  const metric: ErrorMetric = {
    timestamp: Date.now(),
    error: error.message,
    context,
    stack: error.stack,
  };

  errorMetrics.push(metric);

  if (errorMetrics.length > MAX_METRICS_PER_TYPE) {
    errorMetrics.shift();
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(operation?: string): {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
} {
  const filtered = operation
    ? performanceMetrics.filter((m) => m.operation === operation)
    : performanceMetrics;

  if (filtered.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  }

  const durations = filtered.map((m) => m.duration).sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);

  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  return {
    count: filtered.length,
    avgDuration: sum / filtered.length,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p95Duration: durations[p95Index] || 0,
    p99Duration: durations[p99Index] || 0,
  };
}

/**
 * Get usage statistics
 */
export function getUsageStats(event?: string): {
  count: number;
  firstSeen: number;
  lastSeen: number;
} {
  const filtered = event
    ? usageMetrics.filter((m) => m.event === event)
    : usageMetrics;

  if (filtered.length === 0) {
    return {
      count: 0,
      firstSeen: 0,
      lastSeen: 0,
    };
  }

  const timestamps = filtered.map((m) => m.timestamp);

  return {
    count: filtered.length,
    firstSeen: Math.min(...timestamps),
    lastSeen: Math.max(...timestamps),
  };
}

/**
 * Get error statistics
 */
export function getErrorStats(context?: string): {
  count: number;
  uniqueErrors: number;
  mostCommonError: string | null;
  errorFrequency: Record<string, number>;
} {
  const filtered = context
    ? errorMetrics.filter((m) => m.context === context)
    : errorMetrics;

  if (filtered.length === 0) {
    return {
      count: 0,
      uniqueErrors: 0,
      mostCommonError: null,
      errorFrequency: {},
    };
  }

  const errorFrequency: Record<string, number> = {};
  filtered.forEach((m) => {
    errorFrequency[m.error] = (errorFrequency[m.error] || 0) + 1;
  });

  const mostCommon = Object.entries(errorFrequency).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return {
    count: filtered.length,
    uniqueErrors: Object.keys(errorFrequency).length,
    mostCommonError: mostCommon ? mostCommon[0] : null,
    errorFrequency,
  };
}

/**
 * Get all metrics for export/debugging
 */
export function getAllMetrics(): {
  performance: PerformanceMetric[];
  usage: UsageMetric[];
  errors: ErrorMetric[];
} {
  return {
    performance: [...performanceMetrics],
    usage: [...usageMetrics],
    errors: [...errorMetrics],
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  performanceMetrics.length = 0;
  usageMetrics.length = 0;
  errorMetrics.length = 0;
}

/**
 * Export metrics as JSON string
 */
export function exportMetrics(): string {
  return JSON.stringify(getAllMetrics(), null, 2);
}

/**
 * Get health status based on metrics
 */
export function getHealthStatus(): {
  status: "healthy" | "degraded" | "unhealthy";
  issues: string[];
  metrics: {
    avgAnalysisTime: number;
    errorRate: number;
    slowOperations: number;
  };
} {
  const issues: string[] = [];
  const analysisStats = getPerformanceStats("analyze");
  const errorStats = getErrorStats();

  // Check average analysis time
  const avgAnalysisTime = analysisStats.avgDuration;
  if (avgAnalysisTime > 100) {
    issues.push(`High average analysis time: ${avgAnalysisTime.toFixed(2)}ms`);
  }

  // Check error rate
  const totalOperations = performanceMetrics.length;
  const errorRate =
    totalOperations > 0 ? errorMetrics.length / totalOperations : 0;
  if (errorRate > 0.05) {
    issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  // Check for slow operations
  const slowOperations = performanceMetrics.filter(
    (m) => m.duration > 100,
  ).length;
  if (slowOperations > totalOperations * 0.1) {
    issues.push(
      `Many slow operations: ${slowOperations} out of ${totalOperations}`,
    );
  }

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (issues.length > 0) {
    status = issues.length > 2 ? "unhealthy" : "degraded";
  }

  return {
    status,
    issues,
    metrics: {
      avgAnalysisTime,
      errorRate,
      slowOperations,
    },
  };
}

/**
 * Log health status to console (for debugging)
 */
export function logHealthStatus(): void {
  const health = getHealthStatus();
  const perfStats = getPerformanceStats("analyze");
  const errorStats = getErrorStats();

  console.log("=== Grammar Checker Health Status ===");
  console.log(`Status: ${health.status.toUpperCase()}`);
  console.log(`\nPerformance Metrics:`);
  console.log(
    `  - Average analysis time: ${perfStats.avgDuration.toFixed(2)}ms`,
  );
  console.log(`  - P95 analysis time: ${perfStats.p95Duration.toFixed(2)}ms`);
  console.log(`  - P99 analysis time: ${perfStats.p99Duration.toFixed(2)}ms`);
  console.log(`  - Total analyses: ${perfStats.count}`);
  console.log(`\nError Metrics:`);
  console.log(`  - Total errors: ${errorStats.count}`);
  console.log(`  - Unique errors: ${errorStats.uniqueErrors}`);
  console.log(`  - Most common: ${errorStats.mostCommonError || "None"}`);

  if (health.issues.length > 0) {
    console.log(`\nIssues:`);
    health.issues.forEach((issue) => console.log(`  - ${issue}`));
  }

  console.log("=====================================");
}
