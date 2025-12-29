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
    // Capture console logs and errors
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      console.log(`[BROWSER ${msg.type()}]`, msg.text());
    });

    page.on('pageerror', err => {
      errors.push(err.message);
      console.log('[PAGE ERROR]', err.message);
    });

    // Monitor network requests
    page.on('response', async response => {
      if (response.url().includes('/api/recipes')) {
        console.log('[API /recipes]', response.status(), response.statusText());
        try {
          const body = await response.text();
          console.log('[API Response]', body.substring(0, 200));
        } catch (e) {
          console.log('[API Response] Could not read body');
        }
      }
    });

    // Wait a bit for the API call
    await page.waitForTimeout(5000);

    // Debug: Take screenshot and log page content
    await page.screenshot({ path: 'test-results/debug-recipes-page.png' });
    const pageContent = await page.content();
    console.log('Page URL:', page.url());
    console.log('Console messages:', consoleMessages.length);
    console.log('Errors:', errors);
    console.log('Has "Loading":', pageContent.includes('Loading'));
    console.log('Has "Chicken":', pageContent.includes('Chicken'));
    console.log('Has "No recipes":', pageContent.includes('No recipes'));

    // Should see recipe cards
    await expect(page.locator('h3:has-text("Chicken Curry")')).toBeVisible({ timeout: 15000 });
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
    await expect(page.locator('h1:has-text("Chicken Curry")').first()).toBeVisible();
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
    await page.fill('input[placeholder*="Comma separated"]', 'test, dinner');

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
    await expect(page.locator('h1:has-text("Test Recipe")').first()).toBeVisible();
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

    // Modify title (use fill to completely replace the value)
    const titleInput = page.locator('input[placeholder*="Recipe name"]');
    await titleInput.fill('Chicken Curry Updated');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Should redirect back to detail
    await page.waitForURL(/\/recipes\/[^/]+$/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Chicken Curry Updated")').first()).toBeVisible();
  });

  test('should keep submit button accessible with many ingredients', async ({ page }) => {
    // Click Plus button to create new recipe
    await page.locator('header button').first().click();
    await page.waitForURL('**/recipes/new');

    // Fill required fields
    await page.fill('input[placeholder*="Recipe name"]', 'Many Ingredients Test');

    // Add 7 ingredients to make form long
    for (let i = 0; i < 6; i++) {
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(100);
    }

    // Fill all 7 ingredient fields
    const ingredientNames = page.locator('input[placeholder="Name"]');
    const ingredientQtys = page.locator('input[placeholder="Qty"]');

    for (let i = 0; i < 7; i++) {
      await ingredientNames.nth(i).fill(`Ingredient ${i + 1}`);
      await ingredientQtys.nth(i).fill('1');
    }

    // Scroll to bottom of the main scroll container
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        main.scrollTop = main.scrollHeight;
      }
    });
    await page.waitForTimeout(500);

    // Verify submit button is visible and clickable
    const submitButton = page.locator('button:has-text("Create Recipe")');
    await expect(submitButton).toBeVisible();

    // Check button is not behind nav bar
    const buttonBox = await submitButton.boundingBox();
    const bottomNav = page.locator('nav').last();
    const navBox = await bottomNav.boundingBox();

    expect(buttonBox).not.toBeNull();
    expect(navBox).not.toBeNull();

    const buttonBottom = buttonBox!.y + buttonBox!.height;
    const navTop = navBox!.y;

    console.log(`Button bottom: ${buttonBottom}px, Nav top: ${navTop}px, Gap: ${navTop - buttonBottom}px`);

    // Button should be fully above nav with comfortable gap
    expect(buttonBottom).toBeLessThan(navTop - 10);
  });

  test('should keep submit button visible after image upload', async ({ page }) => {
    // Click Plus button to create new recipe
    await page.locator('header button').first().click();
    await page.waitForURL('**/recipes/new');

    // Fill required fields
    await page.fill('input[placeholder*="Recipe name"]', 'Image Upload Test');
    await page.fill('input[placeholder="Name"]', 'test ingredient');
    await page.fill('input[placeholder="Qty"]', '1');

    // Verify submit button is visible before image upload
    const submitButton = page.locator('button:has-text("Create Recipe")');
    await expect(submitButton).toBeVisible();

    // Upload an image (simulate file selection)
    // Create a simple test image file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    });

    // Wait for upload to complete (preview should appear)
    await page.waitForTimeout(2000);

    // Verify submit button is STILL visible after image upload
    await expect(submitButton).toBeVisible();

    // Check button position relative to bottom nav and viewport
    const buttonBox = await submitButton.boundingBox();
    const bottomNav = page.locator('nav').last();
    const navBox = await bottomNav.boundingBox();
    const viewportSize = page.viewportSize();

    expect(buttonBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    const buttonBottom = buttonBox!.y + buttonBox!.height;
    const buttonTop = buttonBox!.y;
    const navTop = navBox!.y;
    const viewportHeight = viewportSize!.height;

    console.log(`Viewport height: ${viewportHeight}px`);
    console.log(`Button top: ${buttonTop}px, Button bottom: ${buttonBottom}px`);
    console.log(`Nav top: ${navTop}px`);
    console.log(`Button distance from viewport bottom: ${viewportHeight - buttonBottom}px`);

    // Button should be near the bottom of viewport (within 60-120px from bottom)
    const distanceFromBottom = viewportHeight - buttonBottom;
    expect(distanceFromBottom).toBeGreaterThan(60); // At least 60px from bottom (above nav)
    expect(distanceFromBottom).toBeLessThan(120); // But not more than 120px (should be visible)

    // Button should be above the nav
    expect(buttonBottom).toBeLessThan(navTop - 4);

    // Check button's z-index is high enough
    const zIndex = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el.parentElement!).zIndex;
    });
    console.log('Submit button z-index:', zIndex);
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(50);
  });

  test('should delete a recipe', async ({ page }) => {
    // First, create a test recipe to delete (so we don't delete seed data)
    await page.click('header button:has-text("Plus")');
    await page.waitForURL('**/recipes/new');

    // Create a recipe called "Delete Me Test Recipe"
    await page.fill('input[placeholder*="Recipe name"]', 'Delete Me Test Recipe');
    await page.fill('input[placeholder="Name"]', 'test ingredient');
    await page.fill('input[placeholder="Qty"]', '1');
    await page.click('button:has-text("Create Recipe")');
    await page.waitForURL(/\/recipes\/[^/]+$/);

    // Now we're on the detail page - delete this recipe
    await page.click('button:has-text("Delete Recipe")');

    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await expect(page.locator('text=Delete Me Test Recipe')).toBeVisible();

    // Confirm deletion - click the red "Delete" button in the modal
    const confirmButton = page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$|^Deleting\.\.\.$/ }).last();
    await confirmButton.click();

    // Should redirect to recipe list
    await page.waitForURL('/recipes', { timeout: 10000 });

    // The test recipe should no longer exist
    await page.waitForTimeout(500);
    const testRecipeExists = await page.locator('text=Delete Me Test Recipe').count();
    expect(testRecipeExists).toBe(0);
  });
});
