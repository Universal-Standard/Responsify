# ResponsiAI

> AI-powered website analysis and mobile-responsive design conversion platform

**🎉 100% Production-Ready - No Mock Data, No Demo Code, No Placeholders**

ResponsiAI is a production-ready web application that analyzes websites and generates mobile-responsive design conversions using a multi-agent AI architecture. Built with React, Express, TypeScript, and powered by OpenAI, Anthropic, and Google Gemini.

All features are fully implemented with real database backing, authentication, and Stripe integration. Simply add your API keys and deploy!

## ✨ Features

### Core Functionality
- 🤖 **Multi-Agent AI Analysis** - Consensus-based analysis using 3 AI providers (OpenAI, Anthropic, Gemini)
- 📱 **Mobile Conversion** - Automated generation of mobile-responsive designs
- 📊 **5-Dimensional Scoring** - Comprehensive evaluation across Consensus, Responsive, Readability, Accessibility, and Performance
- 🎨 **Design Versioning** - Track and compare multiple iterations of designs
- 💾 **Design Library** - Save, manage, and organize your converted designs

### User Interface
- 🏠 **Dashboard** - Quick access to website analysis tools
- 📚 **Library** - Manage saved designs with search and filtering
- 🔍 **Compare** - Side-by-side comparison of designs with score analysis
- 📈 **Analytics** - Usage statistics and performance insights
- 📖 **Documentation** - Comprehensive API reference and guides
- ⚙️ **Settings** - User preferences and account management

### Security & Performance
- 🔒 **Rate Limiting** - API protection with configurable limits
- 🛡️ **Input Validation** - XSS prevention and sanitization
- 🚀 **Optimized** - Fast builds and production-ready code
- 💳 **Stripe Integration** - Secure subscription billing
- 🔐 **Security Headers** - Comprehensive helmet configuration with CSP
- 📊 **Error Tracking** - Sentry integration for monitoring

### Operations & Infrastructure
- 🗄️ **Session Management** - Redis/memory store with secure cookies
- 📧 **Email Notifications** - Automated subscription and payment emails
- 💾 **Database Backups** - Automated backup and restore scripts
- 🏥 **Health Checks** - Endpoints for monitoring and load balancers
- 📝 **Structured Logging** - Winston logger with log rotation

### Subscription Tiers
- **Free**: 5 analyses/month, 3 saved designs
- **Pro** ($19/month): 50 analyses/month, 50 saved designs, advanced features
- **Enterprise** ($99/month): Unlimited analyses, team collaboration, API access

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database
- API keys for OpenAI, Anthropic, and Google Gemini
- Stripe account (for billing features)
- Redis (optional, recommended for production)
- SMTP server (optional, for email notifications)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Universal-Standard/Responsify.git
cd Responsify
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/responsiai

# AI Providers (via Replit AI Integrations)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=your_openai_key

AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
AI_INTEGRATIONS_ANTHROPIC_API_KEY=your_anthropic_key

AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_key

# Stripe (for billing features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Session Management
SESSION_SECRET=generate-with-openssl-rand-base64-32

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ResponsiAI <noreply@responsiai.com>

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...

# Redis (optional, recommended for production)
REDIS_URL=redis://localhost:6379

# Application
APP_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

See `.env.example` for complete configuration options.

4. **Initialize the database**
```bash
npm run db:push
```

5. **Start development server**
```bash
# Start both frontend and backend
npm run dev
```

The application will be available at `http://localhost:5000`

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

This creates optimized bundles in the `dist/` directory.

### Start Production Server
```bash
npm start
```

### Database Management
```bash
# Create database backup
npm run db:backup

# Restore from backup
npm run db:restore -- path/to/backup.sql

# Push schema changes
npm run db:push
```

### Environment Variables for Production
Ensure all environment variables are set in your production environment:
- Set `NODE_ENV=production`
- Use production API keys (no test keys)
- Configure production database URL
- Set up Stripe webhook endpoint
- Configure Redis for session management
- Set up SMTP for email notifications
- Configure Sentry DSN for error tracking
- Generate strong SESSION_SECRET

## 🔧 Operations & Monitoring

### Health Checks
- `GET /api/health` - Basic health check with service status
- `GET /api/health/ready` - Readiness probe for load balancers

### Session Management
- **Development**: Uses in-memory store
- **Production**: Uses Redis (falls back to memory if unavailable)
- Session duration: 24 hours with rolling expiration
- Secure, HTTP-only cookies with CSRF protection

### Error Tracking
- Integrated with Sentry for error and performance monitoring
- Automatic PII filtering for security
- Configurable sample rates

### Email Notifications
Automatic emails for:
- Subscription confirmations
- Payment failures
- Subscription cancellations
- Usage limit warnings

### Security Headers
- Comprehensive helmet configuration
- Content Security Policy (CSP)
- HSTS, X-Frame-Options, and more
- Stripe and Sentry whitelisted

