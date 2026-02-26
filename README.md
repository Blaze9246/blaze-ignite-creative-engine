# Blaze Ignite Creative Engine

A Next.js (App Router) internal tool for generating ad campaigns with:
- DeepSeek (BytePlus Ark) for the "brain"
- Google Gemini "Nano Banana" for image generation
- Optional Seedream 4.5 via OpenAI-compatible Images API
- Optional Postgres + Cloudflare R2

## Deploy to Railway

1. Push this repo to GitHub
2. Connect to Railway
3. Set environment variables (see below)
4. Deploy

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key for image generation

### Optional (for DeepSeek)
- `ARK_BASE_URL` - BytePlus Ark base URL
- `ARK_API_KEY` - BytePlus Ark API key
- `DEEPSEEK_MODEL` - Model ID (default: deepseek-v3-1-250821)

### Optional (for Postgres)
- `DATABASE_URL` - PostgreSQL connection string

### Optional (for R2 storage)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

## Local Development

```bash
npm install
npm run dev
```
