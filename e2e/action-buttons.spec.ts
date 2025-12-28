import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Action Buttons - Complete Flow', () => {
  let cleanup: (() => Promise<void>) | null = null;

  test.beforeEach(async ({ page }) => {
    const { cleanup: cleanupFn } = await loginTestUser(page);
    cleanup = cleanupFn;
  });

  test.afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = null;
    }
  });

  test.describe('Grocery List Management', () => {
    test('should create a new grocery list', async ({ page }) => {
      // Navigate to groceries page
      await page.goto('http://localhost:3000/groceries');

      // Click "New List" button
      await page.click('text=New List');

      // Fill in list name
      await page.fill('input[placeholder*="List name"]', 'Weekly Groceries');

      // Click Create button
      await page.click('button:has-text("Create")');

      // Wait for modal to close
      await expect(page.locator('text=Create New Grocery List')).not.toBeVisible();

      // Verify list appears in dropdown
      await expect(page.locator('select#list-selector')).toContainText('Weekly Groceries');
    });

    test('should add an item to grocery list', async ({ page }) => {
      // Navigate to groceries page
      await page.goto('http://localhost:3000/groceries');

      // Verify we have the default seeded list selected
      await expect(page.locator('select#list-selector')).toBeVisible();

      // Click "Add Item" button
      await page.click('text=Add Item');

      // Fill in item details
      await page.fill('input[placeholder*="Item name"]', 'Milk');
      await page.fill('input[placeholder="Qty"]', '2');
      await page.selectOption('select', 'gallon');

      // Click Add button
      await page.click('button:has-text("Add")');

      // Wait for modal to close
      await expect(page.locator('text=Add Item to List')).not.toBeVisible();

      // Verify item appears in list
      await expect(page.locator('text=Milk')).toBeVisible();
      await expect(page.locator('text=2 gallon')).toBeVisible();
    });

    test('should check and uncheck items', async ({ page }) => {
      // Navigate to groceries page
      await page.goto('http://localhost:3000/groceries');

      // Add an item first
      await page.click('text=Add Item');
      await page.fill('input[placeholder*="Item name"]', 'Eggs');
      await page.click('button:has-text("Add")');

      // Wait for item to appear
      await expect(page.locator('text=Eggs')).toBeVisible();

      // Click the checkbox to check the item
      const checkbox = page.locator('button[aria-label*="Check Eggs"]').first();
      await checkbox.click();

      // Verify item is checked (should have strikethrough)
      await expect(page.locator('text=Eggs').locator('..')).toHaveClass(/line-through/);

      // Click again to uncheck
      await page.locator('button[aria-label*="Uncheck Eggs"]').first().click();

      // Verify item is unchecked
      await expect(page.locator('text=Eggs').locator('..')).not.toHaveClass(/line-through/);
    });
  });

  test.describe('Recipe Actions', () => {
    test('should navigate to planner when clicking "Add to Planner"', async ({ page }) => {
      // Go to recipes page
      await page.goto('http://localhost:3000/recipes');

      // Click on first recipe (Chicken Curry from seed data)
      await page.click('text=Chicken Curry');

      // Wait for recipe detail page (use main heading, not AuthenticatedLayout header)
      await expect(page.locator('main h1:has-text("Chicken Curry")')).toBeVisible();

      // Click "Add to Planner" button
      await page.click('button:has-text("Add to Planner")');

      // Should navigate to planner add page
      await expect(page).toHaveURL(/\/planner\/add/);
      await expect(page.locator('text=Select Recipe')).toBeVisible();
    });

    test('should push ingredients to grocery list', async ({ page }) => {
      // Go to recipes page
      await page.goto('http://localhost:3000/recipes');

      // Click on first recipe
      await page.click('text=Chicken Curry');

      // Wait for recipe detail page (use main heading, not AuthenticatedLayout header)
      await expect(page.locator('main h1:has-text("Chicken Curry")')).toBeVisible();

      // Click "Push Ingredients to Grocery List" button
      await page.click('button:has-text("Push Ingredients to Grocery List")');

      // Wait for modal to appear
      await expect(page.locator('text=Push Ingredients to Grocery List')).toBeVisible();

      // Verify grocery list selector is visible with default list
      await expect(page.locator('select').last()).toBeVisible();

      // Click Push button
      await page.click('button:has-text("Push")');

      // Wait for success alert
      page.once('dialog', async dialog => {
        expect(dialog.message()).toBe('Ingredients pushed to grocery list!');
        await dialog.accept();
      });

      // Verify modal closes
      await expect(page.locator('text=Push Ingredients to Grocery List')).not.toBeVisible();

      // Navigate to grocery page to verify
      await page.goto('http://localhost:3000/groceries');

      // Verify ingredients from recipe appear in list
      await expect(page.locator('text=Chicken')).toBeVisible();
      await expect(page.locator('text=Onion')).toBeVisible();
    });
  });

  test.describe('Move Items Between Lists', () => {
    test('should move item from one list to another while preserving state', async ({ page }) => {
      // Step 1: Go to groceries page (seeded data has "This Week" list)
      await page.goto('http://localhost:3000/groceries');

      // Create a second list to move items to
      await page.click('text=New List');
      await page.fill('input[placeholder*="List name"]', 'Next Week');
      await page.click('button:has-text("Create")', { force: true });
      await expect(page.locator('select#list-selector')).toContainText('Next Week');

      // Step 2: Select the seeded "This Week" list
      await page.selectOption('select#list-selector', { label: 'This Week' });

      // Verify at least one item exists (from seed data)
      await expect(page.locator('text=chicken breast')).toBeVisible({ timeout: 5000 });

      // Step 3: Move item to "Next Week" list using dropdown
      // Find the item row and select the "Move to" dropdown
      const itemRow = page.locator('text=chicken breast').locator('..').locator('..');
      await itemRow.locator('select[aria-label*="Move"]').selectOption({ label: 'Next Week' });

      // Wait for move to complete and UI to update
      await page.waitForTimeout(1000);

      // Verify item disappears from current view
      await expect(page.locator('text=chicken breast')).not.toBeVisible({ timeout: 3000 });

      // Step 5: Verify item no longer in "This Week" list
      await page.selectOption('select#list-selector', { label: 'This Week' });
      await expect(page.locator('text=chicken breast')).not.toBeVisible();

      // Step 4: Verify item appears in "Next Week" list
      await page.selectOption('select#list-selector', { label: 'Next Week' });
      await expect(page.locator('text=chicken breast')).toBeVisible();
      await expect(page.locator('text=1.5 lb')).toBeVisible();
    });
  });

  test.describe('Complete User Flow', () => {
    test('full workflow: create list -> add recipe to planner -> push ingredients', async ({ page }) => {
      // Step 1: Create a new grocery list
      await page.goto('http://localhost:3000/groceries');
      await page.click('text=New List');
      await page.fill('input[placeholder*="List name"]', 'This Week');
      await page.click('button:has-text("Create")', { force: true });

      // Step 2: Go to planner and add a meal
      await page.goto('http://localhost:3000/planner/add');
      await page.click('text=Chicken Curry');
      await page.selectOption('select', { label: 'dinner' });
      await page.click('button:has-text("Add to Planner")');

      // Should navigate back to planner
      await expect(page).toHaveURL('/planner');

      // Step 3: Go back to recipe and push ingredients
      await page.goto('http://localhost:3000/recipes');
      await page.click('text=Chicken Curry');
      await page.click('button:has-text("Push Ingredients to Grocery List")');

      // Select the "This Week" list
      await page.selectOption('select', { label: 'This Week' });
      await page.click('button:has-text("Push")');

      // Wait for success
      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      // Step 4: Verify ingredients are in the new list
      await page.goto('http://localhost:3000/groceries');
      await page.selectOption('select#list-selector', { label: 'This Week' });

      // Verify at least one ingredient appears
      await expect(page.locator('text=Chicken')).toBeVisible();
    });
  });
});
