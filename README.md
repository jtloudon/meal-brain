# MealBrain

**A meal planning app with an embedded AI sous chef**

---

## Why I Built This

I couldn't find what I needed in the App Store: a meal planning app with an AI sous chef that actually understood my preferences and could help me think through weekly meals.

Every app I tried either had no AI, or bolted on a generic chatbot that didn't know anything about *my* recipes, *my* dietary rules, or *my* family's preferences.

So I built MealBrain.

---

## The AI Sous Chef

The core differentiator is an **embedded AI assistant** with full context about your household:

- **Your recipes** - ingredients, tags, ratings, notes
- **Your meal plans** - what's scheduled for the week
- **Your grocery lists** - what you need to buy
- **Your dietary rules** - allergies, preferences, restrictions

### What It Can Do

Ask it anything:
- *"What can I make with the chicken in my fridge?"*
- *"Plan dinners for this week - we're busy Tuesday and Thursday"*
- *"Add ingredients for Tacos to my grocery list"*
- *"What's a quick breakfast I haven't made recently?"*

### Philosophy: Helpful, Never Bossy

The AI **suggests but never surprises**. All write operations (adding meals, modifying lists) require your approval first. You stay in control.

---

## Features

- **Recipes** - Create, import from URLs, tag, rate, and organize
- **Meal Planner** - Calendar-style week view, drag meals around
- **Grocery Lists** - Auto-categorized by aisle, tracks which recipe needs what
- **Mobile-First** - PWA installable on any device, optimized for one-handed use

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (magic link + password) |
| AI | Anthropic Claude API (Haiku for categorization, Sonnet for chat) |
| Hosting | Vercel (frontend) + Supabase Cloud (database) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- [Anthropic API key](https://console.anthropic.com/)

### Quick Start

```bash
# Clone and install
git clone https://github.com/jtloudon/meal-brain.git
cd meal-brain
npm install

# Copy environment template
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start local Supabase
npx supabase start

# Run migrations
npx supabase db reset

# Start dev server
npm run dev
```

### Environment Variables

Copy `.env.local.example` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Your Claude API key from [Anthropic Console](https://console.anthropic.com/) |

---

## Database Migrations

The SQL migrations in `supabase/migrations/` reflect **iterative development** - learning and evolving the schema through real-world usage rather than upfront design.

They tell the story of how the app evolved: starting simple, adding features, refactoring as patterns emerged. This is intentional.

---

## Self-Hosting

For cloud deployment (Vercel + Supabase Cloud), see [docs/cloud-setup-and-deployment.md](docs/cloud-setup-and-deployment.md).

**Estimated cost**: ~$2-5/month for a 2-person household
- Supabase: Free tier
- Vercel: Free tier
- Claude API: Pay-per-use (~$2-5/month typical usage)

---

## Documentation

Architecture and design decisions live in `/docs`:

- [Architecture](docs/01_architecture.md) - System design and tech choices
- [Data Models](docs/05_data_models.md) - Database schema
- [AI Behavior Contract](docs/09_ai_behavior_contract.md) - How the AI operates
- [Cloud Setup](docs/cloud-setup-and-deployment.md) - Deployment guide

---

## Contributing

Issues and feature ideas welcome. PRs considered - please open an issue first to discuss.

---

## License

MIT - see [LICENSE](LICENSE)
