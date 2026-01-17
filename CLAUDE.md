# MealBrain Project - Claude Code Reference

## Project Overview
**MealBrain** is a household meal planning and grocery management web application.

**Tech Stack**:
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude API (Haiku for categorization, Sonnet for chat)
- **Deployment**: Vercel (auto-deploys from GitHub main branch)
- **Auth**: Supabase Auth (magic link + password login)

**Key Features**:
- Recipe management with ingredients, tags, ratings
- AI-powered Sous Chef assistant
- Meal planning calendar
- Smart grocery lists with auto-categorization
- Recipe-to-grocery-list ingredient push

---

## Canonical Documentation (Single Source of Truth)

**CRITICAL**: Always read these files at session start:

1. **`docs/11_project_status.md`** ⭐ - **WHERE we are** (current phase, what's working, what's next)
2. **`docs/08_implementation_plan.md`** - **WHAT we're building** (roadmap, deliverables, progress tracking)
3. **`docs/01_architecture.md`** - **WHY we made design decisions** (system design, tech choices)

**Optional** (read if relevant to task):
- `docs/05_data_models.md` - Database schema and relationships
- `docs/test-cases/README.md` - Test coverage and status
- `README.md` - Project setup (does NOT duplicate status/plans, only POINTS to canonical docs)

**Rule**: README NEVER duplicates status or plans - it only POINTS to authoritative docs.

---

## Development Workflow

### Session Start Checklist
**Before doing ANY work**, read files in this order:
1. `docs/11_project_status.md` - Current state
2. `docs/08_implementation_plan.md` - Roadmap and progress
3. Optional: Architecture/test docs if relevant

### After Completing Tasks
**ALWAYS update these files**:

1. **`docs/11_project_status.md`**:
   - Current phase/step
   - What's completed
   - What's next
   - Any architectural decisions made

2. **`docs/08_implementation_plan.md`**:
   - Mark deliverables complete `[x]`
   - Update "Current Status" section
   - Update phase progress

3. **Verify `README.md`**:
   - Does NOT contain status or plans
   - ONLY points to authoritative docs

### After Architecture Decisions
**Update `docs/01_architecture.md`**:
- Document the decision
- Explain rationale
- Note alternatives considered

### Deployment Process
**When user-facing changes are ready**:
1. Commit to git: `git add . && git commit -m "message"`
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys from main branch

**Note**: User expects you to commit & push without being reminded!

---

## Anti-Patterns (DO NOT DO)

❌ **Never duplicate status in README** - README is a pointer, not a status tracker
❌ **Never create extraneous files** - Only create files specified in implementation plan
❌ **Never skip doc updates** - Even small changes should update authoritative docs
❌ **Never assume user knows current state** - Docs must always reflect reality

---

## Database Functions (Supabase)

This project uses **PostgreSQL stored procedures** in Supabase, not Edge Functions:
- **Location in Supabase**: Database → Functions tab
- **Defined in**: `supabase/migrations/*.sql`
- **Called from code**: Via `.rpc()` method
- **Examples**: `get_suggested_category`, `save_category_mapping`, `normalize_item_name`

**Why**: Faster (no network roundtrip), atomic operations, reusable across clients

---

## Code Style Preferences

- **File Operations**: Use Read/Edit/Write tools (not bash cat/sed/echo)
- **Commits**: Use HEREDOC for multiline commit messages
- **Design**: Modern, flat UI (no shadows unless iOS-style), responsive mobile-first
- **Typography**: Consistent font sizes, proper whitespace
- **Git**: Never use --amend unless explicitly requested, never force push to main

---

## Why This Matters

**Single Source of Truth**:
- `docs/11_project_status.md` = WHERE we are
- `docs/08_implementation_plan.md` = WHAT we're building, HOW we're sequencing it
- `docs/01_architecture.md` = WHY we made design decisions
- `README.md` = POINTERS to these docs (never duplicates)

**Benefits**:
- No conflicting information
- Easy to resume sessions
- Clear handoffs between sessions
- Prevents scope creep (only build what's in plan)
