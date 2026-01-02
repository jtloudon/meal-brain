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
  - Auth (magic-link with PKCE, household isolation)
  - Storage (recipe images - Phase 3+, OCR inputs - Phase 5)
    - Recipe images stored with `image_url` field in recipes table
    - Supports user uploads (JPEG, PNG, WebP, HEIC)
    - External URLs also supported (for imported recipes)
  - **Auth Pattern**: Server-side callback route (`app/auth/callback/route.ts`)
    - Uses Next.js Route Handler with `createServerClient`
    - Handles PKCE code exchange with cookie-based session storage
    - Avoids client-side PKCE verifier storage issues
    - Redirects based on user state (onboarding vs authenticated home)

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

**Recipe Import** (Phase 3 - Complete):
- URL-based import from recipe websites
  - POST /api/recipes/import endpoint
  - JSON-LD schema.org Recipe parsing (industry standard)
  - Heuristic fallback for non-standard sites
  - Extracts: title, ingredients, instructions, notes, times, serving size, image URL, source
  - Section header filtering (removes grouping headers from ingredients)
  - Serving size normalization (handles international formats)
  - Flexible ingredient parsing (handles non-standard formats with fallback)
  - Preserves special characters in ingredient names (hyphens, fractions)

**Media**:
- Recipe images (Phase 3 - in progress):
  - User upload from device (JPEG, PNG, WebP, HEIC)
  - External URL support (imported recipes)
  - Stored in Supabase Storage bucket
- Voice ingestion (Phase 5+):
  - Web Speech API for voice input
- Photo ingestion (Phase 5+):
  - OCR pipeline for recipe extraction from images

---

## UI/UX & Branding Architecture

**Brand Identity** (Implemented 2026-01-02):
- **Primary Color**: Orange (#f97316) - "hero orange"
- **Brand Icon**: Chef's hat (SVG, 40px)
- **Brand Name**: "MealBrain" (single word, white text on orange)
- **Tagline**: "An AI sous chef you control - helpful, never bossy"

**Visual Continuity Pattern**:
1. **Splash Screen** (2.5 seconds):
   - Orange background, chef's hat icon, MealBrain title, tagline
   - Subtle zoom animation (scale 0.95 → 1.0)
   - Sets brand expectations before app loads
2. **Login Page**:
   - Same orange background, chef's hat, MealBrain title
   - Minimal design: transparent input with white underline
   - Pill-shaped button with subtle semi-transparent white background
   - Icon and title positioned identically to splash (seamless transition)
3. **Authenticated Pages**:
   - Orange navigation bar (bottom) with white icons
   - Floating chef's hat AI button (bottom-right, 60px FAB)
   - Clean white content areas

**Branding Rationale**:
- Chef's hat = AI sous chef (brand + AI trigger)
- Orange = warmth, food, energy (consistent throughout)
- Minimal design = mobile-first, reduces friction
- Icon continuity = splash → login → AI panel

**AI Panel Design** (Future):
- Trigger: Floating chef's hat button (all authenticated pages)
- Interaction: Tap to expand chat panel from bottom
- Visual: Same orange branding, slides over content
- Purpose: AI assistant for meal planning, recipe suggestions, grocery help

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
