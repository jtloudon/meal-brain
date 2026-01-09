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
  - Auth (magic-link + password with PKCE, household isolation)
  - Storage (recipe images)
    - Recipe images stored with `image_url` field in recipes table
    - Client-side compression (max 1024px, 80% quality) prevents payload errors
    - Supports user uploads (JPEG, PNG, WebP, HEIC)
    - External URLs also supported (for imported recipes)
  - **Auth Pattern**: Server-side callback route (`app/auth/callback/route.ts`)
    - Uses Next.js Route Handler with `createServerClient`
    - Handles PKCE code exchange with cookie-based session storage
    - Dual storage strategy: cookies (browser) + localStorage (PWA)
    - Middleware refreshes sessions on every request (SSR compatible)
    - Redirects based on user state (onboarding vs authenticated home)
  - **Password Reset**: Supabase `resetPasswordForEmail()` → `/settings/password`
  - **Invitation System**: Household invite codes for controlled access (see Security section)

  - **Safari iOS PKCE Issue (Added 2026-01-07, Fixed 2026-01-09)**:
    - **Problem**: Magic links fail on Safari iOS for new users
      - Safari's "Prevent Cross-Site Tracking" blocks cross-site cookies during first auth
      - Mail app opens links in Safari View Controller (isolated from Safari browser cookies)
      - PKCE code verifier cannot be retrieved → authentication fails
    - **Solution**: Password-based signup for invited users
      - New page: `/signup` with password creation form
      - Invite flow: onboarding → signup (with invite) → direct auth → callback → auto-join
      - No email redirect, no PKCE cross-context issue
      - Styled to match login page (orange background, pill inputs, brand consistency)
    - **Why Not Fix PKCE?**: No reliable way to share storage between Safari contexts on iOS
    - **Magic Links Still Work For**:
      - Existing users (established sessions, middleware refresh)
      - Desktop browsers (no cross-context issues)
      - Password reset (handled separately if needed)

  - **Email Confirmation + Invite Code Persistence (Added 2026-01-09)**:
    - **Problem**: Email confirmations enabled in production → Safari opens link in new tab → PKCE fails → invite code lost
    - **Solution**: Dual-storage strategy for invite codes
      1. **User Metadata Storage**: Invite code saved to `user.user_metadata.invite_code` during signup
         - Persists in Supabase auth.users table
         - Survives email confirmation, PKCE failures, new tabs
         - Backup if URL parameter lost
      2. **URL Parameter Preservation**: When PKCE fails, redirect to `/login?invite=XXX` (not just `/login`)
         - Login page sees invite code → passes to callback after successful auth
         - Primary flow for invite processing
      3. **Callback Fallback**: Auth callback checks URL first, then user metadata
         - Handles both successful PKCE and manual login scenarios
    - **Security**: Email confirmations stay enabled (prevents DDOS), invite codes still required for household access
    - **User Flow**:
      - Click invite link → validate code → signup with email/password
      - Invite code stored in metadata + URL parameter
      - Receive email confirmation → click link → Safari opens new tab
      - PKCE fails → redirect to `/login?invite=XXX`
      - Enter password → login redirects to `/auth/callback?invite=XXX`
      - Callback processes invite (from URL or metadata) → joins household
    - **Files**: `app/signup/page.tsx` (metadata storage), `app/auth/callback/route.ts` (dual check + URL preservation)

**AI Orchestrator**:
- **Decision**: Vercel API Routes (chosen over Supabase Edge Functions)
- **Location**: `/app/api/agent/route.ts`
- **Rationale**:
  - Simpler deployment (one project, not two)
  - Perfect for 2-user household scale
  - Serverless on Vercel (pay per request)
  - Easy to migrate to Edge Functions later if needed

---

## Security Architecture

### Invitation-Only Access (Added 2026-01-07)

**Problem**: Open signup allows anyone to use deployed app resources and data.

**Solution**: Invitation-only system with household invite codes.

**User Flow**:
1. Existing household member → Settings → Invite Members
2. Generate 8-character alphanumeric code (excludes confusing: 0,O,1,I,L)
3. System creates shareable link: `https://app.com/onboarding?code=ABC12XYZ`
4. New user clicks link → validates code → prompted to login/signup
5. After authentication → joins household automatically
6. Codes tracked: usage count, expiration (30 days), creator

**Database Schema**:
```sql
household_invites (
  id UUID, household_id UUID, invite_code TEXT UNIQUE,
  created_by UUID, created_at, expires_at,
  max_uses INT, use_count INT, notes TEXT
)

household_invite_uses (
  id UUID, invite_id UUID, used_by UUID, used_at
)
```

**RLS Policies**:
- `anon` users can SELECT (validation must work before signup)
- `authenticated` users can INSERT/DELETE for their household only
- `use_invite_code()` function requires authentication to actually consume codes

**Security Benefits**:
- Prevents unauthorized access to deployment
- Each household controls their own member invitations
- Codes can be single-use or multi-use (configurable)
- Expired/fully-used codes automatically rejected
- Public GitHub repo safe (no open signup vulnerability)

