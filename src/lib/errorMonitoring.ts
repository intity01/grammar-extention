/**
 * Error Monitoring and Logging
 * Integrates with Sentry for production error tracking
 */

import * as Sentry from '@sentry/browser';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize error monitoring
 * Only active in production to avoid noise during development
 */
export function initializeErrorMonitoring(): void {
  if (!isProduction) {
    console.log('Error monitoring: Development mode - Sentry disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || '', // Set via environment variable
      environment: process.env.NODE_ENV || 'production',
      
      // Release tracking
      release: `grammar-checker@${chrome.runtime.getManifest().version}`,
      
      // Sample rate for performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Filter out noise
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors
        'NetworkError',
        'Failed to fetch',
      ],
      
      // Add context
      beforeSend(event, hint) {
        // Add extension-specific context
        event.contexts = {
          ...event.contexts,
          extension: {
            version: chrome.runtime.getManifest().version,
            id: chrome.runtime.id,
          },
        };
        
        return event;
      },
    });

    console.log('Error monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize error monitoring:', error);
  }
}

/**
 * Log an error to monitoring service
 */
export function logError(error: Error, context?: Record<string, any>): void {
  if (isDevelopment) {
    console.error('Error:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Log a message (non-error)
 */
export function logMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  if (isDevelopment) {
    console[level === 'warning' ? 'warn' : level](message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}
