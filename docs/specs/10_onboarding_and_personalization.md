# Onboarding & Personalization Specification

## Purpose
Define a short, humane onboarding flow that:
- Sets AI expectations correctly
- Captures only high-value preferences
- Avoids cognitive overload
- Can be skipped or edited later

This flow establishes the AI’s operating context.

---

## Design Principles

- Maximum clarity, minimum questions
- Nothing is permanent
- No hidden behavior
- All answers are editable later
- Defaults must be safe and reversible

---

## Onboarding Trigger

- First app launch
- Accessible later via Settings → AI Preferences

---

## Step 1: Household Context

**Question**
> “Who is this app for?”

Options:
- Just me
- Me + my spouse/partner
- Household with kids

Purpose:
- Portion sizing
- Meal volume
- Planning cadence

---

## Step 2: Dietary Constraints

**Prompt**
> “Any dietary constraints we should know about?”

UI:
- Checkbox list (multi-select)
- Optional free text

Examples:
- Dairy-free
- Vegetarian
- Gluten-free
- Nut allergy
- None / Skip

Rules:
- Constraints are **soft by default**
- AI must acknowledge them explicitly
- User may later mark any as “hard”

---

## Step 3: AI Collaboration Style

**Prompt**
> “How would you like the AI to work with you?”

### Option A: Coach
Description:
- Explains reasoning
- Offers guidance
- Slower, more thoughtful

### Option B: Collaborator
Description:
- Proposes concrete plans
- Focuses on momentum
- Still asks before changes

Rules:
- This affects tone and verbosity only
- Never affects authority boundaries

---

## Step 4: Planning Preferences

**Prompt**
> “How do you usually plan meals?”

Multi-select:
- Week-by-week
- A few days at a time
- Batch cooking
- Reuse leftovers
- No strong preference

Used for:
- Meal planning suggestions
- Grocery list grouping
- AI defaults (never enforcement)

---

## Step 5: AI Learning Transparency

**Prompt**
> “Should the AI learn from your choices?”

Options:
- Yes — suggest patterns, always ask before applying
- No — don’t learn from my behavior

If yes:
AI must:
- Explain what it learned
- Offer opt-in automation
- Allow reset at any time

---

## Completion Summary

Before finishing, show a summary:
- Household type
- Constraints
- AI role
- Learning status

User must confirm.

---

## Post-Onboarding Guarantees

- Every setting editable later
- No setting enforced silently
- AI always explains why it suggests something

---

## Failure Mode

If user skips onboarding:
- Safe defaults applied
- AI behaves conservatively
- Prompts gently reappear later

---

## Summary

Onboarding sets expectations, not traps.
The goal is trust, not configuration completeness.
