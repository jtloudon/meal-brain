# 10 – Deterministic Rules

**Explicit, deterministic rules governing recipes, meal plans, groceries, and ingredient handling.**

These rules exist to prevent ambiguity, silent changes, and AI overreach.

**When in conflict**: User intent and explicit confirmation override automation.

---

## Core Principle

> **"Nothing important happens silently."**
>
> Automation exists to reduce effort, not awareness.

---

## 1. Ingredient Identity & Merging

### Matching Rules
Ingredients are considered identical **only if all** of the following match:
- **`ingredient_id`** (links to known ingredient database)
- **`unit`** (cup, tbsp, lb, etc.)
- **`prep_state`** (whole, chopped, diced, etc. - or both null)

### Merging Behavior

**Exact Match → Auto-Merge**:
```
Existing: rice, 1 cup, null prep_state, ingredient_id=123
Incoming: rice, 0.5 cup, null prep_state, ingredient_id=123
───────────────────────────────────────────────────────
Result:   rice, 1.5 cup, null prep_state, ingredient_id=123
```

**Unit Mismatch → No Merge** (requires user resolution):
```
Existing: chicken, 1 lb
Incoming: chicken, 500 g
───────────────────────────────────────────────────────
Result:   chicken, 1 lb  (existing item)
          chicken, 500 g (new item)
```

**Prep State Mismatch → No Merge**:
```
Existing: onion, 1 whole
Incoming: onion, 1 chopped
───────────────────────────────────────────────────────
Result:   onion, 1 whole   (existing item)
          onion, 1 chopped (new item)
```

**Ambiguous Identity** (e.g., "rice" vs "jasmine rice"):
- System **must ask the user** before merging
- AI may **suggest likely merges and explain why**
- AI may **not merge automatically**

### Rationale
Ingredient identity is subjective and context-dependent. Ambiguity must be resolved by the user, not inferred.

---

## 2. Quantity Representation & Math

### Allowed Quantity Formats
- **Numeric + Unit**: `1.5 cup`, `2 lb`, `3 whole`
- **No free-text quantities**: ❌ "a pinch", ❌ "to taste", ❌ "handful"
- **Decimals preferred**: `0.5 cup` not `½ cup` (for math operations)

### Quantity Accumulation
When multiple planned meals contribute quantities of the same ingredient:
- System **defaults to summing quantities**
- Math is **deterministic and tool-driven** (never LLM-generated)
- User must be able to **override before finalizing**

**Example**:
```
Meal 1: rice, 1 cup
Meal 2: rice, 0.75 cup
Meal 3: rice, 1.5 cup
───────────────────────────────
Grocery list: rice, 3.25 cup
```

### Source Traceability
When quantities are combined:
- System **preserves per-recipe sources**
- Total quantity shown alongside individual contributions

**Example Display**:
```
Rice — total: 3.25 cups
• Taco Night: 0.5 cup
• Stir Fry: 1.75 cup
• Curry: 1 cup
```

**Benefits**:
- Maintains traceability
- Enables later plan edits
- Supports undo and AI explanations
- Prevents confusion about "where this came from"

### No Silent Math
- Quantity calculations must be **explicit and visible**
- AI never performs arithmetic in creative reasoning (uses Tools only)
- All math operations logged and reversible

---

## 3. Unit Handling & Conversion

### Allowed Units (Phase 1)
- **Volume**: cup, tbsp, tsp, ml, l, fl oz
- **Weight**: lb, oz, g, kg
- **Count**: whole, piece, can, package, bunch

### Unit Conversion Policy

**Phase 1**: No automatic conversion
- If units differ → create separate items
- User resolves manually

**Example** (no auto-conversion):
```
Existing: milk, 1 cup
Incoming: milk, 250 ml
───────────────────────────────
Result:   milk, 1 cup  (existing)
          milk, 250 ml (new item)
User action required: Manually merge or leave separate
```

**Phase 2+**: Optional conversion with user approval
- Tool proposes conversion: "1 lb ≈ 454g. Merge?"
- User confirms before merge
- Conversion ratios are deterministic (not LLM-estimated)

### Unit Validation
- Units must come from predefined list
- Invalid units rejected at Tool validation layer
- AI must ask user for clarification if unit is ambiguous

