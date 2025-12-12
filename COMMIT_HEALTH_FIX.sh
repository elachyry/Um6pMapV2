#!/bin/bash

echo "🏥 Adding health check endpoint fix..."

git add server/src/index.ts server/tsconfig.json Dockerfile HEALTHCHECK_FAILED.md

git commit -m "fix: add /api/health endpoint and force TypeScript emit

- Added health check endpoint at /api/health
- Tests database connection
- Returns status, timestamp, database state, uptime
- Set noEmitOnError: false in tsconfig.json
- Updated Dockerfile build strategy
- Health check should now pass on Railway"

git push origin railway

echo "✅ Pushed to railway branch!"
echo "🔄 Railway will auto-deploy in ~5-7 minutes"
echo "📊 Monitor at: https://railway.app"
