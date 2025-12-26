# Session Workflow Checklist

**Purpose**: Ensure Claude maintains documentation discipline across sessions.

**Rule**: README NEVER duplicates status or plans - it only POINTS to authoritative docs.

---

## Every Session Start

**Before doing ANY work**, read these files in order:

1. **`README.md`** - Project overview and doc pointers
2. **`docs/11_project_status.md`** - Current state (AUTHORITATIVE)
3. **`docs/08_implementation_plan.md`** - Roadmap and progress (AUTHORITATIVE)
4. **`resume-context-prompt-for-human.md`** - Quick reference

**Optional** (if relevant to task):
- `docs/01_architecture.md` - System design decisions
- `docs/test-cases/README.md` - Test progress tracker

---

## After Completing ANY Task

**ALWAYS update these 3 files** (in order):

### 1. Update `docs/11_project_status.md`
- Current phase/step
- What's completed
- What's next
- Any architectural decisions made

### 2. Update `docs/08_implementation_plan.md`
- Mark deliverables as complete `[x]`
- Update "Current Status" section
- Update phase progress

### 3. Verify `README.md`
- Does NOT contain status or plans
- ONLY points to authoritative docs
- Quick Start stays generic (no step-by-step)

---

## When Making Architecture Decisions

**Update**: `docs/01_architecture.md`
- Document the decision
- Explain rationale
- Note alternatives considered

---

## When Completing Tests

**Update**: `docs/test-cases/README.md`
- Change status: ⬜ → 🟨 → ✅
- Update test counts (e.g., 0/5 → 5/5)
- Update coverage percentages

---

## Anti-Patterns (DO NOT DO)

❌ **Never duplicate status in README**
- README is a pointer, not a status tracker

❌ **Never create extraneous files**
- Only create files specified in implementation plan
- No "helper docs" or "summaries" unless explicitly requested

❌ **Never skip doc updates**
- Even small changes should update authoritative docs
- "I'll update docs later" = never happens

❌ **Never assume user knows current state**
- Docs must always reflect reality
- User should never have to ask "where are we?"

---

## Before Ending Session

**Final checklist**:
- [ ] `docs/11_project_status.md` reflects current state
- [ ] `docs/08_implementation_plan.md` shows progress
- [ ] README doesn't duplicate status/plans
- [ ] No extraneous files created
- [ ] All architectural decisions documented

---

## Session Handoff Format

When user says "update context" or ends session, provide:

```
**Session Summary**:
- Completed: [list tasks]
- Updated docs: [list which authoritative docs changed]
- Current state: [phase/step]
- Next task: [what should happen next]

**Docs Status**: ✅ All authoritative docs updated
```

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

---

## This File's Role

**Status**: This file is NOT checked into git (in `.claude/` folder)
**Purpose**: Claude's internal checklist
**Update**: Only if workflow changes

Keep this file open in a side panel during work sessions.