---

## 4. Bulk Prep Assumptions

### Default Rule
System **does not assume bulk prep**, even when ingredients repeat across meals.

**No automatic**:
- Grouping of ingredients
- Planning changes
- Grocery math changes
- Prep instructions

Bulk prep remains a **manual cooking decision**, not a planning assumption.

**Rationale**: Some users batch-cook, others don't. The system doesn't infer cooking workflow.

---

## 5. Planner → Grocery List Handoff

### Explicit Push Required
Ingredients are **never auto-added** to grocery lists.

**Required Flow**:
1. User triggers "Add to grocery list" (from planner or recipe)
2. System shows **review modal** with ingredient checklist
3. User selects items (all checked by default)
4. User chooses target list
5. User previews aggregated quantities
6. User confirms
7. Tool executes deterministically

### Review Step (Mandatory)
- Ingredients grouped by category (produce, meat, pantry, dairy, etc.)
- All items **checked by default**
- User may uncheck any item (e.g., already in pantry)
- Preview shows aggregated quantities if merging with existing list

This review step is **required** before grocery list mutation.

---

## 6. Grocery List Selection

### Default Behavior
- A **primary grocery list** is selected by default
- User may change target list during review
- Multiple lists supported (store-specific or trip-specific)

**Example Use Cases**:
- "Target Weekly" (primary grocery run)
- "Costco Trip" (bulk items only)
- "Farmers Market" (produce only)

### List Management
- User creates lists explicitly (not auto-generated)
- Lists can be archived but not deleted (for history)
- Items can be moved between lists manually

---

## 7. Plan Changes After Grocery Push

### Scenario
User edits or removes a meal **after** ingredients were already added to grocery list.

### System Behavior
- Grocery list is **not modified automatically**
- System **notifies the user** of the change
- System **suggests possible adjustments**:
  - "Remove 1 cup rice from grocery list?"
  - "Chicken breast is no longer needed. Update list?"
- User decides what changes to apply

**No silent reversals or quantity changes allowed.**

### Rationale
User may have already shopped, or intentionally kept items for future use. System doesn't assume intent.

---

## 8. Ingredient Categorization

### Category Assignment
Ingredients belong to categories for grocery list organization:
- Produce
- Meat & Seafood
- Dairy & Eggs
- Pantry & Dry Goods
- Frozen
- Bakery
- Other

### Categorization Rules
- Categories assigned at ingredient database level
- User can override category per grocery item
- Grocery list displays items grouped by category
- Category order customizable per household

---

## 9. Dietary Constraints & Filtering

### Constraint Types
- **Hard constraints**: Must be enforced (allergies, strict dietary rules)
- **Soft constraints**: Preferences, can be overridden with user approval

### Filtering Behavior
- Hard constraints: Recipes automatically excluded from suggestions
- Soft constraints: Recipes flagged but still shown

**Example**:
> User: dairy-free (hard constraint)
> Recipe: Contains cheese
> AI: "This recipe has cheese. Since you're dairy-free, I can suggest a substitute or skip it. What would you prefer?"

### No Silent Filtering
- AI never hides options without explaining why
- User can view all recipes regardless of constraints
- Filters are applied to suggestions, not to data access

---

## 10. Recipe Modifications & Substitutions

### Proposal-Only Rule
AI may **propose substitutions** but **never auto-apply** them to persisted recipes.

**Allowed**:
- "This recipe calls for milk. Try almond milk?"
- "You could substitute chicken for tofu here."

**Forbidden**:
- Silently changing recipe ingredients
- Auto-applying substitutions without approval
- Modifying original recipe based on constraints

### User Actions
- **Accept substitution**: Creates new recipe variant (original preserved)
- **Reject substitution**: Uses original recipe as-is
- **Edit manually**: User modifies recipe directly

---

## 11. Ambiguity & Confirmation Handling

### Multiple Ambiguities in Single Action
When **multiple ambiguities** occur in one action (e.g., ingredient identity + quantity math + list selection):
- System consolidates all issues into **one review/confirmation screen**
- User resolves all ambiguities in one step
- Prevents prompt fatigue and fragmented decision-making

