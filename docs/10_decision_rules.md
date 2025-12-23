# 10_decision_rules.md
## Deterministic Decision Rules for Planning, Groceries, and Ingredients

This document defines explicit, deterministic rules governing how recipes, meal plans, and grocery lists interact.  
These rules exist to prevent ambiguity, silent changes, and AI overreach.

When in conflict, **user intent and explicit confirmation override automation**.

---

## 1. Ingredient Identity & Merging

### Default Rule
When two ingredients are potentially the same but not identical (e.g., “rice” vs “jasmine rice”):

- The system **must ask the user** before merging
- The AI may **suggest likely merges and explain why**
- The AI may **not merge automatically**

### Rationale
Ingredient identity is subjective and context-dependent. Ambiguity must be resolved by the user, not inferred.

---

## 2. Quantity Accumulation Across Meals

When multiple planned meals contribute quantities of the same ingredient:

- The system **defaults to summing quantities**
- The user must be able to override before finalizing
- Quantity math must be deterministic and tool-driven

No silent math is permitted.

---

## 3. Quantity Representation

### Default Representation
When quantities are combined:

- The system **preserves per-recipe sources**
- A total quantity is shown alongside individual contributions

#### Example
Rice — total: 2¼ cups
• Taco Night: ½ cup
• Stir Fry: 1¾ cups


### Benefits
- Maintains traceability
- Enables later plan edits
- Supports undo and AI explanations
- Prevents confusion about “where this came from”

---

## 4. Bulk Prep Assumptions

### Default Rule
The system **does not assume bulk prep**, even when ingredients repeat across meals.

- No automatic grouping
- No planning changes
- No grocery math changes

Bulk prep remains a **manual cooking decision**, not a planning assumption.

---

## 5. Planner → Grocery List Handoff

### Explicit Push Required
Ingredients are **never auto-added** to grocery lists.

- User must explicitly push ingredients from the planner
- A review step is mandatory before items are added

---

## 6. Ingredient Review Before Adding to Grocery List

### Default Review Experience
- Ingredients are grouped by category (produce, meat, pantry, etc.)
- All items are **checked by default**
- User may uncheck any item (e.g., already in pantry)

This review step is required before grocery list mutation.

---

## 7. Plan Changes After Grocery Push

If a meal is edited or removed **after** groceries were added:

- The grocery list is **not modified automatically**
- The system **notifies the user**
- The system **suggests possible adjustments**
- The user decides what changes to apply

No silent reversals or quantity changes are allowed.

---

## 8. Grocery List Selection

### Default Behavior
- A primary grocery list is selected by default
- The user may change the target list during review

Multiple lists (store-specific or trip-specific) are supported.

---

## 9. Ambiguity & Confirmation Handling

When **multiple ambiguities** occur in a single action (e.g., ingredient identity + quantity math + list selection):

- The system consolidates all issues into **one review/confirmation screen**
- The user resolves all ambiguities in one step

This prevents prompt fatigue and fragmented decision-making.

---

## 10. Guiding Principle

> **Nothing important happens silently.**

Automation exists to reduce effort, not awareness.
