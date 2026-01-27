# 13 – External Services Specification

**Definitive list of all external service dependencies and integration details.**

This document specifies which third-party services are used, why, and how they integrate with the system.

---

## Service Selection Principles

### Selection Criteria
- **Simplicity over features**: Choose services that do one thing well
- **Cost-effective for 2-user scale**: No enterprise pricing for household use
- **Avoid vendor lock-in where practical**: Prefer standard protocols
- **Local development friendly**: Must work offline or with local alternatives

### Phase-Based Rollout
- **Phase 1**: Essential services only (auth, database, LLM)
- **Phase 2+**: Enhanced capabilities (voice, OCR, recipe search)

---

## Phase 1 Services (MVP)

### 1. Authentication: Supabase Auth

**Purpose**: User authentication and session management

**Details**:
- **Provider**: Supabase Auth (built into Supabase platform)
- **Method**: Magic-link email authentication
- **Email delivery**: Supabase's built-in email (local dev) or custom SMTP (production)
- **Session duration**: 30 days (configurable)
- **Token type**: JWT (JSON Web Tokens)

**Configuration**:
```typescript
// supabase/config.toml
[auth]
site_url = "http://localhost:3000" # local dev
enable_signup = true
email_confirm_required = false # magic-link confirmation
```

**Why Supabase Auth**:
- Integrated with Supabase DB (no separate auth service)
- Built-in RLS integration for household isolation
- Magic-link flow built-in (no password management)
- Free tier sufficient for household use

