# ResponsiAI

## Overview

ResponsiAI is an AI-powered web application that analyzes websites and generates mobile-responsive design conversions. Users can input any URL, and the system fetches the website content, analyzes its responsiveness and readability using AI, then generates an optimized mobile version with actionable suggestions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with custom design tokens defined in CSS variables
- **UI Components**: Shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints under `/api` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod for request/response validation with drizzle-zod integration

### Data Storage
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - contains users, analysis jobs, and saved designs tables
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)

### Key Design Patterns
- **Shared Schema**: The `shared/` directory contains schema definitions and types used by both frontend and backend
- **Storage Interface**: `server/storage.ts` implements a storage interface pattern for database operations
- **Async Job Processing**: Website analysis runs as background jobs with status polling from the frontend
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared directory

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (Shadcn + custom)
    pages/        # Route pages (home, library)
    hooks/        # Custom React hooks
    lib/          # Utilities and API client
server/           # Express backend
  services/       # AI converter and website fetcher
shared/           # Shared types and database schema
```

## External Dependencies

### AI Integration
- **OpenAI API**: Used via Replit AI Integrations for website analysis and mobile conversion generation
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Connection Pool**: Uses `pg` package with connection pooling

### Frontend Libraries
- **Radix UI**: Accessible component primitives (dialogs, menus, forms)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **Embla Carousel**: Carousel component

### Development Tools
- **Vite Plugins**: Runtime error overlay, cartographer, dev banner (Replit-specific)
- **esbuild**: Server bundling for production builds
- **tsx**: TypeScript execution for development