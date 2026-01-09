import * as Sentry from '@sentry/node';
import { Express } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(app: Express) {
  const sentryDsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!sentryDsn) {
    console.log('ℹ️  Sentry DSN not configured, skipping error tracking');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, adjust this to a lower value to reduce load
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    
    // Capture 100% of errors in production
    sampleRate: 1.0,
    
    // Performance monitoring
    integrations: [
      // HTTP calls
      new Sentry.Integrations.Http({ tracing: true }),
      // Express integration
      new Sentry.Integrations.Express({ app }),
    ],
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['stripe-signature'];
      }
      
      // Remove sensitive query params
      if (event.request?.query_string) {
        const sanitized = event.request.query_string
          .replace(/api_key=[^&]+/g, 'api_key=[REDACTED]')
          .replace(/token=[^&]+/g, 'token=[REDACTED]')
          .replace(/password=[^&]+/g, 'password=[REDACTED]');
        event.request.query_string = sanitized;
      }
      
      return event;
    },
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Request handler - must be the first middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Tracing handler - after request handler
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Error handler - must be after all controllers and before error handlers
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}