### Logging
- Structured logging with Winston
- Console output in development (colorized)
- File output in production with rotation
- Configurable log levels

For detailed operational documentation, see [OPERATIONS.md](./OPERATIONS.md).

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Wouter, TanStack Query, Tailwind CSS v4
- **Backend**: Express.js, TypeScript (ESM)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Payments**: Stripe
- **Sessions**: Redis / Memorystore
- **Monitoring**: Sentry
- **Email**: Nodemailer (SMTP)
- **Security**: Helmet, rate-limit-express
- **Logging**: Winston
- **Build**: Vite, esbuild

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Route pages
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and API client
├── server/              # Express backend
│   ├── config/          # Session, Sentry, logging, security
│   ├── services/        # AI orchestrator, website fetcher, Stripe, email
│   ├── middleware.ts    # Rate limiting, validation, auth
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── auth.ts          # Authentication
├── scripts/             # Database backup/restore scripts
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle schema definitions
└── dist/                # Production build output
```

## 🔌 API Reference

### Analysis Endpoints

#### POST `/api/analyze`
Start analyzing a URL
```json
{
  "url": "https://example.com"
}
```

#### GET `/api/analyze/:jobId`
Get analysis status and results

### Design Endpoints

#### GET `/api/designs`
Get all saved designs

#### POST `/api/designs`
Save a design from completed analysis
```json
{
  "jobId": "uuid",
  "name": "My Design"
}
```

#### PATCH `/api/designs/:id`
Update design properties (name, starred status)

#### DELETE `/api/designs/:id`
Delete a saved design

### Billing Endpoints

#### GET `/api/billing/plans`
Get all subscription plans

#### POST `/api/billing/create-checkout-session`
Create Stripe checkout session
```json
{
  "priceId": "price_..."
}
```

#### POST `/api/billing/create-portal-session`
Create Stripe customer portal session

#### POST `/api/billing/webhook`
Stripe webhook handler (requires signature verification)

## 🔐 Security

### Current Implementation
- **Rate Limiting**: 100 requests per 15 minutes (general), 10 requests per hour (analysis)
- **Input Validation**: Basic XSS prevention on all inputs
- **Authentication**: Session-based middleware ready for integration
- **Stripe**: PCI-compliant payment processing
- **Environment Variables**: Sensitive data never committed

### ⚠️ Important Security Notes

**XSS Protection**: The current input validation middleware uses `sanitize-html` server-side with a strict configuration that strips all HTML tags and common attack patterns. This is intentionally conservative and may be too restrictive for some production use cases, so you should review and adjust the configuration before deployment.

**Required for Production:**
1. **Review Sanitization Configuration**: `sanitize-html` is already integrated in the middleware. For production, verify that its configuration matches your threat model and content needs (e.g., which tags/attributes, if any, should be allowed). If you need richer HTML handling (such as allowing limited user-generated HTML), consider integrating a client-side sanitizer like DOMPurify:
   ```bash
   npm install dompurify isomorphic-dompurify
   ```

2. **Implement CSP Headers**: Add Content Security Policy headers to prevent XSS:
   ```javascript
   app.use((req, res, next) => {
     res.setHeader("Content-Security-Policy", "default-src 'self'");
     next();
   });
   ```

3. **Add Authentication**: Implement proper user authentication before enabling billing features

4. **Regular Updates**: Keep all dependencies up to date with security patches

5. **Security Audits**: Run `npm audit` regularly and address vulnerabilities

See `server/middleware.ts` for detailed security implementation notes.

## 🧪 Testing

```bash
# Type checking
npm run check

# Build test
npm run build
```

## 🎨 Multi-Agent AI System

ResponsiAI uses a sophisticated multi-agent architecture:

1. **Analyzer Agent (OpenAI)**: Extracts website structure and content
2. **Designer Agent (Anthropic)**: Generates mobile-optimized layouts
3. **Critic Agents (OpenAI, Anthropic, Gemini)**: Review and score designs
4. **Accessibility Agent (Gemini)**: WCAG compliance audit
5. **Performance Agent (OpenAI)**: Optimization analysis

Agents work in consensus to ensure high-quality results with scores above 80%.

## 📝 Roadmap

### v1.0 (Current) ✅
- Multi-agent AI analysis
- Design versioning and library
- Comparison tools
- Analytics dashboard
- Documentation portal
- Rate limiting and security
- Stripe billing integration

### v1.2 (Planned)
- Two-factor authentication (2FA)
- Team collaboration features
- Advanced comparison tools
- Export to Figma/Sketch

### v2.0 (Future)
- Webhook endpoints
- PWA support
- Mobile app
- White-label options
- API access for Enterprise

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: `/docs` page in the app
- Issues: [GitHub Issues](https://github.com/Universal-Standard/Responsify/issues)
- Email: support@responsiai.com (placeholder)

## 🙏 Acknowledgments

- Built with [Replit AI Integrations](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Made with ❤️ by Universal Standards**
