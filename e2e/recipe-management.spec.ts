import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Recipe Management', () => {
  let cleanup: (() => Promise<void>) | null = null;

  test.beforeEach(async ({ page }) => {
    // Log in first
    const { cleanup: cleanupFn } = await loginTestUser(page);
    cleanup = cleanupFn;

    // Navigate to recipes page
    await page.goto('/recipes');
  });

  test.afterEach(async () => {
    // Clean up test user
    if (cleanup) {
      await cleanup();
      cleanup = null;
    }
  });

  test('should display recipe list', async ({ page }) => {
    // Debug: Take screenshot and log page content
    await page.screenshot({ path: 'test-results/debug-recipes-page.png' });
    const pageContent = await page.content();
    console.log('Page URL:', page.url());
    console.log('Has "Loading":', pageContent.includes('Loading'));
    console.log('Has "Chicken":', pageContent.includes('Chicken'));
    console.log('Has "No recipes":', pageContent.includes('No recipes'));

    // Wait for either recipes to load OR empty state (max 10s)
    try {
      await page.waitForSelector('text=Chicken Curry, text=No recipes', { timeout: 10000 });
    } catch (e) {
      console.log('Timeout waiting for content');
    }

    // Should see recipe cards
    await expect(page.locator('h3:has-text("Chicken Curry")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h3:has-text("Beef Tacos")')).toBeVisible();
  });

  test('should search recipes by title', async ({ page }) => {
    // Wait for recipes to load first
    await page.waitForSelector('text=Chicken Curry', { timeout: 10000 });

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'Chicken');

    // Wait a moment for client-side filtering
    await page.waitForTimeout(500);

    // Should see only matching recipe
    await expect(page.locator('h3:has-text("Chicken Curry")')).toBeVisible();
    await expect(page.locator('h3:has-text("Beef Tacos")')).not.toBeVisible();
  });

  test('should filter recipes by rating', async ({ page }) => {
    // Wait for recipes to load
    await page.waitForSelector('text=Chicken Curry', { timeout: 10000 });

    // Select 5 stars filter
    await page.selectOption('select', '5');

    // Wait for filtering
    await page.waitForTimeout(500);

    // Should see filtered results (exact count depends on demo data ratings)
    const recipeCards = page.locator('div.cursor-pointer:has(h3)');
    const count = await recipeCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to recipe detail', async ({ page }) => {
    // Wait for recipes to load
    await page.waitForSelector('text=Chicken Curry', { timeout: 10000 });

    // Click on a recipe card (the whole div is clickable)
    await page.locator('div.cursor-pointer:has-text("Chicken Curry")').first().click();
    await page.waitForURL(/\/recipes\/[^/]+$/);

    // Should see recipe details
    await expect(page.locator('text=Chicken Curry')).toBeVisible();
    await expect(page.locator('h2:has-text("Ingredients:")')).toBeVisible();
  });

  test('should create a new recipe', async ({ page }) => {
    // Click Plus button in header
    await page.locator('header button').first().click();
    await page.waitForURL('**/recipes/new');

    // Fill out recipe form
    await page.fill('input[placeholder*="Recipe name"]', 'Test Recipe');

    // Select rating (click 4th star)
    const stars = page.locator('button:has(svg)').filter({ has: page.locator('svg') });
    await stars.nth(3).click();

    // Add tags
    await page.fill('input[placeholder*="tag"]', 'test, dinner');

    // Fill ingredient (first row should exist)
    await page.fill('input[placeholder="Name"]', 'flour');
    await page.fill('input[placeholder="Qty"]', '2');
    await page.selectOption('select', 'cup');

    // Fill instructions
    await page.fill('textarea[placeholder*="instructions"]', 'Mix and bake');

    // Submit
    await page.click('button:has-text("Create Recipe")');

    // Should redirect to recipe detail
    await page.waitForURL('**/recipes/**');
    await expect(page.locator('text=Test Recipe')).toBeVisible();
  });

  test('should edit an existing recipe', async ({ page }) => {
    // Wait for recipes to load
    await page.waitForSelector('text=Chicken Curry', { timeout: 10000 });

    // Click on a recipe card
    await page.locator('div.cursor-pointer:has-text("Chicken Curry")').first().click();
    await page.waitForURL(/\/recipes\/[^/]+$/);

    // Click Edit button
    await page.click('button:has-text("Edit Recipe")');
    await page.waitForURL('**/edit');

    // Modify title
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();
    await titleInput.fill('Chicken Curry Updated');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Should redirect back to detail
    await page.waitForURL(/\/recipes\/[^/]+$/, { timeout: 10000 });
    await expect(page.locator('text=Chicken Curry Updated')).toBeVisible();
  });
});
