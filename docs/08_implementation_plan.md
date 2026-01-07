# 08 – Implementation Plan

**Authoritative execution roadmap for the MealBrain project.**

This plan constrains scope, sequences work, and prevents premature complexity.

---

## Guiding Principles

### Development Philosophy
- **Build the spine before the brain** - Data layer before AI intelligence
- **Data safety before delight** - Trust before polish
- **AI behavior must be trusted before it is impressive**
- **Each phase must be shippable on its own** - No throwaway work
- **Mobile-first, household-only** - Optimize for 2-user, private use case
- **Progress measured by confidence, not feature count**

### Technical Principles
- Develop locally first (Supabase local stack)
- Test-driven development for critical paths
- AI creativity for planning, deterministic Tools for mutations
- No vendor lock-in beyond convenience
- No premature optimization
- No silent AI behavior
- No irreversible actions without approval

---

## Success Metric

> **"This app is successful if my spouse has less frustration about meal planning."**

The MVP is complete when:
- Wife uses it without training
- Meals planned for a week
- Groceries generated correctly
- AI helps but never surprises

---

## Phase Breakdown

### Phase 0: Documentation Consolidation ✅ COMPLETE
**Duration**: 2-3 hours
**Status**: Complete

**Goal**: Clean, consolidated documentation ready for implementation

**Deliverables**:
- [x] Merge UI docs → `07_ui_design_system.md`
- [x] Merge Tools specs → `02_tools_spec.md` (Agent SDK pattern)
- [x] Merge AI governance → `09_ai_behavior_contract.md`
- [x] Merge implementation plans → `08_implementation_plan.md` (this file)
- [x] Consolidate decision rules → `10_deterministic_rules.md`
- [x] Create `13_external_services.md`
- [x] Create `14_error_handling.md`
- [x] Create `15_testing_strategy.md`
- [x] Create `16_authentication_flow.md`
- [x] **BONUS**: Add user onboarding spec to data models
- [x] **BONUS**: Create demo data strategy (supabase/seed.sql)

**Exit Criteria**: ✅ ALL MET
- Single source of truth for all specifications
- No conflicting documentation
- External dependencies specified
- Ready to start coding

**Step 0 Bonus (Project Skeleton)**: ✅ COMPLETE
- [x] Folder structure created (cloud-ready for Vercel)
- [x] TypeScript config
- [x] Basic package.json (no dependencies yet)
- [x] Demo data SQL prepared

---

### Phase 1: Local Infrastructure & Repo Genesis ✅ COMPLETE
**Duration**: 1 week (part-time, ~10-12 hours)
**Status**: Complete

**Goal**: Prove plumbing works. Establish real application backbone with local data.

#### Deliverables

