# Integration Test: Grocery Flow (End-to-End)

**Module**: Full grocery generation workflow

**Status**: ⬜ Not started

**Test Count**: 0/1 passing

**Coverage**: 0%

---

## Overview

Integration test covering the complete workflow: Plan meals → Push ingredients → Review → Confirm → Grocery list populated.

**Tests multiple systems**:
- Planner tools
- Grocery tools
- Ingredient aggregation
- Database constraints

---

## Test Case 1: Complete grocery generation flow

**Status**: ⬜

**Given**:
```typescript
// Create 3 recipes
const chickenCurry = await createRecipe({
  title: 'Chicken Curry',
  ingredients: [
    { name: 'chicken', quantity: 1, unit: 'lb' },
    { name: 'rice', quantity: 1, unit: 'cup' },
    { name: 'curry powder', quantity: 2, unit: 'tbsp' },
  ],
});

const stirFry = await createRecipe({
  title: 'Stir Fry',
  ingredients: [
    { name: 'chicken', quantity: 0.5, unit: 'lb' },
    { name: 'rice', quantity: 0.5, unit: 'cup' },
    { name: 'vegetables', quantity: 2, unit: 'cup' },
  ],
});

const tacos = await createRecipe({
  title: 'Tacos',
  ingredients: [
    { name: 'beef', quantity: 1, unit: 'lb' },
    { name: 'tortillas', quantity: 8, unit: 'whole' },
  ],
});
```

**When**:
```typescript
// Step 1: Add meals to planner
await planner.add_meal.execute({
  recipe_id: chickenCurry.id,
  date: '2025-12-23',
  meal_type: 'dinner',
}, context);

await planner.add_meal.execute({
  recipe_id: stirFry.id,
  date: '2025-12-24',
  meal_type: 'lunch',
}, context);

await planner.add_meal.execute({
  recipe_id: tacos.id,
  date: '2025-12-25',
  meal_type: 'dinner',
}, context);

// Step 2: Get all ingredients from planner
const meals = await planner.list_meals.execute({
  start_date: '2025-12-23',
  end_date: '2025-12-25',
}, context);

// Step 3: Collect ingredients from all meals
const allIngredients = meals.data.meals.flatMap(meal =>
  meal.recipe.ingredients
);

// Step 4: Push to grocery list
const groceryListId = await createGroceryList('Weekly Groceries');

const result = await grocery.push_ingredients.execute({
  grocery_list_id: groceryListId,
  ingredients: allIngredients,
}, context);
```

**Then**:
```typescript
expect(result.success).toBe(true);

// Verify aggregation happened correctly
const { data: items } = await supabase
  .from('grocery_items')
  .select('*')
  .eq('grocery_list_id', groceryListId)
  .order('name');

// Should have 6 unique items (some merged)
expect(items).toHaveLength(6);

// Verify chicken merged (1 lb + 0.5 lb = 1.5 lb)
const chicken = items.find(i => i.name === 'chicken');
expect(chicken.quantity).toBe(1.5);
expect(chicken.unit).toBe('lb');

// Verify rice merged (1 cup + 0.5 cup = 1.5 cup)
const rice = items.find(i => i.name === 'rice');
expect(rice.quantity).toBe(1.5);
expect(rice.unit).toBe('cup');

// Verify beef NOT merged (only from one recipe)
const beef = items.find(i => i.name === 'beef');
expect(beef.quantity).toBe(1);
expect(beef.unit).toBe('lb');

// Verify summary message
expect(result.message).toContain('Merged chicken');
expect(result.message).toContain('Merged rice');
expect(result.data.items_merged).toBe(2);
expect(result.data.items_added).toBe(4); // curry powder, vegetables, beef, tortillas
```

---

## Progress Tracking

- [ ] Test Case 1: Complete flow

**When all 1 pass**: Update [../README.md](../README.md) status to ✅
