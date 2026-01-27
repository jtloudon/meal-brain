# Phase 1 – Repository Structure & Operating Rules

## Purpose

Phase 1 defines the **canonical repo layout and operating rules** for Mealbrain.

Goals:
- Local-first development
- Deterministic behavior
- Test-driven design
- Clear seams between UI, agent, skills, tools, and data
- Infrastructure-aware without cloud dependency

If Phase 1 feels exciting, something is wrong.

---

## Phase 1 Constraints (Non-Negotiable)

- Local execution only  
- No production cloud resources  
- No hosted Supabase project  
- No Vercel / Netlify / Fly / etc  
- No real users  
- No silent AI writes  
- Tests before implementation (TDD strongly preferred)

If something “needs the cloud” in Phase 1, it’s designed wrong.

---

## Canonical Repository Structure (Phase 1)

```
mealbrain/
├── README.md
├── .env.example
├── .gitignore
│
├── docs/
│   ├── 00_repo_genesis_and_control.md
│   ├── 01_architecture.md
│   ├── 02_skills_spec.md
│   ├── 03_tools_spec.md
│   ├── 04_agent_flow.md
│   ├── 05_data_models.md
│   ├── 06_deployment.md
│   ├── 07_ui_spec.md
│   ├── 08_project_plan.md
│   ├── 09_principles.md
│   ├── 10_decision_rules.md
│   ├── 11_project_status.md
│   └── 12_phase_1_repo_structure.md
│
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   ├── seed/
│   │   └── demo_data.sql
│   └── functions/
│       └── README.md
│
├── backend/
│   ├── agent/
│   │   ├── agent_controller.ts
│   │   ├── agent_state.ts
│   │   └── README.md
│   │
│   ├── skills/
│   │   ├── README.md
│   │   └── _skill_template.ts
│   │
│   ├── tools/
│   │   ├── README.md
│   │   └── _tool_template.ts
│   │
│   ├── data/
│   │   ├── db.ts
│   │   └── repositories/
│   │       └── README.md
│   │
│   └── tests/
│       ├── agent.test.ts
│       ├── skills.test.ts
│       └── tools.test.ts
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── README.md
│   │
│   ├── components/
│   │   └── README.md
│   │
│   └── tests/
│       └── ui_smoke.test.ts
│
├── scripts/
│   ├── local_setup.sh
│   └── reset_local_env.sh
```

---

## Hard Responsibility Lines

### docs/
Source of truth. Specs outrank code.

### supabase/
Local-only schema and data shape. No production assumptions.

### backend/agent
Orchestration only. No business logic. No persistence.

### backend/skills
Pure functions. Deterministic. No I/O.

### backend/tools
The *only* place state changes.

### backend/data
Data access only. No business logic.

### frontend/
Thin UI. Explicit user control. No hidden actions.

### scripts/
Make setup cheap. Make resets painless.

---

## Testing Rules

- Tests define behavior
- Untested code is broken
- Agent → Skill → Tool flow must be testable locally

Minimum:
- Agent routing tests
- Skill purity tests
- Tool validation tests
- One UI smoke test

---

## Explicit Non-Goals (Phase 1)

- Production infra
- UI polish
- Auth
- Multi-user support
- Performance tuning
- Notifications

---

## Phase 1 Exit Criteria

Phase 1 is complete when:
- Repo matches this structure
- Local Supabase runs cleanly
- Tests pass locally
- Agent → Skill → Tool flow works end-to-end
- No production infrastructure exists

If it feels boring and predictable: good. Ship Phase 2.