**API Endpoints**:
- `POST /api/invites` - Create invite (authenticated)
- `GET /api/invites` - List household invites (authenticated)
- `POST /api/invites/validate` - Validate code (public)

---

## AI-Powered Grocery Categorization (Added 2026-01-07)

### Learning Cache System

**Problem:** Grocery items need accurate categorization, but calling Claude API for every item is expensive.

**Solution:** Cache-first categorization with progressive learning.

### Architecture

**Three-Step Flow:**
1. **Check Cache** (`category_mappings` table)
   - Query by normalized item name
   - If found → Return cached category (FREE, instant)
   - Update usage statistics

2. **Call Claude API** (if cache miss)
   - Uses Claude Haiku (fast, cheap model)
   - Provides user's actual shopping categories
   - Single-shot prompt: categorize item
   - Cost: ~$0.001 per item

3. **Save to Cache**
   - Store normalized name → category mapping
   - Shared across all users (universal knowledge)
   - Future requests for same item → cache hit

### Database Schema

**`category_mappings` Table:**
```sql
- id: UUID
- item_name_normalized: TEXT UNIQUE (e.g., "plums")
- category: TEXT (e.g., "Produce")
- times_used: INTEGER (popularity tracking)
- last_used_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

**Functions:**
- `normalize_item_name(TEXT)` - Lowercase, remove parentheses, trim
  - Example: "Plums (honey?)" → "plums"
- `get_suggested_category(TEXT)` - Check cache, update stats
- `save_category_mapping(TEXT, TEXT)` - Store learned mapping

### API Endpoints

**POST `/api/grocery/categorize`:**
- Input: `{ itemName: string }`
- Output: `{ category: string, source: 'cache' | 'claude' | 'error' }`
- Used internally by item creation endpoint

**POST `/api/grocery/items`:**
- Auto-categorizes if category not provided or is "Other"
- Validates Claude's suggestion against user's categories
- If unknown category → adds note: "AI suggested: 'CategoryName' (add via Settings)"
- Falls back to "Other" gracefully

### Cost Economics

- **Week 1**: ~$1 (learning common items)
- **Month 2**: ~$0.10 (90% cache hits)
- **Month 6+**: ~$0.01 (99% cache hits)

**Example:**
- First "Plums" → Claude API ($0.001) → Saved to cache
- Next "plums" / "PLUMS" / "Plums (honey?)" → Cache hit (FREE)

### User Control

- User manages categories via Settings → Shopping Categories
- Claude learns ONLY from user's actual categories
- Unknown suggestions → noted on item, user decides whether to add category
- Categories fetched from `/api/settings/shopping-categories` (single source of truth)

### Benefits

1. **Cost Efficiency**: API calls decrease exponentially over time
2. **Speed**: Cache hits are instant
3. **Consistency**: Same items always get same categories
4. **Shared Learning**: All users benefit from cached mappings
5. **User Autonomy**: User controls final category list

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

## Grocery List UX Architecture (Added 2026-01-09)

### Out-of-Stock Marking System
**Problem:** Users need to distinguish between "in cart" (ready to check out) vs "out of stock" (store doesn't have it).

**Solution:** Dual-state item tracking with visual icons.

**UI Design:**
- **In Cart**: Orange checkbox (20px) next to item
- **Out of Stock**: Filled thumbs-down icon (20px, gray default, red when marked)
  - Always visible (not just when marked)
  - Filled icon for better mobile visibility
  - Color changes: Gray (#d1d5db) → Red (#ef4444)

**Database:**
- `grocery_items.out_of_stock` BOOLEAN column
- Separate from `checked` state
- Indexed for query performance

### Mobile-First Density Optimizations
**Goal:** Match iOS native app density (e.g., iOS Mail reference design)

**Header Spacing:**
- Reduced header padding from py-3 (12px) to py-2 (8px)
- Removed all top padding from list name area
- Sticky headers with minimal padding (4px)

**Edit Meal Modal:**
- Reduced date input padding from 12px to 8px
- Date input width: 50% (matches meal type button grid)
- All section margins: 12px → 10px
- All label margins: 8px → 6px
- Notes textarea: 3 rows → 2 rows with minHeight 60px
- Delete button: 40px bottom margin for scroll accessibility
- Fixed scroll issue: maxHeight → height + WebkitOverflowScrolling

**Grocery List Enhancements:**
- **Select All**: Positioned below action buttons, iOS Mail style
  - 18px checkbox with 2px border
  - 14px checkmark with 3.5 strokeWidth for visibility
  - 11px gray text (#9ca3af)
- **Thumbs Down Icon**: 24px container, 20px filled icon (matches checkbox height)
- **Minimal whitespace**: Zero padding at list name, reduced throughout

**Design Philosophy:**
- Every pixel matters on mobile
- Actions visible without scrolling
- iOS-native feel and density
- Accessible touch targets (44x44px minimum for buttons)

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
