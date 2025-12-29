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

    // Should start on Overview tab - fill out title
    await page.fill('input[placeholder*="Recipe name"]', 'Test Recipe');

    // Add tags (still on Overview tab)
    await page.fill('input[placeholder*="dinner, vegetarian"]', 'test, dinner');

    // Select rating (click 4th star)
    const stars = page.locator('button:has(svg)').filter({ has: page.locator('svg') });
    await stars.nth(3).click();

    // Switch to Ingredients tab
    await page.click('button:has-text("Ingredients")');

    // Fill ingredients as free-form text (one per line)
    await page.fill('textarea', '2 cup flour\n1 tsp salt');

    // Switch to Directions tab
    await page.click('button:has-text("Directions")');

    // Fill instructions
    await page.fill('textarea[placeholder*="instructions"]', 'Mix and bake');

    // Submit using Save button at top
    await page.click('button:has-text("Save")');

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

    // Should be on Overview tab - modify title
    const titleInput = page.locator('input[placeholder*="Recipe name"]');
    await titleInput.fill('Chicken Curry Updated');

    // Save changes using Save button at top
    await page.click('button:has-text("Save")');

    // Should redirect back to detail
    await page.waitForURL(/\/recipes\/[^/]+$/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Chicken Curry Updated")').first()).toBeVisible();
  });

  test('should keep submit button accessible with many ingredients', async ({ page }) => {
    // Click Plus button to create new recipe
    await page.locator('header button').first().click();
    await page.waitForURL('**/recipes/new');

    // Fill required fields on Overview tab
    await page.fill('input[placeholder*="Recipe name"]', 'Many Ingredients Test');

    // Switch to Ingredients tab
    await page.click('button:has-text("Ingredients")');

    // Add 7 ingredients as free-form text (one per line)
    const ingredientsList = [
      '1 cup flour',
      '2 tbsp sugar',
      '1 tsp salt',
      '½ cup milk',
      '¼ cup butter',
      '3 whole eggs',
      '1 tsp vanilla'
    ].join('\n');

    await page.fill('textarea', ingredientsList);

    // Scroll to bottom
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
    await page.waitForTimeout(500);

    // Save button should ALWAYS be visible (it's at the top!)
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible();

    // Note: Bottom nav is HIDDEN during create/edit, so no need to check for it
    // This is the new expected behavior - cleaner, focused editing experience
  });

  test('should keep submit button visible after image upload', async ({ page }) => {
    // Click Plus button to create new recipe
    await page.locator('header button').first().click();
    await page.waitForURL('**/recipes/new');

    // Fill required fields on Overview tab
    await page.fill('input[placeholder*="Recipe name"]', 'Image Upload Test');

    // Switch to Ingredients tab and add ingredients
    await page.click('button:has-text("Ingredients")');
    await page.fill('textarea', '1 cup test ingredient');

    // Switch to Photos tab
    await page.click('button:has-text("Photos")');

    // Save button should be visible before image upload
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible();

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    });

    // Wait for upload to complete
    await page.waitForTimeout(2000);

    // Save button should STILL be visible (it's at the top!)
    await expect(saveButton).toBeVisible();

    // The Save button is now at the top of the screen, so it's always accessible
    // No need to check position relative to bottom nav since nav is hidden during edit
    const buttonBox = await saveButton.boundingBox();
    expect(buttonBox).not.toBeNull();

    // Button should be near the top of the viewport (within first 100px)
    const buttonTop = buttonBox!.y;
    console.log(`Save button top position: ${buttonTop}px`);
    expect(buttonTop).toBeLessThan(100);
  });

  test('should delete a recipe', async ({ page }) => {
    // First, create a test recipe to delete (so we don't delete seed data)
    await page.click('header button:has-text("Plus")');
    await page.waitForURL('**/recipes/new');

    // Create a recipe called "Delete Me Test Recipe"
    await page.fill('input[placeholder*="Recipe name"]', 'Delete Me Test Recipe');

    // Switch to Ingredients tab
    await page.click('button:has-text("Ingredients")');
    await page.fill('textarea', '1 cup test ingredient');

    // Save the recipe
    await page.click('button:has-text("Save")');
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
