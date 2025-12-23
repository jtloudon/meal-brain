# E2E Test: Meal Planning Flow

**Module**: Complete meal planning user journey

**Status**: ⬜ Not started

**Test Count**: 0/1 passing

**Framework**: Playwright

---

## Overview

Tests the complete user workflow from creating recipes to planning a week of meals.

**Screens tested**:
- `/recipes` (list and create)
- `/planner` (week view)
- Recipe detail modal

---

## Test Case 1: User creates recipes and plans a week

**Status**: ⬜

**Steps**:
```typescript
// Setup: User already authenticated
await loginAsUser('test@example.com');

// 1. Navigate to Recipes tab
await page.click('[data-testid="tab-recipes"]');
await expect(page).toHaveURL('/recipes');

// 2. Create first recipe
await page.click('button:has-text("Add Recipe")');
await page.fill('[name="title"]', 'Chicken Curry');

// Add ingredients
await page.click('button:has-text("Add Ingredient")');
await page.fill('[name="ingredients[0].name"]', 'chicken');
await page.fill('[name="ingredients[0].quantity"]', '1');
await page.selectOption('[name="ingredients[0].unit"]', 'lb');

await page.click('button:has-text("Add Ingredient")');
await page.fill('[name="ingredients[1].name"]', 'rice');
await page.fill('[name="ingredients[1].quantity"]', '1');
await page.selectOption('[name="ingredients[1].unit"]', 'cup');

// Save recipe
await page.click('button:has-text("Save Recipe")');
await expect(page.locator('text=Chicken Curry')).toBeVisible();

// 3. Create second recipe (Beef Tacos)
await page.click('button:has-text("Add Recipe")');
await page.fill('[name="title"]', 'Beef Tacos');
await page.click('button:has-text("Add Ingredient")');
await page.fill('[name="ingredients[0].name"]', 'beef');
await page.fill('[name="ingredients[0].quantity"]', '1');
await page.selectOption('[name="ingredients[0].unit"]', 'lb');
await page.click('button:has-text("Save Recipe")');

// 4. Navigate to Planner
await page.click('[data-testid="tab-planner"]');
await expect(page).toHaveURL('/planner');

// 5. Add Chicken Curry to Monday dinner
await page.click('[data-testid="add-meal-mon-dinner"]');
await page.click('text=Chicken Curry');
await expect(page.locator('[data-testid="meal-mon-dinner"]')).toContainText('Chicken Curry');

// 6. Add Beef Tacos to Wednesday dinner
await page.click('[data-testid="add-meal-wed-dinner"]');
await page.click('text=Beef Tacos');
await expect(page.locator('[data-testid="meal-wed-dinner"]')).toContainText('Beef Tacos');

// 7. Verify week view shows both meals
const meals = await page.locator('[data-testid^="meal-"]').count();
expect(meals).toBe(2);
```

**Then**:
- User successfully planned 2 meals
- Meals visible on calendar
- Data persists on page reload

---

## Progress Tracking

- [ ] Test Case 1: Create and plan meals

**When all 1 pass**: Update [../README.md](../README.md) status to ✅
