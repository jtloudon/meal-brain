# E2E Test: Recipe Management

**Module**: Recipe CRUD operations

**Status**: ⬜ Not started

**Test Count**: 0/1 passing

**Framework**: Playwright

---

## Overview

Tests complete recipe management workflow: Create, view, edit, delete.

**Screens tested**:
- `/recipes`
- Recipe detail view
- Recipe edit form

---

## Test Case 1: User manages recipes (CRUD)

**Status**: ⬜

**Steps**:
```typescript
// Setup: User authenticated
await loginAsUser('test@example.com');

// CREATE
// 1. Navigate to Recipes
await page.click('[data-testid="tab-recipes"]');

// 2. Create recipe
await page.click('button:has-text("Add Recipe")');
await page.fill('[name="title"]', 'Test Recipe');
await page.fill('[name="instructions"]', 'Test instructions');
await page.click('button:has-text("Add Ingredient")');
await page.fill('[name="ingredients[0].name"]', 'test ingredient');
await page.fill('[name="ingredients[0].quantity"]', '1');
await page.selectOption('[name="ingredients[0].unit"]', 'cup');
await page.click('button:has-text("Save Recipe")');

// READ
// 3. Verify recipe appears in list
await expect(page.locator('text=Test Recipe')).toBeVisible();

// 4. Click to view details
await page.click('text=Test Recipe');
await expect(page.locator('text=Test instructions')).toBeVisible();
await expect(page.locator('text=test ingredient')).toBeVisible();
await expect(page.locator('text=1 cup')).toBeVisible();

// UPDATE
// 5. Edit recipe
await page.click('button:has-text("Edit")');
await page.fill('[name="title"]', 'Updated Recipe');
await page.fill('[name="rating"]', '5');
await page.click('button:has-text("Save")');

// 6. Verify changes
await expect(page.locator('text=Updated Recipe')).toBeVisible();
await expect(page.locator('text=★★★★★')).toBeVisible();

// DELETE
// 7. Delete recipe
await page.click('button:has-text("Delete")');
await page.click('button:has-text("Confirm")'); // Confirmation modal

// 8. Verify recipe removed
await expect(page.locator('text=Updated Recipe')).not.toBeVisible();
```

**Then**:
- All CRUD operations work
- Changes persist
- Deletion is confirmed before executing

---

## Progress Tracking

- [ ] Test Case 1: CRUD operations

**When all 1 pass**: Update [../README.md](../README.md) status to ✅
