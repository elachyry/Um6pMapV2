#!/bin/bash

# Quick Deploy Script for Railway
# This script commits and pushes all changes to the railway branch

echo "🚀 Starting Railway deployment process..."

# Check if we're on railway branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "railway" ]; then
    echo "⚠️  Not on railway branch. Switching..."
    git checkout railway
fi

# Stage all changes
echo "📦 Staging changes..."
git add -A

# Show what's being committed
echo "📝 Files to be committed:"
git status --short

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "💾 Committing changes..."
git commit -m "fix: Railway deployment fixes - $TIMESTAMP

- Disabled TypeScript strict checking
- Updated Dockerfile to skip lib check
- Fixed npm install issues
- Added tsconfig.json to build
- Ready for production deployment"

# Push to railway branch
echo "🚢 Pushing to Railway..."
git push origin railway

echo "✅ Done! Railway will now rebuild automatically."
echo "📊 Check deployment status at: https://railway.app"
echo ""
echo "🔗 Useful commands:"
echo "  - View logs: railway logs"
echo "  - Check status: railway status"
echo "  - Open dashboard: railway open"
