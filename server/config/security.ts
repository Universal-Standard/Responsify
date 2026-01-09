import helmet from 'helmet';
import { Express } from 'express';

/**
 * Configure security headers using helmet
 */
export function configureSecurityHeaders(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base helmet configuration
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React inline scripts in dev
            ...(isProduction ? [] : ["'unsafe-eval'"]), // Only in dev
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for styled-components/tailwind
            "https://fonts.googleapis.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:",
          ],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://*.sentry.io", // Sentry error reporting
          ],
          frameSrc: [
            "'self'",
            "https://js.stripe.com",
            "https://hooks.stripe.com",
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : undefined,
        },
      },
      
      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      
      // X-Frame-Options
      frameguard: {
        action: 'deny',
      },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // X-XSS-Protection
      xssFilter: true,
      
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      
      // Permissions-Policy (formerly Feature-Policy)
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    // Remove powered-by header
    res.removeHeader('X-Powered-By');
    
    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
    
    next();
  });

  console.log('✅ Security headers configured');
}
