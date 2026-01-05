# ResponsiAI - GitHub Edition

> Website Mobile Responsiveness Analyzer powered entirely by GitHub services

## 🚀 What's New: GitHub-Only Mode

ResponsiAI now supports a **GitHub-only architecture** that replaces traditional infrastructure with GitHub services:

- 🤖 **GitHub Models API** instead of OpenAI/Anthropic/Gemini
- 📝 **GitHub Issues** instead of PostgreSQL database
- 📄 **GitHub Gists** instead of file storage
- ⚡ **GitHub Actions** for automated analysis workflows

This means you can run ResponsiAI with **zero infrastructure costs** and leverage GitHub's ecosystem for everything!

## Architecture Modes

### Traditional Mode (Original)
- Uses Replit AI Integrations (OpenAI, Anthropic, Gemini)
- PostgreSQL database for storage
- Express.js REST API
- React frontend

### GitHub-Only Mode (New!)
- Uses GitHub Models API for AI analysis
- GitHub Issues for job tracking
- GitHub Gists for design storage
- GitHub Actions for automation
- Same Express.js REST API and React frontend

Both modes can run simultaneously - see [GITHUB_ARCHITECTURE.md](./GITHUB_ARCHITECTURE.md) for details.

## Quick Start (GitHub-Only Mode)

### 1. Generate GitHub Token

Create a Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens) with these scopes:
- `repo` (for issues)
- `gist` (for storing designs)

### 2. Configure Environment

