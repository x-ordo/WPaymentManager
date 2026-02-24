import * as Sentry from '@sentry/nextjs';

/**
 * Development-only logger utility
 *
 * Prevents sensitive error information from being exposed in production.
 * In development, logs to console for debugging.
 * In production, errors are silently captured (can be sent to monitoring service).
 *
 * Issue #282: Frontend console.error()로 에러 객체 노출 방지
 */

const isDev = process.env.NODE_ENV === 'development';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Safe error logging that only outputs in development
 *
 * @example
 * ```typescript
 * try {
 *   await api.call();
 * } catch (err) {
 *   logger.error('Failed to fetch data', err);
 * }
 * ```
 */
export const logger = {
  /**
   * Log error - only in development
   */
  error: (message: string, error?: unknown, context?: LogContext): void => {
    if (isDev) {
      console.error(`[DEV] ${message}`, error, context);
    }
    if (!isDev && error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    }
  },

  /**
   * Log warning - only in development
   */
  warn: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.warn(`[DEV] ${message}`, context);
    }
    if (!isDev) {
      Sentry.addBreadcrumb({
        message,
        level: 'warning',
        data: context,
      });
    }
  },

  /**
   * Log info - only in development
   */
  info: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.info(`[DEV] ${message}`, context);
    }
    if (!isDev) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context,
      });
    }
  },

  /**
   * Log debug - only in development
   */
  debug: (message: string, context?: LogContext): void => {
    if (isDev) {
      console.debug(`[DEV] ${message}`, context);
    }
    if (!isDev) {
      Sentry.addBreadcrumb({
        message,
        level: 'debug',
        data: context,
      });
    }
  },
};

export default logger;
