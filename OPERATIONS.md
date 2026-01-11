# Production Operations Guide

This guide covers all the operational aspects of running ResponsiAI in production.

## Table of Contents

1. [Session Management](#session-management)
2. [Error Tracking & Monitoring](#error-tracking--monitoring)
3. [Security Headers](#security-headers)
4. [Email Notifications](#email-notifications)
5. [Database Backups](#database-backups)
6. [Health Checks](#health-checks)
7. [Logging](#logging)

---

## Session Management

### Overview
ResponsiAI uses express-session with support for both Redis (production) and in-memory storage (development).

### Configuration

**Development** (uses in-memory store):
```bash
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
```

**Production** (uses Redis):
```bash
NODE_ENV=production
SESSION_SECRET=your-production-secret-key
REDIS_URL=redis://username:password@host:port
COOKIE_DOMAIN=.yourdomain.com
```

### How It Works

- **Development**: Uses `memorystore` for simplicity
- **Production**: Connects to Redis for distributed session management
- **Fallback**: Automatically falls back to memory store if Redis connection fails
- **Session Duration**: 24 hours with rolling expiration
- **Security**: HTTP-only cookies, secure flag in production, CSRF protection via sameSite

### Generate Session Secret

```bash
openssl rand -base64 32
```

---

## Error Tracking & Monitoring

### Sentry Integration

ResponsiAI uses Sentry for error tracking and performance monitoring.

### Configuration

```bash
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
NODE_ENV=production
```

### Features

- **Error Tracking**: Automatic capture of all uncaught exceptions
- **Performance Monitoring**: 10% sample rate in production, 100% in development
- **PII Filtering**: Automatically redacts sensitive data:
  - Authorization headers
  - Cookies
  - Stripe signatures
  - API keys in query strings
- **Request Context**: Includes HTTP method, path, and status code

### Manual Error Capture

```typescript
import { captureException, captureMessage } from './config/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, { context: 'additional data' });
}

// Log messages
captureMessage('Important event occurred', 'info');
```

---

## Security Headers

### Helmet Configuration

Comprehensive security headers are configured automatically using helmet.

### Headers Included

- **Content Security Policy (CSP)**: Restricts resource loading
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS for 1 year
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Disables unnecessary browser features

### CSP Directives

```javascript
{
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  connectSrc: ["'self'", "https://api.stripe.com", "https://*.sentry.io"],
  frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
  objectSrc: ["'none'"],
}
```

---

## Email Notifications

### SMTP Configuration

ResponsiAI sends automated emails for subscription events.

### Required Environment Variables

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ResponsiAI <noreply@responsiai.com>
```

### Supported Providers

1. **Gmail**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```
   Note: Requires [App Password](https://support.google.com/accounts/answer/185833)

2. **SendGrid**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

3. **AWS SES**
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   ```

4. **Mailgun**
   ```bash
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   ```

### Email Types

- **Subscription Confirmation**: Sent when user subscribes
- **Subscription Cancellation**: Sent when subscription is cancelled
- **Payment Failure**: Sent when payment fails
- **Usage Limit Warning**: Sent when approaching usage limits (90%)

### Testing

If SMTP is not configured, emails are logged to console instead of being sent.

---

## Database Backups

### Automated Backups

ResponsiAI includes backup scripts using `pg_dump`.

### Create Backup

```bash
npm run db:backup
```

Optional compression:
```bash
npm run db:backup -- --compress
```

### Restore Backup

```bash
npm run db:restore -- path/to/backup.sql
```

Note: Restore is disabled in production for safety. Must be done manually.

### Backup Location

Default: `./backups/`

Custom location:
```bash
BACKUP_DIR=/path/to/backups npm run db:backup
```

### Backup Schedule (Production)

Set up a cron job for automated backups:

```bash
# Backup daily at 2 AM
0 2 * * * cd /path/to/app && npm run db:backup -- --compress

# Backup every 6 hours
0 */6 * * * cd /path/to/app && npm run db:backup
```

### Backup Retention

Implement a rotation policy to manage disk space:

```bash
# Keep last 7 days of backups
find /path/to/backups -name "backup-*.sql.gz" -mtime +7 -delete
```

---

## Health Checks

### Endpoints

#### 1. Basic Health Check
```
GET /api/health
```

Returns server status and service health:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "services": {
    "database": "ok",
    "email": "not_configured",
    "stripe": "ok"
  }
}
```

Status codes:
- `200`: All services healthy
- `503`: One or more services degraded

#### 2. Readiness Check
```
GET /api/health/ready
```

Returns readiness status (suitable for Kubernetes readiness probe):
```json
{
  "status": "ready"
}
```

Status codes:
- `200`: Service is ready to accept traffic
- `503`: Service is not ready

### Load Balancer Configuration

**AWS ALB/ELB**:
- Health check path: `/api/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

**Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Logging

### Winston Logger

Structured logging with Winston for better observability.

### Log Levels

- **error**: Error messages (always logged)
- **warn**: Warning messages
- **info**: Informational messages (default in production)
- **debug**: Debug messages (default in development)

### Configuration

```bash
LOG_LEVEL=info  # Options: error, warn, info, debug
```

### Log Locations

**Development**:
- Console output (colorized)

**Production**:
- Console output (JSON format)
- `logs/error.log` (error level only)
- `logs/combined.log` (all levels)

### Log Rotation

Files are automatically rotated:
- Max size: 5MB
- Max files: 5 backups

### Usage in Code

```typescript
import { log } from './config/logger';

log.info('User logged in', { userId: '123' });
log.error('Payment failed', new Error('Card declined'));
log.warn('Usage approaching limit', { used: 45, limit: 50 });
log.debug('Debug information', { data: {...} });
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables
- [ ] Generate strong SESSION_SECRET
- [ ] Configure Redis for session management
- [ ] Set up Sentry for error tracking
- [ ] Configure SMTP for email notifications
- [ ] Set up Stripe webhooks
- [ ] Configure database backups
- [ ] Set up health check monitoring
- [ ] Review and test CSP headers
- [ ] Enable HTTPS/SSL
- [ ] Test all email templates
- [ ] Verify rate limiting configuration
- [ ] Set up log aggregation (optional)
- [ ] Configure CDN for static assets (optional)
- [ ] Set up database replication (optional)

---

## Troubleshooting

### Redis Connection Issues

If Redis fails to connect:
1. Check REDIS_URL format
2. Verify network connectivity
3. Check Redis server status
4. Review firewall rules

The application will automatically fall back to memory store and log a warning.

### Email Not Sending

1. Check SMTP credentials
2. Verify SMTP_HOST and SMTP_PORT
3. Check for firewall blocking port 587
4. Review email service logs
5. Test with `telnet smtp.host.com 587`

Emails will be logged to console if SMTP is not configured.

### Sentry Not Capturing Errors

1. Verify SENTRY_DSN is set
2. Check network connectivity to sentry.io
3. Verify NODE_ENV is set correctly
4. Check Sentry dashboard for rate limiting

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Universal-Standard/Responsify/issues
- Documentation: See README.md