**Local Development**:
- Uses Supabase local stack (`supabase start`)
- Inbucket for email capture (http://localhost:54324)
- No external email service needed locally

**Production**:
- Option 1: Supabase's email service (built-in, rate-limited)
- Option 2: Custom SMTP (SendGrid, Resend, AWS SES)
- Recommendation: Start with Supabase built-in, migrate if needed

**Cost**: Free (included in Supabase free tier)

---

### 2. Database & Backend: Supabase

**Purpose**: Postgres database, RLS, Edge Functions, Storage

**Details**:
- **Platform**: Supabase (https://supabase.com)
- **Database**: Postgres 15+
- **Functions**: Edge Functions (Deno runtime for Tools)
- **Storage**: Object storage for future recipe images (Phase 2+)
- **Real-time**: Supabase Realtime (optional, for multi-device sync)

**Why Supabase**:
- Postgres (industry standard, portable)
- Built-in RLS for household data isolation
- Edge Functions for Tool execution
- Local development stack
- Generous free tier

**Local Development**:
- `supabase start` runs full local stack
- Docker-based (Postgres, PostgREST, Realtime, Storage, Auth)
- No cloud dependency for development

**Production**:
- Supabase cloud (managed Postgres)
- Free tier: 500MB database, 2GB bandwidth/month
- Paid tier if needed: $25/month for unlimited

**Cost**: Free tier initially, ~$25/month if scaling beyond free tier

---

### 3. LLM: Anthropic Claude 4.5 Sonnet

**Purpose**: AI reasoning, meal planning, conversation

**Details**:
- **Provider**: Anthropic (https://anthropic.com)
- **Model**: `claude-sonnet-4-5-20250929` (Claude 4.5 Sonnet)
- **API**: Anthropic API (REST)
- **SDK**: `@anthropic-ai/sdk` (official TypeScript SDK)
- **Agent SDK**: `@anthropics/agent-sdk` (for tool-calling)

**Why Claude 4.5 Sonnet**:
- Best-in-class tool-calling quality
- Explicit reasoning (aligns with AI governance goals)
- Strong at structured output
- Better at following complex instructions than GPT-3.5
- Competitive pricing with GPT-4

**Usage Patterns**:
- Conversation: ~1K-5K tokens per message
- Meal planning: ~3K-10K tokens per week plan
- Tool calling: Minimal token overhead

**Estimated Costs** (based on Claude 4.5 Sonnet pricing):
- **Input**: $3 / million tokens
- **Output**: $15 / million tokens
- **Typical meal plan**: ~5K input + 2K output ≈ $0.05
- **Monthly (10 plans/week)**: ~$2/month

**Rate Limits**:
- Free tier: Limited (need API key with billing)
- Paid tier: 50 requests/minute (more than sufficient)

**Local Development**:
- Requires Anthropic API key (no local alternative)
- Use environment variable: `ANTHROPIC_API_KEY`
- Fallback: Mock responses for tests

**Cost**: ~$2-5/month for household use

---

### 4. Frontend Hosting: Vercel

**Purpose**: Next.js app hosting and deployment

**Details**:
- **Platform**: Vercel (https://vercel.com)
- **Framework**: Next.js 14+ (App Router)
- **Deployment**: Git-based (auto-deploy on push)
- **Custom domain**: Supported (optional)

**Why Vercel**:
- Built by Next.js creators (best integration)
- Zero-config deployment
- Free tier generous for household use
- Edge network (fast load times)
- Preview deployments for testing

**Free Tier Limits**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

**Local Development**:
- `npm run dev` (no Vercel dependency)
- Works offline

**Cost**: Free tier sufficient for household use

---

## Phase 2+ Services (Deferred)

### 5. Voice Input: Web Speech API (or Deepgram)

**Purpose**: Speech-to-text for recipe entry and chat

**Status**: Deferred to Phase 3+

**Option 1: Web Speech API** (Recommended for MVP)
- **Provider**: Browser built-in
- **Cost**: Free
- **Pros**: No external service, works offline (some browsers)
- **Cons**: Browser-dependent, accuracy varies, limited language support
- **Browser support**: Chrome (good), Safari (limited), Firefox (no support)

**Option 2: Deepgram**
- **Provider**: Deepgram (https://deepgram.com)
- **Cost**: $0.0043/minute (pay-as-you-go)
- **Pros**: Better accuracy, language support, consistent across devices
- **Cons**: Requires API key, network dependency
- **Estimated cost**: ~$0.50/month for household use

**Decision Point**: Start with Web Speech API. Migrate to Deepgram if accuracy is insufficient.

---

### 6. OCR: GPT-4 Vision (or Google Cloud Vision)

**Purpose**: Extract recipes from photos

**Status**: Deferred to Phase 3+

**Option 1: GPT-4 Vision** (Recommended)
- **Provider**: OpenAI
- **Model**: `gpt-4-vision-preview` or `gpt-4o`
- **Cost**: ~$0.01-0.03 per image
- **Pros**: Understands recipe structure, can parse complex layouts
- **Cons**: OpenAI dependency (not Anthropic), requires separate API key

**Option 2: Google Cloud Vision**
- **Provider**: Google Cloud
- **Cost**: $1.50 per 1,000 images (first 1,000 free/month)
- **Pros**: Lower cost for volume, specialized OCR
- **Cons**: Less intelligent (just text extraction, no recipe structuring)

**Decision Point**: Start with GPT-4 Vision for intelligent extraction. Fall back to Google Vision if cost is issue.

**Estimated cost**: ~$1-3/month (assuming 10-30 recipes imported per month)

---

### 7. Recipe Search: Web Scraping or Edamam API

**Purpose**: Import recipes from web URLs or search external recipe databases

**Status**: Deferred to Phase 3+

**Option 1: Web Scraping**
- **Method**: Parse recipe metadata from URLs (schema.org Recipe markup)
- **Libraries**: `cheerio`, `puppeteer` (Node.js)
- **Cost**: Free
- **Pros**: Works with any website that has structured data
- **Cons**: Brittle (breaks when sites change), legal gray area

**Option 2: Edamam Recipe API**
- **Provider**: Edamam (https://www.edamam.com)
- **Cost**: Free tier (5,000 calls/month), $0.004/call beyond
- **Pros**: Legal, structured data, nutrition info included
- **Cons**: Limited free tier, not all recipes available

**Option 3: Spoonacular API**
- **Provider**: Spoonacular (https://spoonacular.com)
- **Cost**: 150 calls/day free, $0.004/call beyond
- **Pros**: Large recipe database, meal planning features
- **Cons**: Limited free tier

**Decision Point**: Start with web scraping for specific URLs user provides. Add Edamam/Spoonacular if users want search/discovery.

**Estimated cost**: Free initially, ~$5-10/month if using paid APIs

---

## Service Integration Map

```
┌─────────────────────────────────────────────┐
│  User (Browser/Mobile)                      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Next.js Frontend (Vercel)                  │
│  - UI components                            │
│  - Auth flow                                │
│  - API routes                               │
└────────────┬─────────────┬──────────────────┘
             │             │
             ▼             ▼
┌────────────────────┐  ┌──────────────────────┐
│ Supabase           │  │ Anthropic Claude     │
│ - Auth (magic-link)│  │ - Conversation       │
│ - Postgres DB      │  │ - Tool calling       │
│ - RLS policies     │  │ - Meal planning      │
│ - Edge Functions   │  │                      │
│   (Tools execution)│  │                      │
└────────────────────┘  └──────────────────────┘
```

---

## Environment Variables

### Required (Phase 1)

```bash
# Supabase (local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# Supabase (production)
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or production URL
```

### Optional (Phase 2+)

```bash
# Voice (if using Deepgram)
DEEPGRAM_API_KEY=<deepgram-key>

# OCR (if using GPT-4 Vision)
OPENAI_API_KEY=sk-...

# Recipe Search (if using Edamam)
EDAMAM_APP_ID=<app-id>
EDAMAM_APP_KEY=<app-key>

# Email (if using custom SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

---

## Service Reliability & Fallbacks

### Critical Services (Must be available)
- **Supabase**: Database and auth
  - Fallback: None (app unusable without DB)
  - Mitigation: Supabase has 99.9% uptime SLA
- **Anthropic Claude**: AI functionality
  - Fallback: Graceful degradation (show error, allow manual operations)
  - Mitigation: Cache recent responses, queue retries

### Optional Services (Graceful degradation)
- **Voice input**: Falls back to text input
- **OCR**: Falls back to manual recipe entry
- **Recipe search**: Falls back to manual recipe creation

---

## Cost Summary

### Phase 1 (MVP)
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Supabase | Free | $0 |
| Anthropic Claude | Pay-as-you-go | ~$2-5 |
| Vercel | Free | $0 |
| **Total** | | **~$2-5/month** |

### Phase 2+ (With enhancements)
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Supabase | Free or Paid | $0-25 |
| Anthropic Claude | Pay-as-you-go | ~$3-8 |
| Vercel | Free | $0 |
| Deepgram (voice) | Pay-as-you-go | ~$0.50 |
| GPT-4 Vision (OCR) | Pay-as-you-go | ~$1-3 |
| Recipe API (optional) | Free or Paid | $0-10 |
| **Total** | | **~$5-50/month** |

**Note**: Costs based on household use (2 users, ~10-20 interactions/week). Enterprise or high-volume use would be higher.

---

## Security & API Key Management

### Development
- Store API keys in `.env.local` (gitignored)
- Never commit API keys to Git
- Use Supabase local keys for local dev (not production keys)

### Production
- Store API keys in Vercel environment variables
- Rotate keys periodically
- Use least-privilege access (read-only keys where possible)
- Monitor API usage for anomalies

### Key Rotation Schedule
- Anthropic API key: Rotate every 90 days
- Supabase keys: Rotate on security incidents only (managed by Supabase)
- Custom SMTP: Rotate every 90 days

---

## Migration & Portability

### Exit Strategy (If needed)

**Supabase**:
- Export data: `pg_dump` (standard Postgres)
- Migrate to: Any Postgres provider (AWS RDS, Railway, self-hosted)
- Portability: High (standard SQL)

**Anthropic Claude**:
- Export: Conversation logs (optional)
- Migrate to: OpenAI GPT-4, Google Gemini, local LLMs
- Portability: Medium (requires agent logic rewrite)

**Vercel**:
- Export: Git repository
- Migrate to: Netlify, AWS Amplify, self-hosted Next.js
- Portability: High (standard Next.js)

---

## Monitoring & Observability

### Service Health Monitoring
- **Supabase**: https://status.supabase.com
- **Anthropic**: https://status.anthropic.com
- **Vercel**: https://www.vercel-status.com

### Usage Monitoring
- **Supabase**: Built-in dashboard (query performance, storage, bandwidth)
- **Anthropic**: API usage dashboard (token consumption, costs)
- **Vercel**: Analytics dashboard (page views, bandwidth)

### Alerts
- Set up billing alerts for Anthropic API (threshold: $20/month)
- Monitor Supabase storage (alert at 400MB of 500MB free tier)

---

## Version History
- **v1.0** (2025-12-22): Initial specification based on approved architecture decisions
