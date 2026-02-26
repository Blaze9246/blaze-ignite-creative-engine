#!/bin/bash
set -e

echo "🚀 Deploying Blaze Ignite Creative Engine to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login check
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Link to project if not already linked
if [ ! -f .railway/config.json ]; then
    echo "Linking to Railway project..."
    railway link
fi

# Deploy
echo "Deploying..."
railway up

echo "✅ Deployment complete!"
echo "View logs: railway logs"
echo "Open app: railway open"
