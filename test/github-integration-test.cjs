#!/usr/bin/env node
/**
 * Test script for GitHub-only architecture
 * Verifies that all components are properly configured
 */

console.log("🔍 Testing GitHub-Only Architecture\n");

// Test 1: Check environment variables
console.log("1️⃣  Checking environment variables...");
const hasGitHubToken = !!process.env.GITHUB_TOKEN;
const repoOwner = process.env.GITHUB_REPO_OWNER || "Universal-Standard";
const repoName = process.env.GITHUB_REPO_NAME || "Responsify";

console.log(`   GitHub Token: ${hasGitHubToken ? "✅ Configured" : "⚠️  Not configured"}`);
console.log(`   Repository: ${repoOwner}/${repoName}`);

if (!hasGitHubToken) {
  console.log("\n⚠️  GitHub Token not found!");
  console.log("   Set GITHUB_TOKEN environment variable to test GitHub integration.");
  console.log("   Generate token at: https://github.com/settings/tokens\n");
}

// Test 2: Check dependencies
console.log("\n2️⃣  Checking dependencies...");
let hasErrors = false;
try {
  require("@octokit/rest");
  console.log("   @octokit/rest: ✅ Installed");
} catch (e) {
  console.log("   @octokit/rest: ❌ Not installed -", e.message);
  hasErrors = true;
}

try {
  require("openai");
  console.log("   openai: ✅ Installed");
} catch (e) {
  console.log("   openai: ❌ Not installed -", e.message);
  hasErrors = true;
}

// Test 3: Check service files
console.log("\n3️⃣  Checking service files...");
const fs = require("fs");
const path = require("path");

const files = [
  "server/services/githubModels.ts",
  "server/services/githubStorage.ts",
  "server/githubRoutes.ts",
  "GITHUB_ARCHITECTURE.md",
  ".env.github-example",
  ".github/workflows/github-analysis.yml",
];

for (const file of files) {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`   ${file}: ✅ Exists`);
  } else {
    console.log(`   ${file}: ❌ Missing`);
    hasErrors = true;
  }
}

// Test 4: Check TypeScript compilation
console.log("\n4️⃣  Checking TypeScript compilation...");
const { execSync } = require("child_process");
try {
  execSync("npm run check", { cwd: path.join(__dirname, ".."), stdio: "pipe" });
  console.log("   TypeScript: ✅ No errors");
} catch (e) {
  console.log("   TypeScript: ❌ Has errors");
  hasErrors = true;
  // Show compilation errors from both stdout and stderr
  console.log("\n   Compilation errors:");
  if (e.stdout && Buffer.isBuffer(e.stdout) && e.stdout.length > 0) {
    const output = e.stdout.toString();
    console.log(output.split('\n').slice(0, 15).map(line => `     ${line}`).join('\n'));
  }
  if (e.stderr && Buffer.isBuffer(e.stderr) && e.stderr.length > 0) {
    const output = e.stderr.toString();
    console.log(output.split('\n').slice(0, 15).map(line => `     ${line}`).join('\n'));
  }
  console.log("   Run 'npm run check' for full details");
}

if (hasErrors) {
  console.log("\n❌ Some tests failed. Please fix the errors above.");
  process.exit(1);
}

console.log("\n✅ All basic tests passed!");
console.log("\n📚 Next steps:");
console.log("   1. Generate a GitHub token: https://github.com/settings/tokens");
console.log("   2. Set GITHUB_TOKEN environment variable");
console.log("   3. Start the server: npm run dev");
console.log("   4. Test health: curl http://localhost:5000/api/github/health");
console.log("   5. View architecture docs: cat GITHUB_ARCHITECTURE.md");
