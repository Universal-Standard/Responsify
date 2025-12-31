const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'Universal-Standard';
const REPO_NAME = 'Responsify';

let currentJobId = null;
let currentIssueNumber = null;
let pollInterval = null;

document.getElementById('analyzeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = document.getElementById('urlInput').value.trim();
    const token = document.getElementById('tokenInput').value.trim();
    
    if (!url || !token) {
        showStatus('Please provide both URL and GitHub token', 'error');
        return;
    }

    await startAnalysis(url, token);
});

async function startAnalysis(url, token) {
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Starting Analysis...';

    try {
        // Create GitHub Issue for job tracking
        const issue = await createIssue(url, token);
        currentIssueNumber = issue.number;
        currentJobId = `github-issue-${issue.number}`;

        showStatus(`Analysis started! Tracking in Issue #${issue.number}`, 'info');
        
        // Start polling for updates
        startPolling(token);

    } catch (error) {
        console.error('Analysis error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Analyze Website
        `;
    }
}

async function createIssue(url, token) {
    const response = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            title: `Analysis: ${url}`,
            body: `# Website Analysis Job

**URL:** ${url}
**Status:** pending
**Created:** ${new Date().toISOString()}

---

This issue tracks the mobile responsiveness analysis for the website.

## Progress
- [ ] Fetch website
- [ ] Extract content
- [ ] AI analysis
- [ ] Generate mobile design
- [ ] Create consensus scores

**Powered by ResponsiAI using GitHub Models**

**Note:** This analysis was triggered from GitHub Pages. You'll need to run the backend server to process this job.`,
            labels: ['responsify:job', 'status:analyzing']
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
    }

    return await response.json();
}

function startPolling(token) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    pollInterval = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
            clearInterval(pollInterval);
            showStatus('Analysis timeout. Check the GitHub Issue for details.', 'error');
            resetButton();
            return;
        }

        try {
            const issue = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${currentIssueNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }).then(r => r.json());

            // Check if analysis is complete
            const isCompleted = issue.labels.some(l => l.name === 'status:completed');
            const isFailed = issue.labels.some(l => l.name === 'status:failed');

            if (isCompleted) {
                clearInterval(pollInterval);
                showStatus('Analysis completed!', 'success');
                displayResults(issue);
                resetButton();
            } else if (isFailed) {
                clearInterval(pollInterval);
                showStatus('Analysis failed. Check the issue for details.', 'error');
                resetButton();
            } else {
                showStatus(`Analysis in progress... (${attempts * 5}s elapsed)`, 'info');
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000); // Poll every 5 seconds
}

function displayResults(issue) {
    const body = issue.body || '';
    
    // Parse scores from issue body
    const consensusMatch = body.match(/\*\*Consensus Score:\*\*\s*(\d+)/);
    const responsiveMatch = body.match(/\*\*Responsive Score:\*\*\s*(\d+)/);
    const readabilityMatch = body.match(/\*\*Readability Score:\*\*\s*(\d+)/);
    const accessibilityMatch = body.match(/\*\*Accessibility Score:\*\*\s*(\d+)/);
    const performanceMatch = body.match(/\*\*Performance Score:\*\*\s*(\d+)/);
    const gistMatch = body.match(/\*\*Gist:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);

    let resultsHTML = '<div class="score-grid">';
    
    if (consensusMatch) {
        resultsHTML += createScoreCard('Consensus', consensusMatch[1]);
    }
    if (responsiveMatch) {
        resultsHTML += createScoreCard('Responsive', responsiveMatch[1]);
    }
    if (readabilityMatch) {
        resultsHTML += createScoreCard('Readability', readabilityMatch[1]);
    }
    if (accessibilityMatch) {
        resultsHTML += createScoreCard('Accessibility', accessibilityMatch[1]);
    }
    if (performanceMatch) {
        resultsHTML += createScoreCard('Performance', performanceMatch[1]);
    }
    
    resultsHTML += '</div>';

    resultsHTML += '<div style="margin-top: 1.5rem;">';
    resultsHTML += `<a href="${issue.html_url}" target="_blank" class="issue-link">
        <svg fill="currentColor" viewBox="0 0 16 16" style="width: 16px; height: 16px;">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        View Full Details on GitHub
    </a>`;

    if (gistMatch) {
        resultsHTML += `<a href="${gistMatch[2]}" target="_blank" class="issue-link">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            View Mobile Design (Gist)
        </a>`;
    }
    resultsHTML += '</div>';

    document.getElementById('resultsContent').innerHTML = resultsHTML;
    document.getElementById('resultsContainer').classList.remove('hidden');
}

function createScoreCard(label, score) {
    const scoreNum = parseInt(score);
    let scoreClass = 'low';
    if (scoreNum >= 80) scoreClass = 'high';
    else if (scoreNum >= 60) scoreClass = 'medium';

    return `
        <div class="score-item">
            <span class="score-value ${scoreClass}">${score}</span>
            <span class="score-label">${label}</span>
        </div>
    `;
}

function showStatus(message, type) {
    const container = document.getElementById('statusContainer');
    container.className = `status ${type}`;
    container.innerHTML = `
        <svg fill="currentColor" viewBox="0 0 20 20" style="width: 20px; height: 20px;">
            ${type === 'success' ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' : 
              type === 'error' ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>' :
              '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>'}
        </svg>
        ${message}
    `;
    container.classList.remove('hidden');
}

function resetButton() {
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = false;
    btn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Analyze Website
    `;
}
