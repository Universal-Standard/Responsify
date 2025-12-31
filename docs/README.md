# GitHub Pages UI for ResponsiAI

This directory contains a professional, static HTML/JavaScript interface for ResponsiAI that works with GitHub Pages.

## Features

- **Zero Backend Required**: Interacts directly with GitHub APIs from the browser
- **Professional Design**: Modern, dark-themed UI with smooth animations
- **Intuitive Flow**: Clear step-by-step process for analyzing websites
- **Real-time Updates**: Polls GitHub Issues for analysis progress
- **Responsive**: Works on desktop and mobile devices
- **Self-Correcting**: Error handling and clear feedback

## How It Works

1. User enters a website URL and their GitHub Personal Access Token
2. Creates a GitHub Issue to track the analysis job
3. Polls the issue for status updates
4. Displays results with scores and links to the mobile design

## Setup

### Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: Select your branch (e.g., `copilot/review-repo-using-github-services`)
4. Folder: `/docs`
5. Click Save

Your site will be published at: `https://universal-standard.github.io/Responsify/`

### Important Note

This UI creates GitHub Issues but requires the backend server to process them. To complete the analysis:

1. User triggers analysis from GitHub Pages (creates Issue)
2. Backend server (running locally or deployed) processes the Issue
3. Results are updated in the Issue and Gist
4. UI displays the results by polling the Issue

## Files

- `index.html` - Main HTML structure
- `style.css` - Professional dark-themed styles
- `app.js` - JavaScript for GitHub API integration
- `README.md` - This file

## Architecture

```
┌─────────────┐
│  User Input │
│ (GitHub UI) │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  GitHub Issues  │◄──── Backend Server Processes
│  (Job Tracking) │
└────────┬────────┘
         │
         ▼
  ┌─────────────┐
  │GitHub Gists │
  │ (Mobile HTML)│
  └─────────────┘
```

## Benefits

✅ **Professional UI** - Modern, intuitive design
✅ **Easy to Use** - Clear instructions and flow
✅ **Self-Explanatory** - Users understand what's happening
✅ **Error Handling** - Graceful error messages
✅ **No Installation** - Works in any browser
✅ **GitHub Native** - Uses GitHub's infrastructure

## Development

To test locally:

```bash
# Serve the docs directory
cd docs
python3 -m http.server 8000

# Or use any static file server
npx serve
```

Then visit `http://localhost:8000`

## Customization

To customize for your repository:

1. Edit `app.js` and update:
   ```javascript
   const REPO_OWNER = 'Your-Username';
   const REPO_NAME = 'Your-Repo-Name';
   ```

2. Modify colors in `style.css`:
   ```css
   :root {
       --primary: #6366f1;  /* Change to your brand color */
       /* ... other colors ... */
   }
   ```

## Security

- GitHub tokens are never stored or sent to any third-party servers
- All API calls are made directly from the browser to GitHub
- Tokens are used only for the duration of the session
- Users should use tokens with minimal required permissions (repo, gist)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6+ support

## License

Same as parent project (MIT)
