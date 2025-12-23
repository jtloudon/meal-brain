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
Frontend:
- Vercel

Backend (serverless):
- Supabase
  - Postgres
  - Auth (household-only)
  - Storage (images, OCR inputs)
  - Edge Functions (SKILL runtime)

AI Orchestrator:
- Vercel API route or Supabase Edge Function

---

## Major Components
- Web UI (recipes, planner, groceries)
- Persistent AI chat panel
- LLM reasoning layer (creative)
- SKILL execution layer (deterministic)
- Media ingestion pipeline (voice + photos)

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
