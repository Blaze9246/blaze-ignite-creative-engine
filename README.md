# Blaze Ignite Creative Engine

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Blaze9246/blaze-ignite-creative-engine)

A Next.js (App Router) internal tool for generating ad campaigns with:
- DeepSeek (BytePlus Ark) for the "brain"
- Google Gemini "Nano Banana" for image generation
- Optional Seedream 4.5 via OpenAI-compatible Images API
- Optional Postgres + Cloudflare R2

## Quick Deploy to Render

Click the "Deploy to Render" button above.

The following environment variables are pre-configured:
- `GEMINI_API_KEY`
- `ARK_BASE_URL`
- `ARK_API_KEY`
- `DEEPSEEK_MODEL`

## Features

- **Store Analysis**: Scrapes Shopify JSON or sitemap + JSON-LD
- **Campaign Generation**: DeepSeek multi-step pipeline
- **Image Generation**: Nano Banana 2/Pro or Seedream 4.5
- **Creative Blocks**: 8 architectures + optional UGC/PROMO blocks
- **Google PMax Pack**: Auto-generated headlines & descriptions
- **Cost Estimation**: Per-campaign cost calculator

## API Endpoints

- `POST /api/analyze-store` - Scrape store products
- `POST /api/brain/generate-campaign` - Generate campaign with AI
- `POST /api/image/generate` - Generate images with selected provider

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` with:
```
GEMINI_API_KEY=your_key
ARK_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
ARK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-v3-1-250821
```
