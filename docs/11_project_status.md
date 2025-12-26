# Project Status

## Snapshot
This document represents the current, authoritative state of the project.
All implementation, planning, and AI behavior should align with this reality.

---

## Overall Project Maturity
**Status:** Phase 2 In Progress - Meal Planner Mostly Complete ✅
**Code exists:** Infrastructure + pure functions + database + **All 9 Tools** + Working Auth Flow + **Recipe UI (Full CRUD)** + **Meal Planner (Week View + Add Meals)**
**Phase:** Phase 1 ✅ → Phase 2 (Tools ✅ → UI Scaffolding ✅ → Recipe Screens ✅ → Recipe Forms ✅ → Meal Planner ✅ → Polish next)

---

## Spec Completeness
**Assessment:** Mostly complete, minor gaps remain

Notes:
- Approximately a dozen spec files exist
- Core decisions around AI behavior, data ownership, workflows, and UI patterns are defined
- Remaining work is consolidation, polish, and execution planning

---

## Architecture Confidence
**Level:** Confident, only minor adjustments expected

Current direction:
- Responsive web application
- Serverless-compatible architecture
- Intended stack: Supabase + Vercel
- AI agent with deterministic tools + creative reasoning

Architecture is not fully locked but large shifts are not anticipated.

---

## UI / UX Definition
**Level:** Wireframes and visual direction mostly defined

Characteristics:
- Mobile-first responsive design
- Bottom navigation with iconography (calendar, recipes, groceries, chat)
- Clean, modern, mostly white, flat aesthetic
- Focus on simplicity over density

High-fidelity designs do not yet exist.

---

## AI Behavior & Governance
**Maturity:** Well-defined and intentional

Status:
- Clear separation of deterministic vs creative AI behavior
- Explicit autonomy boundaries
- Transparent memory and learning rules
- User-selectable AI role (Coach vs Collaborator)
- Failure handling and uncertainty policies defined

Specs are strong but not yet exercised in code.

---

## Implementation Progress
**Status:** Step 3 (Supabase Setup) Complete

**Completed (Step 0 - Skeleton)**:
- ✅ Repository structure established
- ✅ Folder structure created (cloud-ready)
- ✅ TypeScript configuration
- ✅ Basic package.json
- ✅ Demo data strategy (supabase/seed.sql)
- ✅ User onboarding data model added

**Completed (Step 1 - Infrastructure)**:
- ✅ All dependencies installed (Next.js, React, TypeScript, Vitest, Playwright, Tailwind, Supabase client)
- ✅ Next.js configured (next.config.js)
- ✅ Tailwind CSS configured (v4 with @tailwindcss/postcss)
- ✅ Vitest configured (vitest.config.ts)
- ✅ Environment variables template (.env.local.example)
- ✅ Minimal app layout and page (dev server verified working)

**Completed (Step 2 - TDD - Pure Functions)**:
- ✅ quantity-math module (5/5 tests passing)
  - Implemented addQuantities + isValidQuantity
  - 100% coverage
- ✅ ingredient-aggregation module (6/6 tests passing)
  - Implemented shouldMerge, mergeIngredients, aggregateIngredients, aggregateWithSources
  - Handles merging rules (same id, unit, prep_state)
  - Preserves source traceability
  - 100% coverage

**Completed (Step 4 - Tool Integrations)**:
- ✅ Supabase client configured (service role key for tests)
- ✅ Environment variable setup (.env.local with test/prod keys)
- ✅ recipe.create Tool (4/4 tests passing)
  - Zod schema validation for recipe input
  - Ingredient validation (15 valid units)
  - Database writes with RLS enforcement
  - Proper error handling (VALIDATION_ERROR vs DATABASE_ERROR)
  - Canonical ingredient dictionary integration
  - 100% coverage
- ✅ planner.add_meal Tool (5/5 tests passing)
  - Zod schema validation (recipe_id, date, meal_type)
  - Date format validation (YYYY-MM-DD)
  - Recipe existence check with household isolation
  - Supports duplicate meals on same date
  - Proper error handling (VALIDATION_ERROR vs NOT_FOUND vs DATABASE_ERROR)
  - 100% coverage
