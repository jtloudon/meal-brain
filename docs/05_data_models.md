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

```json
{
  "id": "uuid",
  "recipe_id": "uuid",
  "ingredient_id": "uuid",
  "display_name": "rice",
  "quantity": 1.75,
  "unit": "cup",
  "prep_state": "uncooked",
  "optional": false
}
```

Rules:
- quantity must be numeric
- unit is required
- prep_state must match exactly when aggregating

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

Aggregated grocery items with deterministic quantities.

```json
{
  "id": "uuid",
  "grocery_list_id": "uuid",
  "ingredient_id": "uuid",
  "display_name": "rice",
  "quantity": 3.25,
  "unit": "cup",
  "checked": false,
  "created_at": "timestamp"
}
```

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
