# ResponsiAI

> AI-powered website analysis and mobile-responsive design conversion platform

ResponsiAI is a production-ready web application that analyzes websites and generates mobile-responsive design conversions using a multi-agent AI architecture. Built with React, Express, TypeScript, and powered by OpenAI, Anthropic, and Google Gemini.

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
- 💳 **Stripe Integration** - Secure subscription billing (v1.1)

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

# Stripe (Optional - for billing features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Application
APP_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

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

### Environment Variables for Production
Ensure all environment variables are set in your production environment:
- Set `NODE_ENV=production`
- Use production API keys
- Configure production database URL
- Set up Stripe webhook endpoint

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Wouter, TanStack Query, Tailwind CSS v4
- **Backend**: Express.js, TypeScript (ESM)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Payments**: Stripe
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
│   ├── services/        # AI orchestrator, website fetcher, Stripe
│   ├── middleware.ts    # Rate limiting, validation, auth
│   ├── routes.ts        # API endpoints
│   └── storage.ts       # Database operations
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

- **Rate Limiting**: 100 requests per 15 minutes (general), 10 requests per hour (analysis)
- **Input Validation**: XSS prevention on all inputs
- **Authentication**: Session-based (middleware ready)
- **Stripe**: PCI-compliant payment processing
- **Environment Variables**: Sensitive data never committed

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
