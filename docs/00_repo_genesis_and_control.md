# 00_repo_genesis_and_control.md

## Purpose

This document is the authoritative control plane for the MealBrain project.

It defines:
- When a repository may be created
- What artifacts are allowed to exist at each phase
- How infrastructure is handled (decision vs local vs production)
- Which specifications govern implementation
- How AI agents may participate without drift, hallucination, or premature autonomy

No code, folder, infrastructure, or deployment action may occur unless explicitly permitted by this document.

---

## Project Status

- Current Phase: Phase 0 — Design, Governance, and Infrastructure Decisions
- Repository State: No canonical repository exists yet
- Infrastructure State: Decisions and local scaffolding allowed; no production resources
- Deployment State: No live cloud environments
- Implementation State: No production logic

---

## Specification Authority

The following documents collectively define the system.

### Locked (authoritative, implementation-blocking)

These documents may not be changed without explicit user intent:

- 01_architecture.md
- 02_skills_spec.md
- 03_tools_spec.md
- 04_agent_flow.md
- 05_data_models.md
- 09_ai_governance_and_autonomy.md
- 09_principles.md
- 10_decision_rules.md

Any implementation must conform exactly to these documents.

---

### Living (refinable, but tracked)

These documents may evolve during implementation but must remain aligned with locked specs:

- 06_deployment.md
- 07_ui_spec.md
- 07_ui_wireframes.md
- 07_ui_figma_lite.md
- 08_project_plan.md
- 10_onboarding_and_personalization.md
- 11_project_status.md
- 12_implementation_plan.md

All changes must be reflected in 11_project_status.md.

---

## Infrastructure Model (Explicit)

Infrastructure is intentionally split into three layers:

1. **Decision & Shape**
2. **Local Scaffolding & Emulation**
3. **Production Deployment**

This distinction prevents designing in a vacuum while avoiding premature cloud lock-in.

---

## Phase Definitions

### Phase 0 — Design, Governance, and Infrastructure Decisions (Current)

Allowed:
- Markdown specifications
- Architecture and workflow docs
- UI wireframes and figma-lite descriptions
- Selection of infrastructure vendors (e.g., Supabase, Vercel)
- Database schemas and migrations (SQL)
- Edge/function definitions as stubs
- Local-only infrastructure planning

Explicitly allowed:
- `supabase/` folder with migrations and function placeholders
- Seed/demo data
- API contracts
- Auth model decisions (e.g., magic link)

Explicitly forbidden:
- Production cloud projects
- Live credentials
- Deployed environments
- Real user data

Objective:
- Remove ambiguity
- Lock governance and autonomy rules
- Define infrastructure shape without commitment

Exit criteria:
- Canonical Phase 1 repo structure defined
- Phase 1 explicitly authorized below

---

### Phase 1 — Repo Genesis & Local Infrastructure

Allowed:
- Git repository creation
- Folder structure
- Empty files and stubs
- Test-first (TDD) scaffolding
- Local Supabase usage (`supabase start`)
- Local-only execution

Explicitly forbidden:
- Production Supabase project
- Vercel deployment
- Household authentication enforcement
- Persistent real data

Objective:
- Make structure real without production risk
- Validate seams between UI, agent, skills, and data
- Enable rapid local iteration

---

### Phase 2 — Deterministic Core Implementation

Allowed:
- Skills implementation
- Tool execution logic
- Deterministic CRUD flows
- Unit and integration tests
- Schema validation

AI behavior:
- May propose and explain
- May generate previews
- Must not silently mutate state
- All writes require explicit user approval

---

### Phase 3 — Creative AI Enablement

Allowed:
- Creative meal planning
- Constraint reasoning and optimization
- Multi-recipe planning
- Coach vs collaborator behaviors

Guardrails:
- All persistence flows through deterministic tools
- AI may suggest but never assume intent
- User always confirms changes

---

### Phase 4 — Live Household Deployment

Allowed:
- Supabase production project
- Vercel deployment
- Magic-link authentication
- Household-only access controls
- Real data

Objective:
- Transition from local system to household-use system
- Preserve ownership and control

---

## AI Participation Rules (Global)

AI agents:
- Must not invent APIs
- Must not invent database fields
- Must not invent UI components
- Must not merge phases
- Must not bypass deterministic tools
- Must not write production code before tests

AI must:
- Ask when uncertain
- Preview all mutations
- Explain changes in plain language
- Respect user-defined autonomy level

Violations invalidate the output.

---

## Repository Creation Rules

A repository may be created only after:
- This document exists
- Phase 1 is explicitly authorized below

Any repo created before authorization is non-canonical.

---

## Phase Advancement Log

Manually updated by the user:

- [ ] Phase 0 complete
- [ ] Phase 1 authorized
- [ ] Phase 2 authorized
- [ ] Phase 3 authorized
- [ ] Phase 4 authorized

---

## Phase 1 Authorization

Status: Not authorized yet

This section will be updated once:
- Canonical Phase 1 repo structure is finalized
- Testing approach is locked
- Runtime/language choices are confirmed

---

## Project Ethos

- Ownership over convenience
- Determinism over magic
- Transparency over automation
- Simplicity over cleverness

Speed is allowed only after clarity.
