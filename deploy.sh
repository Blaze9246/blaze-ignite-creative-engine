#!/bin/bash
set -e

echo "🚀 Blaze Ignite Creative Engine - Deployment Script"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Building project...${NC}"
npm run build

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Next steps for Railway deployment:"
echo ""
echo "1. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/blaze-ignite-creative-engine.git"
echo "   git push -u origin main"
echo ""
echo "2. Or deploy directly with Railway CLI:"
echo "   npm install -g @railway/cli"
echo "   railway login"
echo "   railway link"
echo "   railway up"
echo ""
echo "3. Set environment variables in Railway dashboard:"
echo "   - GEMINI_API_KEY (required for image generation)"
echo "   - ARK_BASE_URL (optional, for DeepSeek)"
echo "   - ARK_API_KEY (optional, for DeepSeek)"
echo ""
