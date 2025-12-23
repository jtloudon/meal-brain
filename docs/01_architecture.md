# Architecture — Creative AI + Deterministic Skills (Web-First)

## Core Design Rule
The AI is allowed to be:
- Creative
- Opinionated
- Exploratory
- Strategic

But it is **never allowed to mutate state directly**.

All writes go through deterministic SKILLs.

---

## Platform Strategy
Primary platform is a **responsive web app (PWA)**.

Reasons:
- Single codebase
- Voice + camera supported
- Installable on iPhone
- No double work

Optional later:
- iOS wrapper using Capacitor (not a rewrite)

---

## Hosting

**Frontend + Backend (Unified)**:
- Vercel
  - Next.js App Router (frontend)
  - API Routes (Agent SDK backend - serverless functions)
  - Environment variables for config

**Database + Auth**:
- Supabase
  - Postgres (database)
  - Auth (magic-link, household isolation)
  - Storage (images, OCR inputs - Phase 3+)

**AI Orchestrator**:
- **Decision**: Vercel API Routes (chosen over Supabase Edge Functions)
- **Location**: `/app/api/agent/route.ts`
- **Rationale**:
  - Simpler deployment (one project, not two)
  - Perfect for 2-user household scale
  - Serverless on Vercel (pay per request)
  - Easy to migrate to Edge Functions later if needed

---

## Major Components

**Frontend** (Next.js):
- Web UI (recipes, planner, groceries)
- Persistent AI chat panel
- React components + Tailwind styling

**Backend** (Vercel API Routes):
- `/app/api/agent/` - Agent SDK orchestrator
- `/lib/tools/` - Deterministic Tool definitions (Zod schemas)
- `/lib/db/` - Supabase client singleton

**AI Layers**:
- LLM reasoning layer (creative) - Claude 4.5 Sonnet
- Tool execution layer (deterministic) - Agent SDK Skills

**Media** (Phase 3+):
- Voice ingestion (Web Speech API)
- Photo ingestion (OCR pipeline)

---

## AI Modes
### Creative Mode
Used for:
- Meal planning
- Recipe discovery
- Dietary reasoning
- Web research
- Scheduling optimization

### Deterministic Mode
Used for:
- CRUD operations
- OCR imports
- Calendar writes
- Grocery list generation

Mode switching is enforced by code, not prompt discipline.