- ✅ grocery.push_ingredients Tool (4/4 tests passing)
  - Zod schema validation (grocery_list_id, ingredients array)
  - Fetches existing items and merges by ingredient_id + unit
  - Deterministic merging: same unit = merge, different unit = separate items
  - Returns items_added and items_merged counts
  - Grocery list existence check with household isolation
  - Proper error handling (VALIDATION_ERROR vs NOT_FOUND vs DATABASE_ERROR)
  - 100% coverage
- ✅ Database schema updated (removed unique constraint on planner_meals to allow duplicates)
- ✅ Test progress tracker updated
- ✅ **24/58 total tests passing (41% overall, 73% unit, 48% tools)**

**Completed (Step 3 - Supabase)**:
- ✅ Docker Desktop installed and running
- ✅ Supabase CLI installed (v2.67.1)
- ✅ Supabase project initialized
- ✅ Initial migration created (20251223161521_initial_schema.sql)
  - All 9 core tables defined (households, users, user_preferences, recipes, recipe_ingredients, ingredients, planner_meals, grocery_lists, grocery_items)
  - Row Level Security (RLS) enabled with household isolation policies
  - Indexes created for common queries
  - Update triggers for timestamp fields
- ✅ Seed data updated to match schema
- ✅ Local Supabase instance running successfully
- ✅ Database connection verified
- ✅ Seed data loaded (3 recipes, 1 household, demo users)

**Completed (Step 5 - Auth Infrastructure ✅ COMPLETE)**:
- ✅ Playwright E2E testing configured
- ✅ @supabase/ssr package installed for Next.js App Router
- ✅ Supabase auth client utilities created:
  - Client-side: `lib/auth/supabase-client.ts` (cookie-based, anon key)
  - Server-side: `lib/auth/supabase-server.ts` (cookie-based, anon key)
- ✅ Server-side callback route (`app/auth/callback/route.ts`)
  - Uses `createServerClient` with proper cookie handling
  - Handles PKCE code exchange server-side
  - Redirects based on user state (onboarding vs planner)
- ✅ Authentication pages implemented:
  - `/login` - Email input with magic-link request
  - `/auth/callback` - Server-side route handler
  - `/onboarding` - Household creation for new users
  - `/planner` - Authenticated home with logout
- ✅ Server action pattern for authenticated writes (`app/onboarding/actions.ts`)
  - **Solution**: Uses service role key for DB writes (bypasses RLS safely)
  - Validates user authentication first (security preserved)
  - Pattern: Verify auth → Use elevated privileges for trusted operations
- ✅ RLS policies updated:
  - Household creation policy targets `authenticated` role
  - Two migrations applied: `20251223161521_initial_schema.sql`, `20251226103741_fix_household_creation_policy.sql`
- ✅ E2E test helpers created:
  - Mock email service with Mailpit integration
  - Database seeding utilities
- ✅ E2E authentication tests: **2/4 passing**
  - ✅ New user completes magic-link flow
  - ✅ Returning user logs in directly
  - ⏳ Expired token shows error (edge case)
  - ⏳ Reused token is rejected (edge case)
- ✅ Supabase SMTP configured for local email capture (Mailpit on port 54324)
- ✅ **Auth flow works end-to-end** (manual + automated tests)

**Completed (Phase 2 - All Tools ✅)**:
- ✅ All 9 Tools implemented with 100% test coverage (27/27 tests passing)
  - Recipe: create, list, update
  - Planner: add_meal, remove_meal, list_meals
  - Grocery: push_ingredients, create_list, add_item
- ✅ Backend API layer complete and validated

**Completed (Phase 2 - UI Scaffolding ✅)**:
- ✅ Bottom tab navigation (4 tabs: Planner, Recipes, Groceries, Settings)
- ✅ AuthenticatedLayout component (auth check, header, logout)
- ✅ Placeholder screens for all tabs
- ✅ Mobile-first responsive design (viewport meta, proper spacing)
- ✅ Supabase client configured (service role key for Tools, bypasses RLS with app-level authz)

**Completed (Phase 2 - Recipe Screens ✅)**:
- ✅ Recipe list screen (`/recipes`)
  - Card grid with title, tags, star ratings
  - Real-time search by title
  - Empty state handling
  - Click to navigate to detail
  - Plus button wired to create form
- ✅ Recipe detail screen (`/recipes/[id]`)
  - Full recipe display (title, rating, tags, notes)
  - Ingredients list with checkboxes (for shopping reference)
  - Instructions section (collapsible)
  - Edit button wired to edit form
  - Action buttons (Add to Planner, Push to Grocery - placeholders)
