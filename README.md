# Blaze Ignite Creative Engine

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/blaze-ignite-creative-engine)

A Next.js (App Router) internal tool for generating ad campaigns with:
- DeepSeek (BytePlus Ark) for the "brain"
- Google Gemini "Nano Banana" for image generation
- Optional Seedream 4.5 via OpenAI-compatible Images API
- Optional Postgres + Cloudflare R2

## Quick Deploy

Click the "Deploy on Railway" button above or:

1. Fork this repo to your GitHub
2. Create new project in Railway → Deploy from GitHub repo
3. Add environment variables (see below)
4. Deploy

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for image generation |

### Optional (for DeepSeek AI)
| Variable | Description |
|----------|-------------|
| `ARK_BASE_URL` | BytePlus Ark base URL (e.g., https://ark.ap-southeast.bytepluses.com/api/v3) |
| `ARK_API_KEY` | BytePlus Ark API key |
| `DEEPSEEK_MODEL` | Model ID (default: deepseek-v3-1-250821) |

### Optional (for Postgres persistence)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Optional (for R2 image storage)
| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Public URL for R2 bucket |

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` with the same variables as above.

## Features

- **Store Analysis**: Scrapes Shopify JSON or sitemap + JSON-LD
- **Campaign Generation**: DeepSeek multi-step pipeline (or demo mode)
- **Image Generation**: Nano Banana 2/Pro or Seedream 4.5
- **Creative Blocks**: 8 architectures + optional UGC/PROMO blocks
- **Google PMax Pack**: Auto-generated headlines & descriptions
- **Cost Estimation**: Per-campaign cost calculator

## API Endpoints

- `POST /api/analyze-store` - Scrape store products
- `POST /api/brain/generate-campaign` - Generate campaign with AI
- `POST /api/image/generate` - Generate images with selected provider