**Example Consolidated Review**:
```
┌─────────────────────────────────────┐
│ Review Ingredients                  │
├─────────────────────────────────────┤
│ ⚠ "Rice" might match "Jasmine rice" │
│   ○ Merge (total: 2.5 cup)          │
│   ● Keep separate                   │
├─────────────────────────────────────┤
│ Target list: [Target Weekly ▼]      │
├─────────────────────────────────────┤
│ [✓] Chicken 1 lb                    │
│ [✓] Rice 1.5 cup                    │
│ [ ] Salt (uncheck if in pantry)     │
├─────────────────────────────────────┤
│ (Confirm & Add)   (Cancel)          │
└─────────────────────────────────────┘
```

---

## 12. Reversibility Requirements

### All Mutations Must Be Reversible
- **Soft delete**: Mark `deleted_at` instead of hard delete
- **Undo within session**: User can undo last action immediately
- **Action history**: System tracks recent changes for transparency

### Undo Scope
- **Session-level undo** is sufficient (no deep history required)
- AI must immediately explain what changed
- User can correct mistakes without friction

**Example**:
> AI: "Added 7 meals to planner for next week."
> User: "Undo"
> AI: "Removed 7 meals. Planner is back to previous state."

---

## 13. Validation & Error Handling

### Input Validation (Tool Layer)
- All inputs validated against Zod schemas before execution
- Invalid inputs rejected with clear error messages
- No silent coercion or "fixing" of user input

**Example Validation Errors**:
- ❌ Free-text quantity: "Error: Quantity must be numeric. Please provide a number and unit."
- ❌ Missing unit: "Error: Unit required for quantity. Examples: cup, lb, whole."
- ❌ Invalid date: "Error: Date must be in format YYYY-MM-DD."

### Error Recovery
- Validation errors shown to user with suggested corrections
- User can fix and retry
- No partial writes if any validation fails

---

## 14. Data Integrity Rules

### Transaction Integrity
- All-or-nothing operations (no partial writes)
- Use database transactions where needed
- Rollback on error

### Constraint Enforcement
- Database-level constraints prevent orphaned data
- Foreign key relationships enforced
- Household isolation via RLS policies

### Data Consistency
- Ingredient aggregation math always matches sum of sources
- Recipe ingredients always link to valid recipes
- Planner meals always link to valid recipes
- Grocery items trace back to source recipes (where applicable)

---

## 15. Priority & Conflict Resolution

### When Rules Conflict
**Priority order** (highest to lowest):
1. User explicit confirmation
2. Hard dietary constraints
3. Data integrity rules
4. Soft preferences
5. AI suggestions

### Example Conflict
User asks AI to plan meals including a recipe that violates a hard constraint:
- AI detects conflict
- AI pauses and explains: "This recipe has dairy, but you marked dairy as a hard constraint. Should I skip it or suggest a substitute?"
- User resolves conflict explicitly
- No silent assumptions

---

## Summary Table

| Rule | Behavior | Rationale |
|------|----------|-----------|
| **Ingredient merging** | Only if ingredient_id + unit + prep_state match exactly | Prevents wrong merges |
| **Quantity math** | Deterministic tool execution only | No LLM arithmetic |
| **Unit conversion** | No auto-conversion (Phase 1) | Prevents wrong assumptions |
| **Grocery push** | Explicit user action required | User controls when to shop |
| **Plan changes** | No auto-update of grocery list | User may have already shopped |
| **Substitutions** | Proposal-only, never auto-applied | Preserves original recipes |
| **Reversibility** | All mutations undoable | User can correct mistakes |
| **Ambiguity** | Always ask user | No silent assumptions |
| **Validation** | Reject invalid inputs | Data integrity |

---

## Implementation Checklist

Before deploying any deterministic logic, verify:
- [ ] Does it use validated Tools (not LLM reasoning)?
- [ ] Does it preserve source traceability?
- [ ] Does it ask before merging ambiguous data?
- [ ] Is quantity math fully deterministic?
- [ ] Are all mutations reversible?
- [ ] Does it respect unit matching rules?
- [ ] Does it consolidate ambiguities into one review?
- [ ] Does it enforce user confirmation for writes?

---

## Version History
- **v1.0** (2025-12-22): Consolidated from `10_decision_rules.md`, `02_tools_spec.md` (merged), and `09_ai_behavior_contract.md` (merged)
