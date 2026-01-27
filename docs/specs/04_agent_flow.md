# Agent Workflow

## Step 1 — Classify Intent
- Creative planning
- Read-only query
- Write request

---

## Creative Example
User:
"Plan 4 dairy-free chicken or turkey dinners using rice for bulk prep."

Agent:
- Reads recipes
- Reasons freely
- Proposes a plan
- Explains tradeoffs
- Requests confirmation

---

## Commit Phase
Only after approval:
- planner.add_meal called per day

---

## Voice Flow
- Mic button → speech_to_text
- Text → creative reasoning
- Optional SKILL calls

---

## Image Flow
- Camera button → upload
- OCR → structured text
- User approval → recipe.create


## Needs
- Explicit read-only vs write boundary
- Confirmation checkpoints before SKILL calls
- Mention of aggregation preview