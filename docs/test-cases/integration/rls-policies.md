# Integration Test: RLS Policies

**Module**: Row-Level Security enforcement

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Tests that RLS policies correctly isolate household data across all tables.

**Tables with RLS**:
- recipes
- planner_meals
- grocery_lists
- grocery_items

---

## Test Case 1: User can only access own household's recipes

**Status**: ⬜

**Given**:
```typescript
// Household A
const householdA = await createHousehold('Household A');
const userA = await createUser('usera@example.com', householdA.id);
const recipeA = await createRecipe({
  title: 'Recipe A',
  household_id: householdA.id,
});

// Household B
const householdB = await createHousehold('Household B');
const userB = await createUser('userb@example.com', householdB.id);
const recipeB = await createRecipe({
  title: 'Recipe B',
  household_id: householdB.id,
});
```

**When**:
```typescript
// User A queries recipes
const { data: recipesForUserA } = await supabase
  .auth.setSession(userA.session)
  .from('recipes')
  .select('*');
```

**Then**:
```typescript
expect(recipesForUserA).toHaveLength(1);
expect(recipesForUserA[0].id).toBe(recipeA.id);
// Recipe B not visible to User A
```

---

## Test Case 2: Spouse invitation grants access to household data

**Status**: ⬜

**Given**:
```typescript
// User A creates household and recipe
const householdA = await createHousehold('Household A');
const userA = await createUser('usera@example.com', householdA.id);
const recipeA = await createRecipe({
  title: 'Recipe A',
  household_id: householdA.id,
});

// User B (spouse) joins same household via invite
const userB = await createUser('userb@example.com', null);
await joinHousehold(userB.id, householdA.id);
```

**When**:
```typescript
// User B queries recipes
const { data: recipesForUserB } = await supabase
  .auth.setSession(userB.session)
  .from('recipes')
  .select('*');
```

**Then**:
```typescript
expect(recipesForUserB).toHaveLength(1);
expect(recipesForUserB[0].id).toBe(recipeA.id);
// User B can now see User A's recipes (same household)
```

---

## RLS Policy Examples

```sql
-- recipes table
CREATE POLICY "Users can only access their household's recipes"
ON recipes
FOR ALL
USING (household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
));

-- planner_meals table
CREATE POLICY "Users can only access their household's planner"
ON planner_meals
FOR ALL
USING (household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
));
```

---

## Progress Tracking

- [ ] Test Case 1: Household isolation
- [ ] Test Case 2: Spouse access granted

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