```bash
cp .env.github-example .env
# Edit .env and add your GITHUB_TOKEN
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Try It Out

#### Via Web UI
Open http://localhost:5000 and use the `/api/github/analyze` endpoint

#### Via API
```bash
# Start an analysis
curl -X POST http://localhost:5000/api/github/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Check status
curl http://localhost:5000/api/github/analyze/github-issue-1
```

#### Via GitHub Actions
1. Go to Actions tab in your repository
2. Select "GitHub-Only Website Analysis"
3. Click "Run workflow"
4. Enter a URL to analyze
5. Check the created issue for results!

## Features

### AI-Powered Analysis
- Multi-agent AI consensus using GitHub Models
- 6 specialized AI agents:
  - Analyzer (GPT-4o Mini)
  - Designer (GPT-4o)
  - Critic (Llama 3.3)
  - Accessibility Auditor (GPT-4o Mini)
  - Performance Analyzer (GPT-4o Mini)
  - Additional Evaluators (GPT-4o, GPT-4o Mini)

### Comprehensive Scoring
- **Consensus Score**: Agreement level between AI agents
- **Responsive Score**: Mobile optimization quality
- **Readability Score**: Text readability & touch targets
- **Accessibility Score**: WCAG compliance
- **Performance Score**: Optimization opportunities

### Design Outputs
- Generated mobile HTML (stored in GitHub Gist)
- Color palette extraction
- Typography recommendations
- Layout suggestions
- Accessibility issues
- Performance optimizations

## API Endpoints

### GitHub-Based Endpoints

#### Health Check
```bash
GET /api/github/health
```

#### Start Analysis
```bash
POST /api/github/analyze
Body: { "url": "https://example.com" }
```

#### Get Analysis Status
```bash
GET /api/github/analyze/:jobId
```

#### List All Jobs
```bash
GET /api/github/jobs
```

### Traditional Endpoints (if enabled)

```bash
POST /api/analyze
GET /api/analyze/:jobId
GET /api/designs
GET /api/designs/:id
```

## Documentation

- [**GitHub Architecture Guide**](./GITHUB_ARCHITECTURE.md) - Complete guide to GitHub-only mode
- [**API Documentation**](./GITHUB_ARCHITECTURE.md#api-endpoints) - All endpoints explained
- [**Setup Instructions**](./GITHUB_ARCHITECTURE.md#setup-instructions) - Detailed setup guide
- [**Comparison Table**](./GITHUB_ARCHITECTURE.md#comparison-traditional-vs-github-only) - Traditional vs GitHub-only

## Project Structure

```
.
├── server/
│   ├── githubRoutes.ts           # GitHub-based API routes
│   ├── routes.ts                 # Traditional API routes
│   ├── services/
│   │   ├── githubModels.ts       # GitHub Models integration
│   │   ├── githubStorage.ts      # GitHub Issues/Gists storage
│   │   ├── multiAgentOrchestrator.ts  # Original AI orchestration
│   │   ├── aiConverter.ts        # Original AI converter
│   │   └── websiteFetcher.ts     # Website fetching service
│   └── index.ts                  # Main server entry point
├── client/                       # React frontend
├── .github/
│   └── workflows/
│       └── github-analysis.yml   # Automated analysis workflow
├── GITHUB_ARCHITECTURE.md        # Architecture documentation
└── package.json
```

## Environment Variables

### Required for GitHub-Only Mode
```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo
```

### Optional Configuration
```bash
PORT=5000
NODE_ENV=development
```

### Required for Traditional Mode
```bash
DATABASE_URL=postgresql://...
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_ANTHROPIC_API_KEY=sk-ant-...
AI_INTEGRATIONS_GEMINI_API_KEY=...
```

## Examples

### Example 1: Single Website Analysis
```bash
curl -X POST http://localhost:5000/api/github/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
```

### Example 2: Check Analysis Status
```bash
curl http://localhost:5000/api/github/analyze/github-issue-123
```

### Example 3: View Results
The analysis creates:
1. A GitHub Issue tracking the job
2. A GitHub Gist with the mobile HTML
3. Comments with progress updates

Visit the issue URL to see everything!

## GitHub Actions Integration

The repository includes a workflow that can:
- Analyze websites on-demand
- Schedule periodic re-analysis
- Process multiple URLs in parallel
- Comment results on issues automatically

### Manual Trigger
1. Go to Actions → GitHub-Only Website Analysis
2. Click "Run workflow"
3. Enter URL and click Run

### Scheduled Analysis
Edit `.github/workflows/github-analysis.yml` to customize the schedule or batch URLs.

## Benefits of GitHub-Only Mode

✅ **Zero Infrastructure Costs** - No database or AI subscriptions needed
✅ **Built-in Version Control** - Every analysis tracked in issues
✅ **Transparency** - All results visible in GitHub
✅ **Collaboration** - Team can comment and review
✅ **Automation** - GitHub Actions for workflows
✅ **Scalability** - GitHub handles infrastructure
✅ **Audit Trail** - Complete history of all analyses

## Comparison

| Feature | Traditional | GitHub-Only |
|---------|------------|-------------|
| AI Models | OpenAI, Anthropic, Gemini | GitHub Models |
| Database | PostgreSQL | GitHub Issues |
| Storage | File system / S3 | GitHub Gists |
| Cost | ~$100/month | ~$0/month |
| Setup | Complex | Simple |
| Transparency | Limited | Full |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run check

# Database migration (traditional mode only)
npm run db:push
```

## Deployment

### Deploy to Any Platform

The GitHub-only mode works on any Node.js hosting:

```bash
# Set environment variables
export GITHUB_TOKEN=ghp_...
export GITHUB_REPO_OWNER=your-username
export GITHUB_REPO_NAME=your-repo

# Build and run
npm run build
npm start
```

### Deploy to Replit
1. Fork this repository
2. Add `GITHUB_TOKEN` secret
3. Click Run

### Deploy to Vercel/Netlify
1. Connect repository
2. Add environment variables
3. Deploy

## Contributing

Contributions welcome! Areas of interest:
- Additional GitHub integrations (Projects, Discussions)
- Frontend updates for GitHub-only mode
- More AI models from GitHub Models
- Performance optimizations
- Documentation improvements

## License

MIT

## Credits

- Built with GitHub Models API
- Uses Octokit for GitHub API integration
- Powered by Express.js and React
- Original architecture by ResponsiAI team

## Support

- 📝 [Issue Tracker](https://github.com/Universal-Standard/Responsify/issues)
- 📖 [Documentation](./GITHUB_ARCHITECTURE.md)
- 💬 [Discussions](https://github.com/Universal-Standard/Responsify/discussions)

---

**Powered by GitHub Services** 🚀