- ✅ API routes
  - GET `/api/recipes` - list with search/filters
  - GET `/api/recipes/[id]` - single recipe with ingredients
  - POST `/api/recipes` - create new recipe
  - PUT `/api/recipes/[id]` - update existing recipe
- ✅ Instructions column added to database schema

**Completed (Phase 2 - Recipe Forms ✅)**:
- ✅ Recipe create form (`/recipes/new`)
  - Title, rating (star selector), tags, notes, instructions fields
  - Dynamic ingredient builder (add/remove ingredients)
  - Unit selector with all 15 valid units
  - Form validation and error handling
  - Navigation from Plus button and empty state
  - **Bug fix**: Instructions now properly saved to database (lib/tools/recipe.ts:145)
- ✅ Recipe edit form (`/recipes/[id]/edit`)
  - Pre-populated with existing recipe data
  - Same form UI as create
  - Update ingredients (full replace)
  - Navigation from Edit button on detail screen
- ✅ Full CRUD flow working end-to-end

**Completed (Phase 2 - Meal Planner UI ✅)**:
- ✅ Week view planner (`/planner`)
  - 7-day calendar with prev/next navigation
  - Grid layout: breakfast, lunch, dinner, snack per day
  - Today's date highlighted
  - Empty state with CTA
  - Real-time meal display with recipe details
- ✅ Add meal flow (`/planner/add`)
  - Step 1: Select recipe (with search)
  - Step 2: Pick date + meal type
  - All 4 meal types supported (breakfast, lunch, dinner, snack)
- ✅ API routes
  - GET `/api/planner` - List meals for date range
  - POST `/api/planner` - Add meal to planner
  - Better error messages for auth issues

**Completed (Database & Infrastructure ✅)**:
- ✅ Migrations consolidated into single schema file
  - Removed 2 subsequent migration files
  - Single source of truth for database schema
  - Includes 'snack' meal type from the start
  - Fixed household creation policy (TO authenticated)
- ✅ Enhanced error handling
  - Actionable error messages for auth failures
  - Console logging for debugging
  - User-friendly guidance ("log out and log back in")

**Next Steps**:
- Remove meal functionality (click to delete)
- Grocery list UI (list selector, items, check off)
- Wire up action buttons (Add to Planner, Push to Grocery from recipe detail)
- Polish and refinements

**Not Started**:
- Agent SDK integration
- UI polish and components
- Additional Tool integrations (recipe.list, recipe.update, etc.)

---

## External Services Readiness
**Status:** Local development environment fully operational

- ✅ GitHub repository exists (local only, not pushed yet)
- ✅ Supabase local running (Docker containers)
  - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
  - Studio: http://127.0.0.1:54323
  - API: http://127.0.0.1:54321
- ⏳ Vercel project (Phase 5+)

**Cloud Deployment Strategy Decided**:
- Agent SDK will run in Vercel API routes (not Supabase Edge Functions)
- Simpler deployment: Single Vercel project handles frontend + backend
- Supabase Cloud only for database + auth

---

## Hosting & Deployment Intent
**Current belief:** Local-first development, cloud later

Details:
- Day-to-day development will be local
- Architecture assumes eventual Supabase + Vercel deployment
- Cloud infrastructure will be introduced once core functionality is validated

This decision is revisitable.

---

## Privacy & Access Scope
**Audience:** Private household only (user + spouse)

Implications:
- Simple auth model
- No public access
- No multi-tenant complexity
- Focus on trust and reliability

---

## Data Importance
**Criticality:** Mission-critical

Rationale:
- Primary motivation is long-term ownership of data
- Must not be locked into vendors
- Requires:
  - Backups
  - Export paths
  - Migration safety
  - No silent data loss

---

## Initial Build Priority
**Primary focus:** Core CRUD

Order of importance:
1. Recipes
2. Meal planner
3. Grocery lists
4. Data integrity

AI experience is expected to feel “magic” once this foundation exists.

---

## Biggest Known Risk
**Risk:** Technical uncertainty (stack, hosting, auth)

Mitigation approach:
- Start with local-first development
- Introduce cloud infrastructure incrementally
- Avoid premature optimization
- Keep specs authoritative and current

---

## Summary
This project is intentionally paused at the planning boundary.
The goal is to:
- Reduce rework
- Preserve momentum
- Enable AI-assisted implementation without confusion

This file should be reviewed before any major build step.
