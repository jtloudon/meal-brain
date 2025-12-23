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

### Phase 1: Local Infrastructure & Repo Genesis
**Duration**: 1 week (part-time, ~10-12 hours)
**Status**: In Progress (Step 0 complete, Step 1 next)

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
- [ ] Set up local Supabase (`supabase start`)

**Database Schema & Migrations**:
- Create tables:
  - `households` (id, name, created_at)
  - `users` (id, household_id, email, created_at)
  - `recipes` (id, household_id, title, ingredients, instructions, tags, rating, notes)
  - `recipe_ingredients` (id, recipe_id, ingredient_id, quantity, unit, prep_state)
  - `ingredients` (id, name, category)
  - `planner_meals` (id, household_id, recipe_id, date, meal_type)
  - `grocery_lists` (id, household_id, name, created_at)
  - `grocery_items` (id, grocery_list_id, ingredient_id, name, quantity, unit, checked, source_recipe_id)
- Enable Row Level Security (RLS) policies for household isolation
- Create seed data (demo household + users + 3-5 recipes)

**Authentication**:
- Supabase Auth with magic-link email
- Auth flow: Email input → Magic link → Session established
- Household association on first login

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

#### Phase 1 Success Criteria

**Stop and validate** if any of these fail:
- [ ] Can run `supabase start` and connect to local DB
- [ ] Can authenticate with magic-link locally
- [ ] Can create household and associate user
- [ ] Can execute at least one Tool successfully
- [ ] All tests pass (even if trivial)
- [ ] Frontend loads on mobile viewport (375px)

**Exit Criteria**:
- You and spouse can log in locally
- Database tables exist with seed data
- At least one Tool (read-only) works end-to-end
- Test infrastructure runs green
- CI pipeline defined (even if not enforced yet)

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

**Active Phase**: Phase 1 (Local Infrastructure & Repo Genesis)
**Current Step**: Step 1 (Infrastructure Setup)
**Estimated Timeline to MVP**: 5-7 weeks (part-time)

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

### Phase 1 Progress: Step 0 ✅ Step 1 ✅ Complete
- [x] Folder structure (cloud-ready)
- [x] TypeScript config
- [x] package.json basics
- [x] Demo data SQL
- [x] All dependencies installed (Next.js, React, TS, Vitest, Playwright, Tailwind v4, Supabase, Lucide)
- [x] All configurations (Next.js, Tailwind, Vitest, env template)
- [x] Dev server verified working
- [ ] **Next**: Write + pass quantity-math tests (Step 2 - TDD)

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
