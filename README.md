# MealBrain

> **An AI sous chef you control - helpful, never bossy**

A mobile-first web app for planning meals, managing recipes, and generating grocery lists—with an AI assistant that suggests but never surprises.

---

## Project Status

**Current Phase**: Phase 1 COMPLETE ✅ → Moving to Phase 2

**For detailed status and roadmap**, see:
- **[Implementation Plan](docs/08_implementation_plan.md)** - Complete execution roadmap, phase breakdown, success criteria
- **[Project Status](docs/11_project_status.md)** - Current state snapshot, what's done, what's next
- **[Test Progress](docs/test-cases/README.md)** - Test coverage tracker (26/58 tests passing, 100% Phase 1 coverage)

---

## Quick Start

```bash
# Clone repository
git clone <repo-url>
cd meal-brain

# Install dependencies
npm install

# Start local Supabase
supabase start

# Run database migrations
supabase db reset

# Start development server
npm run dev

# Run tests
npm run test
```

---

## Documentation (Source of Truth)

All project specifications live in `/docs`:

### Core Architecture
- **[01_architecture.md](docs/01_architecture.md)** - System design, Agent SDK pattern, tech stack
- **[02_tools_spec.md](docs/02_tools_spec.md)** - Deterministic Tools (Agent SDK skills)
- **[04_agent_flow.md](docs/04_agent_flow.md)** - AI workflow and intent classification
- **[05_data_models.md](docs/05_data_models.md)** - Complete database schemas

### Implementation & Planning
- **[08_implementation_plan.md](docs/08_implementation_plan.md)** ⭐ **Master roadmap**
- **[11_project_status.md](docs/11_project_status.md)** ⭐ **Current status**
- **[12_phase_1_repo_structure.md](docs/12_phase_1_repo_structure.md)** - Canonical folder structure

### AI Governance
- **[09_ai_behavior_contract.md](docs/09_ai_behavior_contract.md)** - AI behavior rules, autonomy boundaries
- **[10_deterministic_rules.md](docs/10_deterministic_rules.md)** - Ingredient merging, quantity math, workflow rules

### UI/UX Design
- **[07_ui_design_system.md](docs/07_ui_design_system.md)** - Complete design system, wireframes, components

### Development
- **[13_external_services.md](docs/13_external_services.md)** - All third-party dependencies (Claude 4.5, Supabase, Vercel)
- **[14_error_handling.md](docs/14_error_handling.md)** - Error strategies, graceful degradation
- **[15_testing_strategy.md](docs/15_testing_strategy.md)** - Testing pyramid, frameworks, coverage targets
- **[16_authentication_flow.md](docs/16_authentication_flow.md)** - Magic-link auth, household management
- **[test-cases/](docs/test-cases/)** ⭐ **TDD test specifications** (organized by module)

### Additional Docs
- **[00_repo_genesis_and_control.md](docs/00_repo_genesis_and_control.md)** - Phase gates, AI participation rules
- **[06_deployment.md](docs/06_deployment.md)** - Infrastructure model
- **[10_onboarding_and_personalization.md](docs/10_onboarding_and_personalization.md)** - User onboarding flow

---

## Technology Stack

**Frontend**:
- Next.js 14+ (App Router)
- React with TypeScript
- Tailwind CSS + shadcn/ui
- Lucide icons

**Backend**:
- Supabase (Postgres, Auth, Edge Functions)
- Anthropic Agent SDK
- Claude 4.5 Sonnet (AI)

**Testing**:
- Vitest (unit + integration)
- Playwright (E2E)

**Hosting**:
- Vercel (frontend)
- Supabase Cloud (database + auth)

---

## Project Principles

### Core Philosophy
> **"Creativity upstream. Determinism downstream."**
>
> User control always wins over AI autonomy.

### Success Metric
> **"This app is successful if my spouse has less frustration about meal planning."**

### Key Principles
1. **Mobile-first** - Optimized for one-handed phone use
2. **User control over AI autonomy** - AI suggests, never surprises
3. **Reversibility** - All actions are undoable
4. **Transparency** - User always knows what changed and why
5. **Data ownership** - Your data, your household, your rules

---

## Features (Roadmap)

### Phase 1 (MVP Foundation) - ✅ COMPLETE
- ✅ Documentation complete
- ✅ Local Supabase setup
- ✅ Database schema + migrations (2 migrations applied)
- ✅ Test infrastructure (Vitest + Playwright)
- ✅ 3 Tools implemented and tested (recipe.create, planner.add_meal, grocery.push_ingredients)
- ✅ Authentication (magic-link flow working end-to-end)

### Phase 2 (Core CRUD)
- Recipe management (create, edit, delete)
- Meal planner (week view, add/remove meals)
- Grocery list generation
- Ingredient aggregation

### Phase 3 (AI Integration)
- AI chat panel
- Meal suggestions
- Week planning assistance
- Read-only AI tools

### Phase 4 (AI Actions)
- AI writes with approval
- Tool confirmation flows
- Grocery list intelligence

### Phase 5+ (Enhancements)
- Voice input (Web Speech API)
- OCR recipe import (Phase 3+)
- Recipe search/discovery
- Nutrition tracking
- Advanced filtering

---

## Development Workflow

### Test-Driven Development
1. Check [docs/test-cases/README.md](docs/test-cases/README.md) for progress tracker
2. Pick next test case file (e.g., `unit/quantity-math.md`)
3. Write failing test based on Given/When/Then spec
4. Implement minimal code to pass
5. Refactor while keeping tests green
6. Update progress tracker (⬜ → 🟨 → ✅)

### Git Workflow
1. Work on feature branch
2. Run tests (`npm run test`)
3. Commit with descriptive message
4. Push to GitHub
5. Create PR (Phase 2+)

### Code Review Checklist
- [ ] Does it respect user control?
- [ ] Does it ask before mutating state?
- [ ] Is it reversible?
- [ ] Does it explain reasoning?
- [ ] Is it tested?
- [ ] Does it work on mobile?

---

## Cost Estimate

**Phase 1 (MVP)**:
- Supabase: Free tier
- Claude 4.5 Sonnet: ~$2-5/month
- Vercel: Free tier
- **Total**: ~$2-5/month for 2-user household

See [docs/13_external_services.md](docs/13_external_services.md) for details.

---

## Contributing

This is a personal project for household use (2 users). Not currently accepting external contributions.

---

## License

Private/Personal Use

---

## Questions?

Refer to documentation in `/docs` - it's the source of truth for all decisions and specifications.

For implementation details, always check:
1. **[Implementation Plan](docs/08_implementation_plan.md)** - What to build and when
2. **[Project Status](docs/11_project_status.md)** - Where we are right now
3. **[Test Cases](docs/17_test_cases.md)** - What behavior to implement (TDD)
