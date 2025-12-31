import { test, expect } from '@playwright/test';

test.describe('Recipe Import', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dev-login and authenticate
    await page.goto('http://localhost:3000/dev-login');
    await page.click('text=Demo User');
    await page.waitForURL('**/planner');

    // Navigate to recipes page
    await page.goto('http://localhost:3000/recipes');
    await page.waitForLoadState('networkidle');
  });

  test('imports recipe from URL successfully', async ({ page }) => {
    // Click the import button (assuming it's a plus button or similar)
    await page.click('button:has-text("Import")');

    // Enter a valid recipe URL
    const recipeUrl = 'https://therecipecritic.com/sheet-pan-cashew-chicken/';
    await page.fill('input[type="url"]', recipeUrl);

    // Click import/submit
    await page.click('button:has-text("Import")');

    // Wait for import to complete and recipe to appear
    await page.waitForLoadState('networkidle');

    // Verify recipe appears in list
    await expect(page.locator('text=Sheet Pan Cashew Chicken')).toBeVisible();

    // Click on the recipe to view details
    await page.click('text=Sheet Pan Cashew Chicken');

    // Verify recipe details
    await expect(page.locator('h1:has-text("Sheet Pan Cashew Chicken")')).toBeVisible();

    // Verify serving size is normalized (should be "4" not "4,4 servings")
    await expect(page.locator('text=Serving size')).toBeVisible();
    const servingText = await page.locator('text=/^4\\s+servings?$|^4$/').first();
    await expect(servingText).toBeVisible();

    // Verify ingredients are present
    await expect(page.locator('h2:has-text("Ingredients")')).toBeVisible();

    // Verify source URL is stored and "View Original" button exists
    await expect(page.locator('a:has-text("View Original")')).toBeVisible();
    await expect(page.locator('a:has-text("View Original")')).toHaveAttribute('href', recipeUrl);

    // Verify instructions are present
    await expect(page.locator('text=/whisk together/i')).toBeVisible();
  });

  test('preserves hyphens in ingredient names', async ({ page }) => {
    // Import recipe
    await page.click('button:has-text("Import")');
    const recipeUrl = 'https://therecipecritic.com/sheet-pan-cashew-chicken/';
    await page.fill('input[type="url"]', recipeUrl);
    await page.click('button:has-text("Import")');
    await page.waitForLoadState('networkidle');

    // Navigate to recipe detail
    await page.click('text=Sheet Pan Cashew Chicken');

    // Verify "low-sodium" is preserved (not split into "low" section and "sodium")
    await expect(page.locator('text=low-sodium soy sauce')).toBeVisible();

    // Verify no section headers like "low" or "Main" appear
    const ingredientsSection = page.locator('h2:has-text("Ingredients")').locator('..');
    await expect(ingredientsSection.locator('h3:has-text("low")')).not.toBeVisible();
    await expect(ingredientsSection.locator('h3:has-text("Main")')).not.toBeVisible();

    // Verify "1-inch cubes" is preserved in chicken ingredient
    await expect(page.locator('text=/1-inch cubes/i')).toBeVisible();

    // Verify chicken ingredient is NOT split across lines
    const chickenIngredient = page.locator('text=/chicken breasts.*1-inch/i');
    await expect(chickenIngredient).toBeVisible();
  });

  test('shows helpful tip for imported recipes', async ({ page }) => {
    // Import recipe
    await page.click('button:has-text("Import")');
    await page.fill('input[type="url"]', 'https://therecipecritic.com/sheet-pan-cashew-chicken/');
    await page.click('button:has-text("Import")');
    await page.waitForLoadState('networkidle');

    // Navigate to recipe detail
    await page.click('text=Sheet Pan Cashew Chicken');

    // Verify tip is shown
    await expect(page.locator('text=/Tip:.*View original.*ingredient groupings/i')).toBeVisible();
  });

  test('handles invalid URL gracefully', async ({ page }) => {
    // Click import button
    await page.click('button:has-text("Import")');

    // Enter invalid URL
    await page.fill('input[type="url"]', 'https://invalid-url-that-does-not-exist.com');

    // Click import
    await page.click('button:has-text("Import")');

    // Wait a bit for error to appear
    await page.waitForTimeout(2000);

    // Verify error message is shown
    await expect(page.locator('text=/Failed to.*import|Could not find recipe/i')).toBeVisible();
  });

  test('handles non-recipe page gracefully', async ({ page }) => {
    // Click import button
    await page.click('button:has-text("Import")');

    // Enter URL that's not a recipe (e.g., Google homepage)
    await page.fill('input[type="url"]', 'https://www.google.com');

    // Click import
    await page.click('button:has-text("Import")');

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify error message
    await expect(page.locator('text=/Could not find recipe|Failed to import/i')).toBeVisible();
  });

  test('imports recipe with mixed fraction serving size', async ({ page }) => {
    // This test would need a recipe with mixed fractions in serving size
    // For now, we'll verify the normalization works with the cashew chicken recipe
    await page.click('button:has-text("Import")');
    await page.fill('input[type="url"]', 'https://therecipecritic.com/sheet-pan-cashew-chicken/');
    await page.click('button:has-text("Import")');
    await page.waitForLoadState('networkidle');

    await page.click('text=Sheet Pan Cashew Chicken');

    // Verify serving size is a clean integer, not a decimal or fraction
    const servingSize = page.locator('text=Serving size').locator('..').locator('text=/^\\d+$/');
    await expect(servingSize).toBeVisible();
  });

  test('imports all recipe metadata correctly', async ({ page }) => {
    await page.click('button:has-text("Import")');
    await page.fill('input[type="url"]', 'https://therecipecritic.com/sheet-pan-cashew-chicken/');
    await page.click('button:has-text("Import")');
    await page.waitForLoadState('networkidle');

    await page.click('text=Sheet Pan Cashew Chicken');

    // Verify title
    await expect(page.locator('h1:has-text("Sheet Pan Cashew Chicken")')).toBeVisible();

    // Verify times are present
    await expect(page.locator('text=Prep time')).toBeVisible();
    await expect(page.locator('text=5 min')).toBeVisible();
    await expect(page.locator('text=Cook time')).toBeVisible();
    await expect(page.locator('text=20 min')).toBeVisible();

    // Verify serving size
    await expect(page.locator('text=Serving size')).toBeVisible();

    // Verify image is loaded
    const recipeImage = page.locator('img[src*="therecipecritic"]');
    await expect(recipeImage).toBeVisible();

    // Verify notes/description
    await expect(page.locator('text=/Tender chicken.*crisp.*tender veggies/i')).toBeVisible();
  });
});