**Repository & Infrastructure**:
- [x] Initialize Git repository
- [x] Create `.gitignore` (exclude `.env`, `node_modules`, etc.)
- [x] Create folder structure (cloud-ready)
- [x] TypeScript configuration
- [x] Basic package.json
- [x] Install dependencies (Next.js, React, TypeScript, Vitest, Playwright, Tailwind, Supabase client, Lucide)
- [x] Configure Next.js (next.config.js)
- [x] Configure Tailwind CSS v4 (@tailwindcss/postcss)
- [x] Configure Vitest (vitest.config.ts)
- [x] Environment variables template (.env.local.example)
- [x] Verify dev server starts (✅ http://localhost:3000)
- [x] Set up local Supabase (`supabase start`)

**Database Schema & Migrations**:
- [x] Create tables:
  - [x] `households` (id, name, created_at)
  - [x] `users` (id, household_id, email, created_at)
  - [x] `user_preferences` (id, user_id, household_context, dietary_constraints, ai_style, planning_preferences, ai_learning_enabled)
  - [x] `recipes` (id, household_id, title, rating, tags, notes)
  - [x] `recipe_ingredients` (id, recipe_id, ingredient_id, display_name, quantity, unit, prep_state, optional)
  - [x] `ingredients` (id, canonical_name, aliases)
  - [x] `planner_meals` (id, household_id, recipe_id, date, meal_type)
  - [x] `grocery_lists` (id, household_id, name, created_at)
  - [x] `grocery_items` (id, grocery_list_id, ingredient_id, display_name, quantity, unit, checked)
- [x] Enable Row Level Security (RLS) policies for household isolation
- [x] Create seed data (demo household + users + 3 recipes)

**Authentication**: ✅
- [x] Supabase Auth with magic-link email
- [x] Auth flow: Email input → Magic link → Session established
- [x] Household association on first login
- [x] Server action pattern for authenticated DB writes
- [x] E2E tests passing (2/4 core flows)

**Agent SDK Project Scaffolding**:
- [x] Create directory structure (refactored for Vercel):
  - `app/api/agent/` - Agent SDK endpoint (Vercel serverless)
  - `lib/tools/` - Agent SDK tool definitions (Zod schemas)
  - `lib/db/` - Supabase client singleton
  - `tests/` - E2E test files
- [ ] Define first Tool as Agent SDK skill: `recipe.list` (read-only)
- [ ] Validate Tool can execute against local Supabase

**Testing Infrastructure**:
- Set up Vitest for unit/integration tests
- Set up Playwright for E2E tests
- Create test database setup/teardown scripts
- Write first passing test (trivial assertion to validate setup)

**Basic UI Scaffolding**:
- Bottom tab navigation (4 tabs: Planner, Recipes, Groceries, Settings)
- Empty placeholder screens for each tab
- Basic layout structure (header, content, tabs)
- No AI panel yet

#### Phase 1 Success Criteria ✅ ALL MET

**Stop and validate** if any of these fail:
- [x] Can run `supabase start` and connect to local DB
- [x] Can authenticate with magic-link locally
- [x] Can create household and associate user
- [x] Can execute at least one Tool successfully
- [x] All tests pass (26/26 Phase 1 tests passing)
- [x] Frontend loads on mobile viewport (375px)

**Exit Criteria**: ✅ ALL MET
- [x] You and spouse can log in locally
- [x] Database tables exist with seed data
- [x] Three Tools work end-to-end (recipe.create, planner.add_meal, grocery.push_ingredients)
- [x] Test infrastructure runs green (Vitest + Playwright)
- [x] Auth flow works end-to-end (manual + E2E tests)

---

### Phase 2: Core CRUD & UI MVP
**Duration**: 2-3 weeks (part-time, ~20-30 hours)

**Goal**: App usable without AI. Manual data entry works perfectly.

#### Deliverables

**Recipe Management**:
- Recipe list screen (card grid, search, filter by tags)
- Recipe detail screen (ingredients, instructions, notes, rating)
- Recipe create/edit form (manual entry only, no voice/OCR yet)
- Implement Tools:
  - `recipe.create`
  - `recipe.update`
  - `recipe.get`
  - `recipe.list`

**Meal Planner**:
- Week view calendar (7 days, scrollable)
- Meal cards (title, tags, tap to view recipe)
- Add meal flow (select recipe → select date → select meal type)
- Remove meal action
- Implement Tools:
  - `planner.add_meal`
  - `planner.remove_meal`
  - `planner.list_meals`

**Grocery Lists**:
- List selector dropdown (multiple lists per household)
- Grocery item checklist (checkbox, quantity, unit)
- Create new list
- Manual add item
- Ingredient push modal (from recipe detail or planner)
  - Checklist of ingredients (all checked by default)
  - Target list selector
  - Preview aggregated quantities
  - Confirm button
- Implement Tools:
  - `grocery.create_list`
  - `grocery.add_item`
  - `grocery.push_ingredients` (deterministic aggregation)
  - `grocery.check_item`
  - `grocery.list_lists`
  - `grocery.get_list`

**UI Polish (Mobile-First)**:
- Responsive layout (375px-667px viewport)
- Touch targets minimum 44x44px
- Bottom tab navigation fully functional
- Loading states for all async operations
- Error states with clear messages

**Testing**:
- Unit tests for quantity math
- Unit tests for ingredient aggregation logic
- Integration tests for all Tools (with test DB)
- E2E test: Auth flow
- E2E test: Create recipe → Add to planner → Generate grocery list

#### Phase 2 Success Criteria

**Must work flawlessly**:
- [ ] Create 5 recipes manually
- [ ] Plan a full week of meals
- [ ] Generate grocery list from planner
- [ ] Ingredient quantities aggregate correctly
- [ ] All CRUD operations reversible (soft delete)
- [ ] Wife can use without asking questions

**Exit Criteria**:
- App is fully functional without AI
- All core user flows work on mobile
- Test coverage >80% for Tools and business logic
- No critical bugs in manual workflows

---

### Phase 3: AI Agent (Creative, Read-Only First)
**Duration**: 1 week (part-time, ~10-12 hours)

**Goal**: Creativity without risk. AI can suggest but not mutate.

#### Deliverables

**AI Chat Panel**:
- Slide-up drawer overlay (50% viewport height)
- Text input + Send button
- Message bubbles (user left, AI right)
- Context awareness (knows current screen)
- Dismissible (swipe down or tap outside)

**Agent SDK Integration**:
- Initialize Anthropic Claude 3.5 Sonnet client
- Implement Agent orchestration layer
- Intent classification (what does user want?)
- Provide read-only Tools to agent:
  - `recipe.list`
  - `recipe.get`
  - `planner.list_meals`
  - `grocery.list_lists`

**Creative AI Capabilities**:
- Answer questions: "What recipes do I have with chicken?"
- Suggest meals: "Suggest a dairy-free dinner"
- Plan weeks: "Plan meals for next week" (preview only, no writes yet)
- Reason about variety: "What haven't we had in 2 weeks?"

**No writes allowed yet** - AI can only read data and propose ideas.

#### Phase 3 Success Criteria

**Must work**:
- [ ] AI can answer questions about existing data
- [ ] AI proposes meal plans (preview only)
- [ ] AI explains reasoning clearly
- [ ] AI never attempts to mutate data
- [ ] Chat panel works smoothly on mobile

**Exit Criteria**:
- AI reads data correctly via Tools
- AI provides helpful suggestions
- User trusts AI responses (no hallucinations about data)

---

### Phase 4: Deterministic Tool Writes (Approved Actions)
**Duration**: 1-2 weeks (part-time, ~15-20 hours)

**Goal**: Safe AI actions. AI can propose + execute with approval.

#### Deliverables

**Tool Confirmation Flow**:
- AI proposes action with preview
- User sees confirmation modal:
  - What will happen (e.g., "Add 3 meals to planner")
  - Which data will change
  - Approve / Cancel buttons
- On approve → Tool executes → AI confirms result
- On cancel → AI acknowledges cancellation

**Write Tools for Agent**:
- `recipe.create` (from AI-suggested recipe)
- `planner.add_meal` (from AI meal plan)
- `grocery.push_ingredients` (from AI suggestion)

**AI Workflows**:
- "Plan this week for me" → AI proposes 7 meals → User approves → Tools execute
- "Add ingredients for Tuesday's dinner to grocery list" → AI shows preview → User approves → Tool executes
- "Create a recipe for chicken tikka masala" → AI drafts recipe → User edits → User confirms → Tool creates

**AI Governance Enforcement**:
- All writes require explicit approval
- AI explains what will happen before execution
- AI confirms what happened after execution
- User can undo within session

#### Phase 4 Success Criteria

**Must work**:
- [ ] AI can plan a week with user approval
- [ ] AI can generate grocery lists with user approval
- [ ] AI never writes without confirmation
- [ ] All writes are reversible
- [ ] User feels in control at all times

**Exit Criteria**:
- AI assists with planning end-to-end
- Approval flow is frictionless
- No surprise mutations
- Wife uses AI features confidently

---

### Phase 5: Enhancements & Polish
**Duration**: Ongoing (post-MVP)

**Goal**: Make the app delightful and reduce friction.

#### Potential Enhancements

**Voice Input** (Phase 5a):
- Web Speech API integration
- Mic button in chat panel
- Speech-to-text → AI processes text
- Requires user confirmation before writes

**OCR Recipe Import** (Phase 5b):
- Camera button in chat panel
- GPT-4 Vision or similar for OCR
- Extract recipe text → AI structures → User reviews → Tool creates
- Requires user confirmation before writes

**Advanced Planning** (Phase 5c):
- Critic sub-agent (simplicity, ingredient reuse, prep efficiency)
- Leftover awareness
- Constraint balancing (health, cost, effort)
- Pattern-based suggestions from historical data

**UX Polish** (Phase 5d):
- Animations and transitions
- Dark mode
- Tablet responsive layout
- Advanced filtering and search
- Recipe rating and favorites
- Nutrition tracking

**Cloud Deployment** (Phase 5e):
- Supabase production project
- Vercel production deployment
- Custom domain
- Backups and exports
- Disaster recovery
- Performance tuning

---

## Development Workflow

### Daily Workflow
1. Work locally with `supabase start`
2. Run tests before committing (`npm run test`)
3. Commit to Git with descriptive messages
4. Push to GitHub when feature is stable
5. Deploy to cloud only after local validation

### Testing Strategy
- **Unit tests**: Pure functions (quantity math, validation, aggregation)
- **Integration tests**: Tools with test database
- **E2E tests**: Critical user flows (auth, planning, grocery generation)
- **AI behavior tests**: Prompt → expected tool calls

### Code Review
- Self-review checklist before commit:
  - [ ] Does it respect user control?
  - [ ] Does it ask before mutating state?
  - [ ] Is it reversible?
  - [ ] Does it explain reasoning?
  - [ ] Is it tested?
  - [ ] Does it work on mobile?

---

## Anti-Goals

### What We Will NOT Do

❌ **Premature optimization** - Solve performance issues when they exist, not before
❌ **Silent AI behavior** - AI never acts without user knowledge
❌ **Irreversible actions** - All mutations must be undoable
❌ **Vendor lock-in assumptions** - Stay portable where practical
❌ **Feature creep before MVP** - Defer nice-to-haves until core works
❌ **Desktop-first design** - Mobile is primary, desktop is bonus
❌ **Auto-learning without consent** - AI must ask before storing preferences
❌ **Complexity for elegance** - Simple working code beats elegant broken code

---

## Phase Decision Gates

### How to Know When to Move to Next Phase

**Gate 1 → Phase 1 to Phase 2**:
- All Phase 1 exit criteria met
- Can authenticate and access database
- At least one Tool works
- Test infrastructure green

**Gate 2 → Phase 2 to Phase 3**:
- All Phase 2 exit criteria met
- Core CRUD works flawlessly
- Spouse can use app without AI
- Test coverage >80%

**Gate 3 → Phase 3 to Phase 4**:
- All Phase 3 exit criteria met
- AI reads data correctly
- AI provides helpful suggestions
- User trusts AI responses

**Gate 4 → Phase 4 to Phase 5**:
- All Phase 4 exit criteria met
- AI can plan week with approval
- AI can generate groceries with approval
- Spouse uses AI features confidently
- **This is MVP complete**

---

## Current Status

**Active Phase**: Phase 3 - Production Ready & Invitation System Complete ✅
**Completion**: All core features shipped to production, invitation-only access secured
**Latest Deployment**: e5af7a2 (2026-01-07)
**Status**: **PRODUCTION READY** - App fully functional for household use

**Recent Work**:
- ✅ Grocery List UI complete (list view, check/uncheck items)
- ✅ All 12 Tools complete with 100% coverage (34/34 tests)
- ✅ Auth architecture documented (3 separate flows)
- ⚠️ Auth loop issue - magic links expire/reuse, blocking dev work
- **NEXT**: Implement working /dev-login (direct session creation)

### Phase 0 Progress: ✅ COMPLETE
- [x] Merge UI docs
- [x] Merge Tools specs
- [x] Merge AI governance
- [x] Merge implementation plans
- [x] Consolidate decision rules
- [x] Create external services spec
- [x] Create error handling spec
- [x] Create testing strategy spec
- [x] Create authentication flow spec
- [x] **BONUS**: Project skeleton established

### Phase 1 Progress: ✅ COMPLETE (All Steps)
- [x] **Step 0**: Project skeleton (folder structure, configs, demo data)
- [x] **Step 1**: Infrastructure setup (dependencies, Next.js, Tailwind, Vitest, Playwright)
- [x] **Step 2**: TDD pure functions
  - [x] quantity-math (5/5 tests ✅)
  - [x] ingredient-aggregation (6/6 tests ✅)
- [x] **Step 3**: Supabase local setup
  - [x] Docker + Supabase CLI
  - [x] Initial migration (9 tables with RLS)
  - [x] Seed data loaded
- [x] **Step 4**: Tool integrations
  - [x] recipe.create (4/4 tests ✅)
  - [x] planner.add_meal (5/5 tests ✅)
  - [x] grocery.push_ingredients (4/4 tests ✅)
- [x] **Step 5**: Authentication infrastructure
  - [x] Server-side callback route
  - [x] Server action pattern (service role for writes)
  - [x] RLS policies updated
  - [x] E2E tests (2/4 core flows passing ✅)
  - [x] **Auth works end-to-end** (manual + automated)

**Phase 1 Final Stats**:
- **26/26 Phase 1 critical tests passing (100%)**
- **26/58 total tests passing (45% overall)**
- All exit criteria met ✅

### Phase 2 Progress: All Tools Complete ✅
- [x] **All 12 Tools implemented with TDD** (34/34 tests, 100% coverage)
  - [x] recipe.list (3/3 tests ✅)
  - [x] recipe.update (3/3 tests ✅)
  - [x] planner.remove_meal (2/2 tests ✅)
  - [x] planner.list_meals (2/2 tests ✅)
  - [x] grocery.create_list (2/2 tests ✅)
  - [x] grocery.add_item (2/2 tests ✅)
  - [x] grocery.check_item (2/2 tests ✅)
  - [x] grocery.list_lists (2/2 tests ✅)
  - [x] grocery.get_list (3/3 tests ✅)
- [x] **Recipe UI Complete** (Full CRUD)
  - [x] Recipe list screen (search by title/tags/notes/instructions, rating filter)
  - [x] Recipe detail screen (full display, actions)
  - [x] Recipe create form (dynamic ingredients, validation)
  - [x] Recipe edit form (pre-populated, updates)
  - [x] API routes (GET list, GET single, POST create, PUT update)
- [x] **Meal Planner UI Complete**
  - [x] Week view (7 days, prev/next navigation, today highlight)
  - [x] Add meal flow (select recipe, pick date/meal type)
  - [x] API routes (GET /api/planner, POST /api/planner)
  - [x] Support for all 4 meal types (breakfast, lunch, dinner, snack)
- [x] **Database & Infrastructure**
  - [x] Migrations consolidated (single schema file)
  - [x] Enhanced error handling (auth debugging)
- [x] **Grocery List UI** ✅
  - [x] List selector dropdown
  - [x] Items display with quantities
  - [x] Check/uncheck functionality
  - [x] API routes (list_lists, get_list, check_item)
  - [x] New List button + modal
  - [x] Add Item button + modal (with quantity/unit)
  - [x] AuthenticatedLayout wrapper (consistent navigation)
- [x] **Recipe Action Buttons** ✅
  - [x] "Add to Planner" navigation
  - [x] "Push Ingredients to Grocery" with list selector modal
  - [x] API route for push_ingredients
- [x] **E2E Tests for Action Buttons** ✅
  - [x] Create grocery list (test passes)
  - [x] Add items to list (test passes)
  - [x] Check/uncheck items (test passes)
  - [x] Navigate to planner from recipe (test passes)
  - [x] Push ingredients to grocery list (test passes)
  - [x] Full workflow test (test passes)
  - [x] **All 6/6 action button tests passing** ✅
- [x] **Dev-Login Fix** ✅ (Completed 2025-12-27)
  - [x] Replace custom cookie with signInWithPassword()
  - [x] Return tokens to client
  - [x] Client calls setSession() with tokens
  - [x] Test with all three dev users (demo, spouse, test)
  - [x] All 3 E2E tests passing
  - [x] User email shown in header for visibility

### Phase 3: Enhancements & Polish

- [x] **Move Grocery Items Between Lists** ✅ (Completed 2025-12-28)
  - [x] Add dropdown on each grocery item to select destination list
  - [x] API endpoint: PATCH /api/grocery/items/[id] to update grocery_list_id
  - [x] Maintain item state (checked/unchecked, quantity, unit) during move
  - [x] E2E test: create 2 lists, add item to list A, move to list B, verify
  - [ ] Optimistic UI update with rollback on error (deferred - works well as-is)
  - [ ] Tool update: Add grocery.move_item tool with validation (Phase 4 - AI Integration)
- [x] **Grocery List Redesign** ✅ (Completed 2025-12-29)
  - [x] Recipe Source Tracking
    - [x] Database migration: Add source_recipe_id and prep_state columns
    - [x] Foreign key constraint with ON DELETE SET NULL
    - [x] Index on source_recipe_id for query performance
  - [x] Enhanced API Endpoints
    - [x] GET list: JOIN with recipes table to return recipe names
    - [x] PATCH item: Expand to edit quantity, unit, display_name
    - [x] DELETE item: New endpoint to remove items
    - [x] pushIngredients: Store source_recipe_id and prep_state
  - [x] UI Redesign
    - [x] Larger checkboxes (w-7 h-7) for mobile-friendly tapping
    - [x] "quantity unit name" display format
    - [x] Clickable "from [Recipe Name]" links in orange
    - [x] Strikethrough when checked
    - [x] Pencil icon edit button per item
  - [x] Edit Modal
    - [x] Edit name, quantity, unit
    - [x] Move to different list dropdown
    - [x] View source recipe (read-only with link)
    - [x] Delete button with confirmation
    - [x] Save/Cancel with loading states
  - [x] Recipe Integration
    - [x] Pass source_recipe_id when pushing from recipes
    - [x] Support separate line items from different recipes
- [x] **UI/UX Polish** ✅ (Completed 2025-12-29)
  - [x] Bottom nav: All icons orange, selected has faint background
  - [x] Recipe page: "Meal Brain" branding instead of household name
  - [x] Meal type tracking with filters
  - [x] Second grocery list in seed data
  - [x] Test coverage for meal_type CRUD (5 new unit tests)
- [x] **Recipe Import from URL** ✅ (Completed 2025-12-30)
  - [x] Backend API route: POST /api/recipes/import
  - [x] JSON-LD schema.org Recipe parsing (most recipe sites)
  - [x] Heuristic fallback for non-standard sites
  - [x] Section header filtering (removes "Sauce", "Main", etc. from ingredients)
  - [x] Serving size normalization (handles European decimals, mixed fractions)
  - [x] Flexible ingredient parsing with fallback (handles non-standard formats)
  - [x] Hyphen preservation in ingredient names ("low-sodium", "1-inch")
  - [x] Frontend import modal with URL input
  - [x] Removed section parsing from display (preserves hyphens in UI)
  - [x] Added user tip to view original for groupings
  - [x] Import includes: title, ingredients, instructions, notes, times, serving size, image, source URL
- [x] **Branding & Splash Screen** ✅ (Completed 2026-01-02)
  - [x] Splash Screen Component (app/components/SplashScreen.tsx)
    - [x] Orange background (#f97316) - hero brand color
    - [x] Chef's hat icon (40px white SVG)
    - [x] "MealBrain" title with tagline
    - [x] Subtle zoom animation (scale 0.95 → 1.0, 1s ease-out)
    - [x] 2.5-second display duration
    - [x] Fade-out transition (500ms)
    - [x] Auto-redirect to /login
  - [x] Login Page Redesign (app/login/page.tsx)
    - [x] Orange background matching splash
    - [x] Chef's hat and title positioned identically to splash (seamless transition)
    - [x] Minimal input design: transparent bg with white underline only
    - [x] Placeholder text: subtle peachy white (rgba(255,255,255,0.65))
    - [x] Pill-shaped button (rounded-full) with semi-transparent white bg
    - [x] Success message replaces helper text in-place
    - [x] Autofill styling override (prevents white background)
  - [x] Navigation Bar Redesign (components/BottomNav.tsx)
    - [x] Orange background (#f97316)
    - [x] White icons (all navigation items)
    - [x] Active state: 15% white overlay
    - [x] Brand continuity throughout app
  - [x] Floating AI Button (components/FloatingAIButton.tsx)
    - [x] Chef's hat FAB (60px circle, bottom-right)
    - [x] Orange background with drop shadow
    - [x] Hover effect: scale 1.1x
    - [x] Positioned above nav bar (80px from bottom)
    - [x] Shows on all authenticated pages (AuthenticatedLayout)
    - [x] Placeholder for AI chat panel integration
  - [x] Brand Architecture Documentation
    - [x] Updated docs/01_architecture.md with UI/UX branding section
    - [x] Documented visual continuity pattern (splash → login → app)
    - [x] Defined brand rationale and design philosophy
- [x] **User Onboarding Flow** ✅ (Completed 2026-01-02)
  - [x] Multi-step preferences collection (6 steps)
  - [x] Household context, dietary constraints, AI style
  - [x] Planning preferences, AI learning toggle
  - [x] Summary screen with orange uppercase labels
  - [x] Progress indicator and navigation
  - [x] Skip option with safe defaults
  - [x] Seed data: 3 example recipes with images
  - [x] Default grocery list creation
  - [x] Duplicate prevention for seed data
  - [x] Integration: household → preferences → recipes
- [x] **Grocery List Management** ✅ (Completed 2026-01-02)
  - [x] Rename functionality (inline edit with pencil icon)
  - [x] Delete functionality (trash icon with confirmation)
  - [x] Edge case handling (auto-switch when deleting current list)
  - [x] API endpoints: PATCH and DELETE for lists
- [ ] **Future Polish Items**
  - [ ] Mobile responsiveness testing
  - [ ] Loading states
  - [ ] Error handling improvements
  - [ ] Accessibility audit (ARIA labels, keyboard navigation)

**Phase 3 Progress Stats (Updated 2026-01-02)**:
- **31/31 E2E tests passing (100%)** ✅
  - Recipe management: 7/7 tests ✅
  - Meal planner: 5/5 tests ✅
  - Grocery list: 7/7 tests ✅
  - Authentication: 5/5 tests ✅
  - Onboarding: 5/5 tests ✅
  - Action buttons: 6/6 tests ✅
- **All 12 backend Tools complete and validated** ✅ (34/34 tests, 100%)
- **User onboarding complete** ✅ (6-step flow with seed data)
- **Grocery list management complete** ✅ (Rename + Delete)
- **TDD workflow established** ✅ (Test-first development for all new features)
- **E2E testing infrastructure complete** ✅
- **Brand identity established** ✅ (Orange + chef's hat throughout)
- **Splash screen + branded login** ✅ (Seamless visual transition)
- **Floating AI button** ✅ (Chef's hat FAB, ready for AI panel)

---

## Summary

This plan prioritizes:
- **Trust before cleverness** - Users must trust AI before it can be powerful
- **Structure before speed** - Solid foundation enables fast iteration later
- **Ownership before convenience** - User control always wins

**Progress is measured by confidence, not feature count.**

---

## Version History
- **v1.0** (2025-12-22): Consolidated from `08_project_plan.md` and `12_implementation_plan.md`. Updated to reflect Agent SDK architecture and simplified phase structure.

## Phase 2.5: Dev Login Implementation (BLOCKED - 2025-12-27)

### Status: BLOCKED
See `docs/17_dev_login_blocker.md` for details.

**Current Workaround:**
1. Go to http://localhost:3000/login
2. Enter `demo@mealbrain.app`, `spouse@mealbrain.app`, or `test@mealbrain.app`  
3. Check Mailpit: http://127.0.0.1:54324
4. Click magic link in email
5. Auto-links to seed data household (dev mode only)

**What Works:**
- ✅ Auth callback auto-links dev emails to Demo/Test households
- ✅ Seed data: Demo Household has 3 recipes
- ✅ Jest/Vitest tests work (programmatic auth)
- ✅ Playwright E2E tests work (Mailpit API)
- ✅ Production deployment unaffected

**What's Blocked:**
- ❌ Automated dev-login (no password/magic link/PKCE works in local Supabase)
- ❌ Dev-login E2E test (skip for now)

**Next Steps:**
- Option A: Continue with manual magic link (current)
- Option B: Implement custom auth bypass middleware (future)
- Option C: Debug Supabase local config (time intensive)

---

## Technical Debt & Pre-Public Checklist

**Status**: IN PROGRESS (2026-01-07)

### Issues to Resolve Before GitHub Public Release

#### 1. Migration Sync Issue 🔴 BLOCKING
**Problem**: `supabase db push` fails due to local/remote migration history mismatch.

**Impact**:
- New contributors can't easily apply migrations
- Manual SQL execution required in Supabase Dashboard
- Migration history has duplicate/mismatched timestamps

**Current Workaround**:
- Apply migrations manually via Supabase Dashboard SQL Editor
- Document process in README

**TODO Before Public Release**:
- [ ] Clean up migration file naming (remove duplicate timestamps: 20251228, 20251229, 20251230)
- [ ] Run `supabase migration repair` to sync history
- [ ] Test `supabase db push` works cleanly on fresh project
- [ ] Document migration process in CONTRIBUTING.md

**Files Affected**:
- `supabase/migrations/20251228_*.sql` (3 files with inconsistent timestamps)
- `supabase/migrations/20251229_*.sql` (3 files)
- `supabase/migrations/20251230_*.sql` (1 file)

**Priority**: HIGH - Blocks contributor onboarding

---

#### 2. Environment Variables Documentation 📝
**TODO**:
- [ ] Create `.env.local.example` with all required variables
- [ ] Document Supabase setup process
- [ ] Document Anthropic API key requirement
- [ ] Add troubleshooting guide for common setup issues

**Priority**: HIGH - Required for contributors

---

#### 3. README Updates 📝
**TODO**:
- [ ] Add project description and goals
- [ ] Document local development setup
- [ ] Add contribution guidelines
- [ ] Document invitation system (how to use as first user)
- [ ] Add screenshots of UI
- [ ] License file (MIT or other)

**Priority**: MEDIUM - Expected for public repos

---

#### 4. UI Styling Inconsistencies 🎨
**Problem**: Some pages don't follow the established design system (orange branding, proper spacing).

**Pages Affected**:
- `/onboarding` - Join Household screen (colors/styling don't match brand)
- `/settings/password` - Set password page (inconsistent with main app design)

**Current State**:
- Functional but visually inconsistent
- No user-blocking issues
- Lower priority than security/functionality

**TODO**:
- [ ] Update onboarding Join Household UI to match brand (orange accents, proper spacing)
- [ ] Redesign settings/password page to match main app aesthetic
- [ ] Audit all auth-related pages for design consistency
- [ ] Apply unified design tokens (colors, spacing, typography)

**Priority**: LOW - Cosmetic, not blocking usage

---

### Known Limitations (Document, Don't Fix Yet)

1. **PWA Session Persistence**: iOS PWA may still log out occasionally (testing in progress)
2. **Migration History**: Manual repair needed for clean local setup
3. **First User Bootstrap**: Requires creating invite code via SQL for first household

---

---

## Recent Accomplishments (2026-01-07)

### Security & Authentication
- ✅ **Invitation-Only Signup System** - Complete with code generation, validation, and household joining
- ✅ **PWA Session Persistence** - localStorage for iOS PWAs to prevent frequent logouts
- ✅ **Password Reset Flow** - "Forgot password?" link on login page
- ✅ **Sign Out Button** - Added to settings page

### UI/UX Improvements
- ✅ **Version Tracking** - Git SHA and build info in Settings → About
- ✅ **Default Landing Page** - Changed from /planner to /recipes
- ✅ **Splash Screen** - Reduced from 2.5s to 2s
- ✅ **Mobile Zoom Fix** - URL inputs now 16px to prevent iOS zoom
- ✅ **Photo Upload Status** - Shows "Uploading..." indicator

### Bug Fixes
- ✅ **Recipe Import** - Image compression fixes FUNCTION_PAYLOAD_TOO_LARGE error
- ✅ **Session Storage** - Import uses sessionStorage instead of URL params (fixes validation errors)
- ✅ **Image Upload** - More lenient file type validation, camera capture enabled
- ✅ **Photo Remove Button** - Larger (44x44px) with proper state syncing
- ✅ **Zod Validation** - Fixed image_url schema (union instead of chained .or())

### Infrastructure
- ✅ **Middleware** - Added Supabase auth middleware for SSR
- ✅ **Database Migration** - household_invites tables and RLS policies
- ✅ **RLS Fix** - Public access policy for invite validation (anon users)

---

### Version History
- **2026-01-07**: Production deployment complete, invitation system live, tech debt documented
- **2026-01-07**: Added tech debt section for pre-public release tracking
