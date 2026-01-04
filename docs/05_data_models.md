# 05 – Data Models

This document defines all core data models for the household meal planning system.
All write operations must conform to these models.
AI agents may read these models but may not mutate them directly.

---

## Household

Represents a private household boundary.
All data is scoped to exactly one household.

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "timestamp"
}
```

---

## User

Users authenticate via magic link and belong to exactly one household.

```json
{
  "id": "uuid",
  "email": "string",
  "household_id": "uuid",
  "created_at": "timestamp"
}
```

---

## UserPreferences

Captures onboarding choices and AI personalization settings.
All fields are optional and editable later.

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "household_context": "just-me | couple | family",
  "dietary_constraints": ["dairy-free", "gluten-free"],
  "ai_style": "coach | collaborator",
  "planning_preferences": ["week-by-week", "batch-cooking", "leftovers"],
  "ai_learning_enabled": true,
  "default_grocery_list_id": "uuid | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Rules**:
- One record per user
- All fields nullable (safe defaults if skipped)
- `dietary_constraints` and `planning_preferences` are arrays
- `default_grocery_list_id` references the user's preferred default grocery list
  - Pre-selected when pushing ingredients from recipes
  - Auto-selected when opening grocery list page
  - Editable via Settings → Shopping list
  - Foreign key to `grocery_lists` table with ON DELETE SET NULL
- AI uses this context but never enforces silently
- Editable via Settings → AI Preferences

---

## Recipe

A recipe is a reusable meal definition.

```json
{
  "id": "uuid",
  "household_id": "uuid",
  "title": "string",
  "rating": 1,
  "tags": ["chicken", "dairy-free"],
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## RecipeIngredient

Ingredients are fully normalized and structured.
Free-text quantities are not allowed.

**Schema Change (2026-01-04):** Added `quantity_max` to support ranges

```json
{
  "id": "uuid",
  "recipe_id": "uuid",
  "ingredient_id": "uuid",
  "display_name": "rice",
  "quantity_min": 1.75,
  "quantity_max": null,
  "unit": "cup",
  "prep_state": "uncooked",
  "optional": false
}
```

**Quantity Range Examples:**
- Single: `quantity_min: 2, quantity_max: null` → "2 cups flour"
- Range: `quantity_min: 1, quantity_max: 2` → "1-2 salmon fillets"
- Decimal range: `quantity_min: 0.5, quantity_max: 1` → "½-1 cup water"

Rules:
- quantity_min must be numeric
- quantity_max is nullable (NULL = no range)
- unit is required
- prep_state must match exactly when aggregating
- When scaling servings, both min and max are scaled proportionally

---

## PlannerMeal

A planned meal instance tied to a date.

```json
{
  "id": "uuid",
  "household_id": "uuid",
  "recipe_id": "uuid",
  "date": "YYYY-MM-DD",
  "meal_type": "breakfast | lunch | dinner"
}
```

---

## GroceryList

User-defined grocery lists.
Multiple lists are allowed per household.

```json
{
  "id": "uuid",
  "household_id": "uuid",
  "name": "Target weekly",
  "created_at": "timestamp"
}
```

---

## GroceryItem

Aggregated grocery items with deterministic quantities and source recipe tracking.

```json
{
  "id": "uuid",
  "grocery_list_id": "uuid",
  "ingredient_id": "uuid",
  "display_name": "rice",
  "quantity": 3.25,
  "unit": "cup",
  "checked": false,
  "source_recipe_id": "uuid | null",
  "prep_state": "string | null",
  "created_at": "timestamp"
}
```

**Notes**:
- `source_recipe_id` tracks which recipe the item was pushed from (null for manually added items)
- Foreign key to recipes table with ON DELETE SET NULL (orphaned items preserved)
- `prep_state` stores preparation instructions from recipe (e.g., "chopped", "diced")
- Multiple items from different recipes can have the same ingredient_id but different source_recipe_id
- UI displays "from [Recipe Name]" as a clickable link when source_recipe_id is present

---

## Ingredient Dictionary (Optional / Future)

Provides canonical naming and alias support.
Used for grouping only, never substitution.

```json
{
  "id": "uuid",
  "canonical_name": "rice",
  "aliases": ["white rice", "jasmine rice"]
}
```

---

## Quantity & Aggregation Guarantees

- All quantities are stored as decimals
- Units are never inferred or auto-converted
- Aggregation only occurs when:
  - ingredient_id matches
  - unit matches
  - prep_state matches (if present)
- Unit mismatches require explicit user confirmation

---

## Design Constraints

- AI agents never write directly to tables
- All writes are deterministic SKILL executions
- No silent data coercion
- All tables are protected by household-level RLS
- All writes must be reversible
