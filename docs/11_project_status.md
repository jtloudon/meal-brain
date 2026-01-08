# Project Status

## Snapshot
This document represents the current, authoritative state of the project.
All implementation, planning, and AI behavior should align with this reality.

---

## Overall Project Maturity
**Status:** Phase 5 Production Security - FUNCTIONAL ✅ (Invitation-Only Access)
**Code exists:** Infrastructure + pure functions + database + **All Tools (Read + Write)** + Working Auth Flow (Magic Link + Password Reset + Dev-Login) + **Recipe UI (Full CRUD)** + **Meal Planner (Apple Calendar Style + Add/Edit Modal + AI Integration)** + **Grocery List (Full CRUD + Rename + Delete + Clear Checked)** + **Settings (Preferences + Shopping Categories + Invite Members + Password Reset)** + **Action Buttons (All Working)** + **Splash Screen** + **Branded Login** + **Orange Navigation** + **Floating AI Button (Chef's Hat FAB)** + **User Onboarding (6-step preferences flow + Invite Code Validation)** + **Seed Data (Example recipes + Default list)** + **AI Chat Panel (Full-Featured - Floating design, white AI bubbles, batch approval for write ops, real-time calendar refresh, date context awareness, HTML entity decoding, recipe linkification, New Chat button)** + **Invitation System (Household invite codes, expiration, usage tracking)**
**Phase:** Phase 1 ✅ → Phase 2 ✅ → Phase 3 ✅ → Phase 4 (AI Integration) ✅ → **Phase 5 (Production Security) - COMPLETE** ✅
**Last Updated:** 2026-01-07 (Morning - Invitation system + Password reset + PWA session persistence)

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
**Level:** Brand identity established, high-fidelity implementation complete ✅

**Brand Identity** (Implemented 2026-01-02):
- **Primary Color**: Orange (#f97316) - "hero orange"
- **Brand Icon**: Chef's hat (40px SVG) = AI sous chef
- **Brand Name**: "MealBrain" (single word)
- **Tagline**: "An AI sous chef you control - helpful, never bossy"

**Visual System**:
- Mobile-first responsive design (375px-667px optimized)
- Orange navigation bar (bottom) with white icons
- Splash screen (2.5s) with chef's hat, subtle zoom animation
- Branded login page with minimal design (transparent input, white underline)
- Floating chef's hat AI button (bottom-right FAB, 60px)
- Clean white content areas with orange accents
- Icon continuity: splash → login → AI panel

**Design Philosophy**:
- Warmth and approachability (orange)
- Minimal friction (clean, simple inputs)
- Brand consistency (chef's hat throughout)
- Mobile-optimized touch targets

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
- ✅ All 12 Tools implemented with 100% test coverage (34/34 tests passing)
  - Recipe: create, list, update
  - Planner: add_meal, remove_meal, list_meals
  - Grocery: push_ingredients, create_list, add_item, check_item, list_lists, get_list
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

**Completed (Phase 2 - Grocery List UI ✅)**:
- ✅ Grocery list view (/groceries page)
- ✅ List selector dropdown
- ✅ Items display with check/uncheck
- ✅ API routes (list_lists, get_list, check_item)
- ✅ Mobile-first responsive design

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

**Completed (E2E Testing ✅)**:
- ✅ E2E test infrastructure working (Playwright)
- ✅ **25/25 E2E tests passing (100% coverage)** 🎉
  - ✅ Recipe **full CRUD** (7/7 tests, 100%): list, search, filter, detail, create, edit, **delete**
  - ✅ Meal planner CRUD (5/5 tests, 100%): view, navigate, add meal, **remove meal**
  - ✅ Grocery list CRUD (6/6 tests, 100%): create list, add items, check/uncheck, push from recipes
  - ✅ Authentication flow (new user, returning user)
  - ✅ Auth edge cases (3/3 tests): expired/reused tokens
- ✅ **TDD workflow established**: Write test → Implement → Pass → Commit
- ✅ **Bug fixed**: Seed data UUIDs were invalid per RFC 4122 (Zod .uuid() validation)
- ✅ **Bug fixed**: Database not seeded → Fixed with `supabase db reset`

**Completed (Grocery Action Buttons ✅ 2025-12-27)**:
- ✅ "New List" button + modal (create grocery lists)
- ✅ "Add Item" button + modal (quantity/unit selector)
- ✅ "Add to Planner" navigation from recipe detail
- ✅ "Push Ingredients to Grocery" with list selector modal
- ✅ API endpoint for push_ingredients
- ✅ AuthenticatedLayout wrapper on groceries page
- ✅ React key warning fixed (API returns full objects)
- ✅ All 6/6 action button E2E tests passing

**Completed (Dev-Login Fix ✅ 2025-12-27)**:
- ✅ Fixed /dev-login implementation with real Supabase session tokens
- ✅ Replaced custom cookie with `signInWithPassword()` + `setSession()`
- ✅ All 3 dev users work (demo, spouse, test)
- ✅ API calls succeed, RLS policies work correctly
- ✅ 3/3 dev-login E2E tests passing
- ✅ Added user email to header for user visibility

**Completed (Phase 3 - Move Items Feature ✅ 2025-12-28)**:
- ✅ Move grocery items between lists
  - ✅ UI dropdown control on each grocery item ("Move to..." selector)
  - ✅ API endpoint: PATCH /api/grocery/items/[id]
  - ✅ Updates grocery_items.grocery_list_id
  - ✅ Item state (checked/unchecked, quantity, unit) preserved during move
  - ✅ E2E test passing (action-buttons.spec.ts)
  - ✅ TDD workflow: Red → Green → Refactor

**Completed (Phase 3 - Grocery List Redesign ✅ 2025-12-29)**:
- ✅ Recipe source tracking for grocery items
  - ✅ Database migration: Added source_recipe_id and prep_state columns to grocery_items
  - ✅ Foreign key to recipes table with ON DELETE SET NULL
  - ✅ Index created on source_recipe_id for query performance
- ✅ Enhanced API endpoints
  - ✅ GET list: Now JOINs with recipes table to return recipe names
  - ✅ PATCH item: Expanded to edit quantity, unit, display_name, and list
  - ✅ DELETE item: New endpoint to delete grocery items
  - ✅ pushIngredients: Now stores source_recipe_id and prep_state
- ✅ Redesigned grocery list UI
  - ✅ Larger checkboxes (w-7 h-7) for mobile-friendly tapping
  - ✅ Display format: "quantity unit name" (e.g., "1.5 lb chicken breast")
  - ✅ Clickable "from [Recipe Name]" links in orange color
  - ✅ Strikethrough styling when items checked
  - ✅ Pencil icon edit button per item
- ✅ Edit modal with full CRUD
  - ✅ Edit item name, quantity, and unit
  - ✅ Move item to different list via dropdown
  - ✅ View source recipe (read-only with clickable link)
  - ✅ Delete item with confirmation
  - ✅ Save/Cancel buttons with loading states
- ✅ Recipe integration
  - ✅ When pushing ingredients from recipes, source_recipe_id is tracked
  - ✅ Separate line items for same ingredient from different recipes
- ✅ Updated canonical plan and documentation
  - ✅ Data models updated with new grocery_items schema
  - ✅ Implementation plan updated with completion status

**Completed (Phase 3 - Recipe Import Feature ✅ 2025-12-30)**:
- ✅ Recipe import from URL
  - ✅ Backend API route: POST /api/recipes/import
  - ✅ JSON-LD schema.org Recipe parsing (most common format)
  - ✅ Heuristic fallback parsing for non-standard sites
  - ✅ Section header filtering ("Sauce", "Main", etc.)
  - ✅ Serving size normalization ("4,4" → "4", mixed fractions)
  - ✅ Flexible ingredient parsing with fallback
  - ✅ Hyphen handling in ingredient names (e.g., "low-sodium", "1-inch")
- ✅ Frontend integration
  - ✅ Import modal on recipes page with URL input
  - ✅ Flexible ingredient parser handles non-standard formats
  - ✅ Console logging for debugging parse issues
  - ✅ Error handling for failed imports
- ✅ Display improvements
  - ✅ Removed hyphen-based section parsing from recipe detail page
  - ✅ All ingredients shown in single list (preserves hyphens)
  - ✅ Added helpful tip: "View original for ingredient groupings"
  - ✅ Tip only shows for imported recipes (those with source URL)
- ✅ Bug fixes
  - ✅ Fixed ingredient parsing to preserve "low-sodium", "1-inch", etc.
  - ✅ Fixed serving size format issues (European decimals)
  - ✅ Prevented section headers from being treated as ingredients
  - ✅ Added fallback for ingredients that don't match standard format

**Completed (Phase 3 - UI Polish 2025-12-29)**:
- ✅ Bottom navigation refinement
  - ✅ All icons orange by default (#f97316)
  - ✅ Selected tab has faint orange background (10% opacity)
  - ✅ Removed text labels (icon-only for cleaner mobile UX)
  - ✅ Increased icon size for better visibility
  - ✅ Added aria-labels for accessibility
- ✅ Recipe page header
  - ✅ Replaced "Demo Household" with "🍳 Meal Brain"
  - ✅ Clean, branded header design
- ✅ Meal type tracking
  - ✅ Database migration: Added meal_type column to recipes
  - ✅ Zod schemas updated to allow null values
  - ✅ UI: Meal type selector in recipe forms (breakfast, lunch, dinner, snack)
  - ✅ Pill filters on recipes page by meal type
  - ✅ Test coverage: 5 new unit tests for meal_type CRUD
- ✅ Seed data enhancements
  - ✅ Second grocery list added: "Pantry Staples"
  - ✅ Recipes include meal_type values

**Completed (Phase 3 - Grocery List UX Overhaul ✅ 2025-12-29)**:
- ✅ MealBrain branding
  - ✅ "MealBrain" as single word with larger font (24px, bold 700)
  - ✅ Light orange pill background (#fff7ed) for visual distinction
  - ✅ Applied across grocery and recipe pages
- ✅ Grocery list page redesign
  - ✅ Clickable list name with dropdown arrow (replaces always-visible dropdown)
  - ✅ List selector modal (mobile-friendly)
  - ✅ "Add Item" and "New List" as orange text buttons in header
  - ✅ Inline add item form (shows below button, not modal)
  - ✅ Form layout: quantity/unit on top row, item name on second row
  - ✅ Orange "Add" button (matches brand)
- ✅ New List page
  - ✅ Full-page view at /groceries/new
  - ✅ Matches edit item UX pattern
  - ✅ Cancel/Create header buttons
- ✅ Edit item enhancements
  - ✅ Added quantity and unit fields
  - ✅ Added list selector (move items between lists)
  - ✅ Mobile-friendly delete confirmation modal (no browser confirm dialog)
- ✅ Visual improvements
  - ✅ Better spacing between items (14px padding, accommodates recipe sources)
  - ✅ Improved alignment (checkbox, text, pencil icon)
  - ✅ Recipe source links visible and styled
  - ✅ Removed horizontal borders between items
  - ✅ 80px bottom padding (prevents nav bar overlap on long lists)
- ✅ Bug fixes
  - ✅ Push ingredients error fixed (prep_state null handling)
  - ✅ Proper spacing with recipe source links

**Completed (Phase 3 - Settings System ✅ 2025-12-29)**:
- ✅ Settings main page
  - ✅ Grouped sections (Preferences, App Settings, Data, About)
  - ✅ Navigation to all sub-pages
  - ✅ MealBrain branding throughout
- ✅ AI Preferences (full implementation)
  - ✅ Household context (just-me, couple, family)
  - ✅ Dietary constraints (multi-select with custom additions)
  - ✅ AI collaboration style (coach vs collaborator)
  - ✅ Planning preferences (multi-select)
  - ✅ AI learning toggle
  - ✅ API endpoint: GET/PUT /api/user/preferences
  - ✅ Full CRUD with database persistence
- ✅ Shopping List category management
  - ✅ Simplified (removed unnecessary toggles)
  - ✅ Add/delete custom categories
  - ✅ 12 default categories (Produce, Meat & Seafood, Dairy & Eggs, etc.)
  - ✅ API endpoint: GET/PUT /api/settings/shopping-categories
  - ✅ Categories stored in user_preferences.shopping_categories
- ✅ Auto-categorization system
  - ✅ Utility with 200+ keywords across 11 categories
  - ✅ Automatic ingredient categorization by name matching
  - ✅ Fuzzy/partial matching algorithm
  - ✅ Integrated with ingredient creation
  - ✅ Grocery items inherit category from linked ingredient
  - ✅ No more "Other" for common ingredients
- ✅ Database updates
  - ✅ Migration: shopping_categories JSONB column
  - ✅ Seed data includes categories for all ingredients
  - ✅ Single source of truth for category definitions
- ✅ Placeholder pages (About, Help, Meal Planner, Import/Export)

**Next Steps (Phase 3 - Polish & Features)**:
1. **Remaining Settings Pages**
   - Meal planner settings (week start day, default meal times)
   - About page (version, credits, links)
   - Help page (user guide, FAQ)
   - Import/Export functionality
2. **UI/UX Polish**
   - Mobile responsiveness testing
   - Loading states
   - Error handling improvements
   - Accessibility audit (keyboard navigation)

**Auth Architecture (Updated 2025-12-27)**:
- THREE separate flows: Production (magic link ✅), Development (/dev-login ✅), Testing (programmatic ✅)
- ONE Demo Household, ONE Test Household
- NO auth.users in seed data (prevents conflicts)
- **Issue Identified**: Dev-login was setting custom cookie instead of real session tokens
- **Solution**: Use `signInWithPassword()` API, return tokens, client calls `setSession()`
- See docs/16_authentication_flow.md and docs/17_dev_login_blocker.md for full details

**Not Started**:
- Agent SDK integration
- UI polish and components

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

---

## Recent Completions (2026-01-02)

### Branding & UX Overhaul ✅
**What**: Established complete brand identity and visual continuity system

**Completed**:
1. **Splash Screen** (app/components/SplashScreen.tsx):
   - 2.5-second branded loading screen
   - Chef's hat icon (40px white SVG)
   - "MealBrain" title with tagline
   - Subtle zoom animation (scale 0.95 → 1.0, 1s ease-out)
   - Orange background (#f97316)
   - Auto-redirects to /login

2. **Login Page Redesign** (app/login/page.tsx):
   - Orange background matching splash
   - Chef's hat and "MealBrain" positioned identically to splash (seamless transition)
   - Minimal input design: transparent background with white underline only
   - Placeholder text: subtle peachy white for legibility
   - Pill-shaped button (rounded-full) with semi-transparent white background
   - Success message replaces helper text in-place (no box)
   - Autofill styling override (prevents white background)

3. **Navigation Bar Redesign** (components/BottomNav.tsx):
   - Orange background (#f97316) - matches splash/login
   - White icons (Calendar, CookingPot, ShoppingCart, Settings)
   - Active state: 15% white overlay for subtle highlight
   - Maintains brand continuity throughout app

4. **Floating AI Button** (components/FloatingAIButton.tsx):
   - Chef's hat FAB (60px circle, bottom-right)
   - Orange background with drop shadow
   - Hover effect: scale 1.1x
   - Positioned above nav bar (80px from bottom)
   - Shows on all authenticated pages
   - Placeholder for future AI chat panel

**Brand Rationale**:
- Chef's hat = AI sous chef (icon continuity)
- Orange = warmth, food, energy
- Minimal design = mobile-first, reduces friction
- Visual continuity: splash → login → app (same colors/icons)

**Next Phase**: AI chat panel integration (chef's hat triggers slide-up panel)

---

## Recent Completions (2026-01-02 Continued)

### User Onboarding Experience ✅
**What**: Complete 6-step onboarding flow with preferences collection and data seeding

**Completed**:
1. **Multi-Step Onboarding Flow** (`/onboarding/preferences`):
   - Step 1: Household Context (just-me, couple, family)
   - Step 2: Dietary Constraints (multi-select + custom)
   - Step 3: AI Collaboration Style (coach vs collaborator)
   - Step 4: Planning Preferences (multi-select)
   - Step 5: AI Learning toggle (enable/disable)
   - Step 6: Summary & Confirmation
   - Progress bar (Step X of 6)
   - Next/Back navigation
   - Skip option with safe defaults
   - Mobile-first design with orange branding

2. **Seed Data for New Users** (`app/onboarding/preferences/actions.ts`):
   - 3 Example recipes created automatically:
     - Example: Chicken Curry (with image)
     - Example: Beef Tacos (with image)
     - Example: Black Bean Tacos (with image)
   - Default grocery list: "My First List"
   - Duplicate prevention (checks for existing examples)
   - Runs after preferences saved

3. **Integration**:
   - Household creation → Preferences onboarding → Recipes page
   - User preferences saved to `user_preferences` table
   - API endpoint: `/api/user/preferences` (GET/PUT)
   - Seamless flow from signup to first app experience

### Grocery List Management Enhancements ✅
**What**: Complete CRUD operations for grocery lists including rename and delete

**Completed**:
1. **Rename Functionality**:
   - API endpoint: `PATCH /api/grocery/lists/[id]`
   - UI: Inline edit with pencil icon
   - Save/Cancel buttons
   - Enter to save, Escape to cancel
   - Empty name validation

2. **Delete Functionality**:
   - API endpoint: `DELETE /api/grocery/lists/[id]`
   - UI: Red trash icon in list selector modal
   - Confirmation dialog with list name
   - Edge case handling: auto-switch to another list if deleting current
   - Cascades deletion to all items (database constraint)

3. **Summary Screen Styling**:
   - Orange uppercase field labels (matches Settings page)
   - Consistent text sizing (14px for labels and values)
   - Letter spacing for readability

**User Impact**:
- New users immediately see example data demonstrating app capabilities
- Can delete examples when ready to add own recipes
- Full control over grocery list management
- Professional onboarding experience sets proper expectations for AI behavior

---

## Recent Completions (2026-01-02 Evening)

### AI Chat Panel - Phase 4 FUNCTIONAL ✅
**What**: Interactive AI chat interface with Claude 4.5 Sonnet integration (read-only tools)

**Completed** (2026-01-02 Night Session):
1. **Chat Panel UI** (app/components/AIChatPanel.tsx):
   - **Minimal collapsed design** - Small compact card (320px) with greeting and input
   - **Expands on first message** - Transitions to full 70vh chat panel
   - **Smooth animations** - 0.3s transition between collapsed/expanded states
   - Dark backdrop (rgba(0,0,0,0.5)) with click-to-close (expanded only)
   - Chat message bubbles (user: orange right, AI: gray left)
   - **Recipe title linkification** - Auto-detects recipe names in responses, makes them clickable
   - **Click recipe → navigate to detail** - Closes panel and opens recipe card
   - Text input with send button, auto-scroll, loading state
   - **React Portal rendering** - Proper z-index layering (999999/1000000)
   - **Inline styles** - Overcomes Tailwind JIT limitations in portals
   - **White background fix** - Added explicit backgroundColor: 'white'

2. **Backend API Integration** (app/api/chat/route.ts):
   - Claude Sonnet 4.5 SDK integration (@anthropic-ai/sdk)
   - **Infinite loop fix** - Tool function parameters corrected (was passing wrong args)
   - **Max 10 tool iterations** - Prevents runaway loops
   - **5 Read-only tools enabled:**
     - `recipe_list` - List recipes with filters (metadata only)
     - **`recipe_get`** - Get FULL recipe details (ingredients, instructions, notes)
     - `planner_list_meals` - View planned meals for date range
     - `grocery_list_lists` - List all grocery lists
     - `grocery_get_list` - Get items from specific list
   - System prompt defining AI sous chef personality
   - **30-second client timeout** - Prevents hanging requests
   - Conversation history maintained, error handling with friendly messages
   - Authentication + household isolation (RLS)

3. **Critical Bugs Fixed**:
   - ✅ **Display issue**: Panel content showing through (missing white background)
   - ✅ **Infinite loop**: Tool calling 90+ times (wrong function parameters)
     - Root cause: `listRecipes(householdId, {...})` should be `listRecipes({ filters: {...} }, { householdId })`
     - Fixed all 5 tool calls to use correct `(input, context)` signature
   - ✅ **Recipe visibility**: Claude couldn't see ingredients/instructions (added recipe_get tool)
   - ✅ **Linkification**: Recipe titles in markdown (`**Beef Tacos**`) now clickable

4. **UX Improvements**:
   - Collapsed greeting: "Hi I'm your Sous Chef. How can I help?"
   - Chef's hat icon in both collapsed and expanded states
   - Close button (X) always accessible
   - Orange color scheme throughout (#f97316)
   - Clickable recipe titles with underline, hover effect, auto-navigation

**Technical Challenges Solved**:
- **Stacking context bug**: `transform: scale(1.1)` on FloatingAIButton created CSS stacking context
  - Solution: Removed transform, use box-shadow for hover effect only
- **Background transparency**: Tailwind `bg-white` not applied in portal
  - Solution: Add `backgroundColor: 'white'` to inline styles
- **Tool parameter mismatch**: All tools receiving garbage input
  - Solution: Corrected to `toolFunction(input, context)` pattern
- **Recipe matching**: Titles with "Example: " prefix and markdown formatting
  - Solution: Strip prefixes, match `**title**` patterns

**Files Modified** (2026-01-02 Night):
- `app/components/AIChatPanel.tsx` - Minimal collapsed UI, recipe linkification, navigation
- `app/api/chat/route.ts` - Fixed tool params, added recipe_get, max iterations, system prompt in loops
- `components/FloatingAIButton.tsx` - Removed transform hover effect

**UI Improvements** (2026-01-02 Late Night):
- ✅ Close button: Small gray X on right, no background/border
- ✅ Removed timestamps from all messages
- ✅ Removed header title/subtitle in expanded view (cleaner)
- ✅ Updated input field: Gray background (bg-gray-50), larger padding, rounded-2xl
- ✅ Updated Send button: Full width, orange gradient, rounded-2xl
- ✅ Removed airplane icon, text "Send" button instead
- ✅ Updated placeholder: "Ask me anything about your meals..."
- ✅ Removed bottom border from input section
- ✅ Using original chef's hat icon (stroke-based SVG)

**Status**:
- ✅ UI renders correctly (white background, proper layering)
- ✅ Minimal collapsed design working
- ✅ Backend connected to Claude 4.5 Sonnet
- ✅ All 5 read-only tools functional (including recipe_get for full details)
- ✅ Recipe titles clickable and navigable
- ✅ No infinite loops (max 10 iterations enforced)
- ✅ UI improved with cleaner design, better input styling
- ⏳ Continued UI refinement (ongoing)
- ⏳ Write tools with approval flow (Phase 4+ future work)

**Next Steps**:
1. Add tool confirmation UI (approval modals for write operations)
2. Enable write tools: `recipe.create`, `planner.add_meal`, `grocery.push_ingredients`
3. Test end-to-end AI workflows ("Plan this week for me")

---

## Recent Completions (2026-01-02 Late Night)

### AI Chat Panel - Floating UI Redesign ✅
**What**: Complete visual overhaul with modern floating design matching reference example

**Completed**:
1. **Floating Panel Layout** (app/components/AIChatPanel.tsx):
   - **Single panel design** - Removed collapsed/expanded states
   - **Centered with margins** - 16px on left/right to show app behind
   - **Positioned above nav** - 110px from bottom (80px nav + 30px spacing)
   - **Fixed dimensions** - calc(100% - 32px) wide, max 500px, 70vh tall
   - **Rounded corners** - 24px border radius on all sides
   - **Elevated shadow** - Subtle depth with modern shadow

2. **Chat Bubble Improvements**:
   - **AI bubbles**: White background with `shadow-md` (soft shadow)
   - **User bubbles**: Orange (#f97316) background - kept existing
   - Both use rounded-2xl (16px) corners
   - Max 80% width for better readability

3. **Input Field Redesign**:
   - **Inline send icon** - Airplane/Send icon positioned inside input on right
   - **Rounded pill design** - Full rounded (rounded-full) gray background
   - **Icon interaction** - Gray default, orange hover, disabled gray
   - Removed separate send button
   - Cleaner, more modern appearance

4. **Loading State**:
   - White bubble with shadow-md (matches AI bubbles)
   - Animated dots (3-dot bounce)

5. **Empty State**:
   - Chef's hat icon (matches brand)
   - Greeting message

**Visual Impact**:
- App content visible on both sides (floating effect)
- Bottom navigation always accessible
- Modern chat interface matching design reference
- Consistent with brand orange color throughout
- Professional elevation and spacing

**Files Modified**:
- `app/components/AIChatPanel.tsx` - Complete layout redesign

**Status**:
- ✅ Floating panel layout complete
- ✅ White AI bubbles with shadow
- ✅ Inline send icon in input field
- ✅ App visible on sides and bottom
- ✅ Compiled successfully

---

## Current Blockers

### Dev Login Auth Bypass
- **Status**: RESOLVED ✅ (Updated 2025-12-27)
- Using /dev-login with signInWithPassword() + setSession()
- All 3 dev users work correctly (demo, spouse, test)

---

## Recent Updates (2026-01-04)

### Phase 4 Completion: AI Write Operations + Polish

**Major Features Completed:**

1. **Authentication Fix** (lib/auth/supabase-server.ts)
   - Fixed cookie `setAll` error in API routes
   - Added try-catch for Server Component compatibility
   - Resolved 401 Unauthorized errors in chat API

2. **AI Date Context** (app/api/chat/route.ts:333-356)
   - Dynamic date calculation (today, this week, next week, tomorrow)
   - System prompt includes current date context
   - AI correctly interprets "this week", "next week" requests

3. **Batch Approval for Write Operations** (app/api/chat/route.ts:428-471)
   - Handles multiple write tools in single request
   - Shows all actions in approval UI list
   - Executes all approved actions sequentially
   - Success message shows count of completed actions

4. **Write Tools Implemented:**
   - `planner_add_meal` - Add meals to planner with approval
   - `grocery_push_ingredients` - Push recipe ingredients to list
   - `recipe_create` - Create new recipes (existing)

5. **New Chat Button** (app/components/AIChatPanel.tsx:443-457)
   - Clears conversation history
   - Resets session state
   - Orange-styled button in header

6. **Recipe Rating Fixes:**
   - Recipe detail page now shows stars (recipes/[id]/page.tsx:617-621)
   - Fixed null rating display (shows 5 gray outlined stars)
   - Edit mode allows unsetting ratings (recipes/[id]/edit/page.tsx:132)

7. **HTML Entity Decoding** (lib/utils/decode-html.ts)
   - Created universal decoder utility
   - Handles &#8217; ('), &#215; (×), &amp; (&), etc.
   - Applied to:
     - Recipe detail page (ingredients, instructions, notes)
     - Grocery list page (ingredient names)
     - Push to grocery modal (both single & dual list modes)

8. **Real-Time Updates:**
   - Calendar dots appear immediately after AI adds meals
   - Uses router.refresh() after batch approval (AIChatPanel.tsx:275)

9. **UX Polish:**
   - Success message duration: 1.5s → 3s
   - Checkbox improvements: 18px → 20px, flexShrink: 0, accentColor
   - Better scroll behavior when reopening chat panel

**Technical Debt Addressed:**
- Consistent HTML entity handling across all text displays
- Proper null handling for optional recipe fields
- Improved error logging in chat API
- Fixed preferences tool query (single() → limit(1))

**Files Modified:**
- `lib/auth/supabase-server.ts` - Cookie handling fix
- `lib/utils/decode-html.ts` - NEW: HTML entity decoder
- `lib/tools/preferences.ts` - Query fix
- `app/api/chat/route.ts` - Date context + batch approval + tools
- `app/api/chat/approve/route.ts` - Write tool handlers
- `app/components/AIChatPanel.tsx` - New Chat button + batch UI + refresh
- `app/recipes/[id]/page.tsx` - Stars + decoding + checkbox styles
- `app/recipes/[id]/edit/page.tsx` - Null rating fix
- `app/recipes/page.tsx` - Star display fix
- `app/groceries/page.tsx` - HTML decoding

**Current State:**
- ✅ AI can read all data (recipes, meals, grocery lists, preferences)
- ✅ AI can write with approval (add meals, push ingredients, create recipes)
- ✅ Batch operations work (plan full week in one approval)
- ✅ Real-time UI updates after AI actions
- ✅ Clean text display (no HTML entities)
- ✅ Complete date awareness
- ✅ Professional approval flow with clear previews

**Next Potential Enhancements:**
- Additional write tools (update recipe, remove meal, etc.)
- Meal plan optimization suggestions
- Grocery list smart grouping
- Recipe recommendations based on history

---

## Latest Updates - 2026-01-07 (Morning)

### Invitation-Only Access System - COMPLETE ✅

**Major Security Update:**
App now requires invitation codes for signup - prevents unauthorized access to deployed resources.

**Database Schema:**
- New table: `household_invites`
  - 8-character alphanumeric codes (excludes confusing: 0, O, 1, I, L)
  - Expiration tracking (30 days default)
  - Usage limits (single-use or multi-use)
  - Creator tracking and notes
- New table: `household_invite_uses`
  - Tracks who used which invite and when
- Migration: `20260107155103_add_household_invites.sql`

**API Endpoints:**
- `POST /api/invites` - Create invite codes (authenticated)
- `GET /api/invites` - List household invites (authenticated)
- `POST /api/invites/validate` - Validate codes (public, RLS allows `anon` role)

**UI Implementation:**
- `/settings/invites` - Generate and manage invite codes
  - "Create Invite Link" button
  - Display codes with usage count (e.g., "Uses: 0 / 1")
  - Expiration dates shown
  - Copy invite link to clipboard
- `/onboarding` - Updated to require invite validation
  - Auto-validates code from URL parameter (`?code=ABC12XYZ`)
  - Manual code entry form if no URL parameter
  - Shows household name after successful validation
  - "Join Household" button to complete signup

**User Flow:**
1. Existing household member → Settings → Invite Members
2. Click "Create Invite Link" → System generates 8-char code
3. Copy shareable link with code embedded in URL
4. New user clicks link → Auto-validates → Prompted to login/signup
5. After auth → Joins household automatically
6. Code usage tracked (prevents reuse if single-use)

**Security Benefits:**
- Prevents strangers from accessing deployed app
- Each household controls their own member invitations
- Codes can be single-use or multi-use (configurable via max_uses)
- Expired/fully-used codes automatically rejected
- Safe to publish GitHub repo publicly (no open signup vulnerability)

**RLS Policies:**
- `anon` users can SELECT (validation must work before signup)
- `authenticated` users can INSERT/DELETE for their household only
- Actual invite consumption requires authentication

### Password Reset Flow - COMPLETE ✅

**Feature Added:**
Users can now reset forgotten passwords via email.

**Implementation:**
- Supabase `resetPasswordForEmail()` sends password reset email
- Reset link directs to `/settings/password` page
- User authenticates and can set new password
- File: `app/settings/password/page.tsx`

### PWA Session Persistence - COMPLETE ✅

**Problem:** Users logged out when closing PWA on iOS
**Solution:**
- Dual storage strategy: cookies (browser) + localStorage (PWA)
- Middleware refreshes sessions on every request
- Default landing page changed to `/recipes` (was `/planner`)
- Better session handling for installed PWA experience

### E2E Testing - COMPLETE ✅

**New Test Suite:** `e2e/household-invites.spec.ts` (8 tests passing)
- Generate invite code via UI
- Validate invite code (API endpoint)
- Reject invalid codes with error message
- Pre-fill code from URL parameter
- Show invite input when no URL code
- Validate manually entered code
- Show error for invalid manual entry
- Track usage count display
- Show expiration date display

**Coverage:**
- Complete user journey from invite creation to validation
- Error handling for invalid/expired codes
- UI states and transitions
- API integration

### Documentation Updates - COMPLETE ✅

**Added:**
- Security Architecture section in `docs/01_architecture.md` (lines 67-113)
- Invitation-Only Access section with full flow documentation
- Database schema for `household_invites` and `household_invite_uses`
- RLS policies and security model
- Password reset flow documentation
- Dual storage strategy explanation
- Updated `docs/08_implementation_plan.md` with Phase 5 completion

**Status:**
- ✅ Invitation system fully functional
- ✅ Prevents unauthorized access
- ✅ E2E tests passing
- ✅ Ready for production deployment
- ✅ Safe to open-source repository

---

## Latest Updates - 2026-01-07 (Afternoon)

### Grocery List Intelligence & UX Improvements - COMPLETE ✅

**Major enhancements to grocery list management with AI categorization:**

#### 1. Claude Auto-Categorization System
**Problem:** Items defaulted to "Other" or required manual categorization

**Solution:**
- New API endpoint: `/api/grocery/categorize`
- Three-step intelligent flow:
  1. Check `category_mappings` cache (free, instant)
  2. If cache miss → Call Claude Haiku API (~$0.001 per item)
  3. Save result to cache for future use
- Auto-runs when adding items without categories
- Validates suggestions against user's actual categories
- Unknown categories → Adds note: "AI suggested: 'CategoryName' (add via Settings)"
- Falls back to "Other" gracefully

**Database Schema:**
- New table: `category_mappings`
  - Caches learned categorizations
  - Shared across all users (universal food knowledge)
  - Tracks usage statistics (times_used, last_used_at)
- Functions:
  - `normalize_item_name()` - Handles variations ("Plums" = "plums" = "PLUMS (honey?)")
  - `get_suggested_category()` - Checks cache, updates stats
  - `save_category_mapping()` - Stores learned mappings

**Cost Economics:**
- Week 1: ~$1 (learning common items)
- Month 2: ~$0.10 (90% cache hits)
- Month 6+: ~$0.01 (99% cache hits)
- Example: First "Plums" → Claude API → Saved. Next "plums" → Cache hit (free!)

**Migration:** `20260107200000_add_notes_and_category_learning.sql`

#### 2. Notes Field for Grocery Items
**Problem:** No way to add custom notes/reminders for items

**Solution:**
- Added `notes TEXT` column to `grocery_items`
- Edit form: Textarea for custom notes (e.g., "check expiration date")
- List view: Notes display inline with recipe source
- Format: "Recipe Name • check expiration..." (truncated to 40 chars)
- Styling: Italic gray text with ellipsis for overflow

#### 3. Optional Units
**Problem:** "whole" unit shown for everything, even when inappropriate

**Solution:**
- Unit field now optional (empty string = no unit displayed)
- Dropdown: Added blank option "(none)" at top
- Display: "2 Plums" (no unit) vs "1 lb Chicken"
- Added units: jar, bottle, bag, box, dozen
- Backend: Stores empty string (not NULL) for cleaner queries

#### 4. UX Improvements
**No Strikethrough:**
- Removed strikethrough styling from checked items
- Makes sense since checked = ready to delete/copy (not "done")

**"Delete Checked" (was "Clear Checked"):**
- Renamed for clarity (delete vs clear all checkmarks)
- Updated button, modal title, confirmation text

**Alphabetical Sorting:**
- Items sorted A-Z by name within each category
- Case-insensitive locale comparison
- Makes finding items in large lists much easier
- Example: Easy to find "Butter" in Dairy section

**Sticky Headers:**
- List name + Check All → Sticky at top (zIndex: 20)
- Action buttons row → Sticky below header (zIndex: 10, top: 72px)
- Maintains context while scrolling long lists
- Subtle shadow for depth

#### 5. Bulk List Operations
**Check All:**
- Checkbox in list header (next to list name)
- Toggles all items checked/unchecked at once
- Updates all items in database

**Copy to... :**
- New button in action row (4 buttons now)
- Enabled only when items are checked
- Opens modal showing other lists
- Copies checked items to selected list (unchecked state)
- Source items auto-uncheck after copy
- Green success message appears for 3 seconds

**Workflow:** Master list = permanent catalog → Copy to Active for this week → After shopping: Check All → Delete Checked

**Files Modified:**
- `app/groceries/page.tsx` - UI improvements, sorting, sticky headers
- `app/api/grocery/categorize/route.ts` - NEW - Claude categorization
- `app/api/grocery/items/route.ts` - Auto-categorize on item add
- `supabase/migrations/20260107200000_add_notes_and_category_learning.sql`

**Status:**
- ✅ AI categorization learning over time
- ✅ Notes field fully functional
- ✅ Optional units working
- ✅ UX improvements deployed
- ✅ Bulk operations complete

---

## Latest Updates - 2026-01-04 (Evening)

### Quantity Range Support - COMPLETE ✅

**Major Feature Added:**
Recipe ingredients now support quantity ranges (e.g., "1-2 salmon fillets")

**Database Changes:**
- Added `quantity_max` column to `recipe_ingredients`
- Renamed `quantity` → `quantity_min` for clarity
- Migration: `20260104184621_add_quantity_max_to_recipe_ingredients.sql`

**Implementation:**
- Parser handles ranges: "1-2", "½-1", etc.
- Display shows ranges correctly throughout app
- Serving size scaling handles both min and max
- Grocery lists use max value when pushing (better to have extra)

### UI Improvements - COMPLETE ✅

**Search Redesign:**
- Search icon in top-left of recipes page
- Expands in-place (no layout shift)
- Import and + buttons stay on right
- Removed "Recipes" title text

**Layout Fixes:**
- Bottom nav truly fixed (no movement)
- AuthenticatedLayout uses h-screen + overflow-hidden
- Main content scrolls independently
- Sous Chef button padding adjusted (no overlap with edit icons)

### Bug Fixes - COMPLETE ✅

**Grocery List Range Input:**
- Changed from type="number" to type="text" with inputMode="decimal"
- Accepts "1-3" and parses to max value (3)
- Works for add and edit operations

**Meal Planner Error Handling:**
- Better error messages when recipe not found
- Guides AI to call recipe_list first

**Type Safety:**
- Added meal_type to ListRecipesSchema filters
- Fixed executeTool context (userId + householdId)
- Fixed recipe import heuristics (missing source field)

### Testing Requirements

**Unit Tests Needed:**
- parseIngredientLine with ranges
- ingredientsToText with ranges
- Grocery quantity parsing

**E2E Tests Needed (Playwright):**
- Create/edit recipes with ranges
- Import recipes with ranges
- Serving size scaling with ranges
- Push to grocery with ranges
- Add grocery items with ranges
- Search UI behavior
- Bottom nav fixed position

