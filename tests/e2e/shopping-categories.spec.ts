import { test, expect } from '@playwright/test';
import { seedDatabase, clearDatabase, createTestUser } from '../helpers/db';

test.describe('Shopping Categories', () => {
  let userId: string;
  let householdId: string;

  test.beforeEach(async ({ page }) => {
    await clearDatabase();
    const user = await createTestUser();
    userId = user.id;
    householdId = user.householdId;

    // Login
    await page.goto('http://localhost:3000/dev-login');
    await page.fill('input[type="email"]', 'test@mealbrain.app');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/recipes');
  });

  test.afterEach(async () => {
    await clearDatabase();
  });

  test('should fetch user custom categories from preferences', async ({ page }) => {
    // TODO: Set custom categories via API
    // TODO: Navigate to groceries page
    // TODO: Open edit modal
    // TODO: Verify custom categories appear in dropdown
  });

  test('should display custom categories in edit dropdown', async ({ page }) => {
    // Add a custom category via settings
    await page.goto('http://localhost:3000/settings/shopping-list');

    // Add custom category "Test Category"
    await page.fill('input[placeholder*="category"]', 'Test Category');
    await page.click('button:has-text("Add")');

    // Save settings
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Saved successfully')).toBeVisible();

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Click on first grocery item's edit button
    const editButton = page.locator('button[aria-label*="Edit"]').first();
    await editButton.click();

    // Verify custom category appears in dropdown
    const categorySelect = page.locator('select#edit-category');
    await expect(categorySelect).toBeVisible();

    const options = await categorySelect.locator('option').allTextContents();
    expect(options).toContain('Test Category');
  });

  test('should persist category changes when editing items', async ({ page }) => {
    // Navigate to groceries
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Get first item's original category
    const firstItem = page.locator('[data-testid="grocery-item"]').first();
    const originalCategory = await firstItem.getAttribute('data-category');

    // Click edit
    await firstItem.locator('button[aria-label*="Edit"]').click();

    // Change category
    await page.selectOption('select#edit-category', 'Frozen');

    // Save
    await page.click('button:has-text("Save")');
    await page.waitForLoadState('networkidle');

    // Verify item is now in Frozen category section
    const frozenSection = page.locator('h3:has-text("Frozen")').locator('..');
    await expect(frozenSection.locator('text=' + await firstItem.textContent())).toBeVisible();
  });

  test('should auto-categorize new items based on ingredient name', async ({ page }) => {
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Add new item with known ingredient
    await page.click('button:has-text("Add Item")');

    // Type "chicken breast" (should auto-categorize to Meat & Seafood)
    await page.fill('input[placeholder*="Item name"]', 'chicken breast');
    await page.fill('input[placeholder*="Quantity"]', '2');
    await page.selectOption('select[name="unit"]', 'lb');

    await page.click('button:has-text("Add")');
    await page.waitForLoadState('networkidle');

    // Verify item appears under "Meat & Seafood" category
    const meatSection = page.locator('h3:has-text("Meat & Seafood")').locator('..');
    await expect(meatSection.locator('text=chicken breast')).toBeVisible();
  });

  test('should allow overriding auto-categorized items', async ({ page }) => {
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Add item (auto-categorized as Meat & Seafood)
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="Item name"]', 'chicken breast');
    await page.fill('input[placeholder*="Quantity"]', '2');
    await page.click('button:has-text("Add")');
    await page.waitForLoadState('networkidle');

    // Edit the item and change category
    const item = page.locator('text=chicken breast').locator('..');
    await item.locator('button[aria-label*="Edit"]').click();

    await page.selectOption('select#edit-category', 'Frozen');
    await page.click('button:has-text("Save")');
    await page.waitForLoadState('networkidle');

    // Verify it's now in Frozen section
    const frozenSection = page.locator('h3:has-text("Frozen")').locator('..');
    await expect(frozenSection.locator('text=chicken breast')).toBeVisible();
  });

  test('should fall back to defaults if preferences not set', async ({ page }) => {
    // Don't set any custom categories
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Click edit on any item
    await page.locator('button[aria-label*="Edit"]').first().click();

    // Verify default categories are present
    const categorySelect = page.locator('select#edit-category');
    const options = await categorySelect.locator('option').allTextContents();

    expect(options).toContain('Produce');
    expect(options).toContain('Meat & Seafood');
    expect(options).toContain('Dairy & Eggs');
    expect(options).toContain('Pantry');
    expect(options).toContain('Other');
  });

  test('should group items by category in list view', async ({ page }) => {
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Verify category headers exist
    await expect(page.locator('h3:has-text("Meat & Seafood")')).toBeVisible();
    await expect(page.locator('h3:has-text("Pantry")')).toBeVisible();
    await expect(page.locator('h3:has-text("Produce")')).toBeVisible();

    // Verify items are under their respective categories
    const produceSection = page.locator('h3:has-text("Produce")').locator('..');
    await expect(produceSection.locator('text=onion')).toBeVisible();

    const meatSection = page.locator('h3:has-text("Meat & Seafood")').locator('..');
    await expect(meatSection.locator('text=chicken breast')).toBeVisible();
  });

  test('should sync categories when changed in settings', async ({ page }) => {
    // Go to settings and add custom category
    await page.goto('http://localhost:3000/settings/shopping-list');
    await page.fill('input[placeholder*="category"]', 'My Custom Category');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Save")');

    // Go to groceries
    await page.goto('http://localhost:3000/groceries');
    await page.waitForLoadState('networkidle');

    // Reload to fetch latest categories
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Edit an item
    await page.locator('button[aria-label*="Edit"]').first().click();

    // Verify custom category is available
    const options = await page.locator('select#edit-category option').allTextContents();
    expect(options).toContain('My Custom Category');
  });
});
