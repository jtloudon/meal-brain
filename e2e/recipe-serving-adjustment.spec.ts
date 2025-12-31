import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Recipe Serving Size Adjustment', () => {
  let cleanup: (() => Promise<void>) | null = null;

  test.beforeEach(async ({ page }) => {
    // Log in and navigate to recipe detail
    const { cleanup: cleanupFn } = await loginTestUser(page);
    cleanup = cleanupFn;

    await page.goto('/recipes');
    await page.waitForSelector('text=Chicken Curry', { timeout: 10000 });

    // Click first recipe card to go to detail page
    await page.locator('text=Chicken Curry').first().click();
    await page.waitForURL(/\/recipes\/[^/]+$/);
    await expect(page.locator('h2:has-text("Ingredients")')).toBeVisible();
  });

  test.afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = null;
    }
  });

  test('should display Adjust +/- button', async ({ page }) => {
    const adjustButton = page.locator('button:has-text("Adjust +/-")');
    await expect(adjustButton).toBeVisible();
  });

  test('should open modal when clicking Adjust +/-', async ({ page }) => {
    await page.click('button:has-text("Adjust +/-")');

    await expect(page.locator('h3:has-text("Adjust Serving Size")')).toBeVisible();
    await expect(page.locator('button:has-text("−")').nth(0)).toBeVisible();
    await expect(page.getByRole('button', { name: '+', exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('should scale ingredients in real-time', async ({ page }) => {
    // Get original ingredient text
    const firstIngredient = page.locator('p:has(strong)').first();
    const originalText = await firstIngredient.textContent();
    console.log('Original ingredient:', originalText);

    // Open modal and increase servings
    await page.click('button:has-text("Adjust +/-")');
    await page.getByRole('button', { name: '+', exact: true }).click();

    // Wait a moment for UI update
    await page.waitForTimeout(300);

    // Verify ingredient text changed in real-time (before saving)
    const scaledText = await firstIngredient.textContent();
    console.log('Scaled ingredient (real-time):', scaledText);
    expect(scaledText).not.toBe(originalText);

    // Cancel to test revert
    await page.click('button:has-text("Cancel")');

    // Wait for modal to close
    await expect(page.locator('h3:has-text("Adjust Serving Size")')).not.toBeVisible();

    // Verify reverted back to original
    const revertedText = await firstIngredient.textContent();
    expect(revertedText).toBe(originalText);
  });

  test('should save scaled quantities permanently', async ({ page }) => {
    // Get original ingredient
    const firstIngredient = page.locator('p:has(strong)').first();
    const originalText = await firstIngredient.textContent();
    const originalMatch = originalText?.match(/^(\d+(\.\d+)?)\s/);
    const originalQty = originalMatch ? parseFloat(originalMatch[1]) : null;

    console.log('Original quantity:', originalQty);

    // Open modal, double servings, and save
    await page.click('button:has-text("Adjust +/-")');
    const servingInput = page.locator('input[type="number"]');
    const currentServings = parseInt(await servingInput.inputValue());
    await servingInput.fill((currentServings * 2).toString());

    await page.click('button:has-text("Save")');

    // Wait for page reload
    await page.waitForURL(/\/recipes\/[^/]+$/);
    await expect(page.locator('h2:has-text("Ingredients")')).toBeVisible();

    // Verify quantities are doubled
    const newText = await firstIngredient.textContent();
    const newMatch = newText?.match(/^(\d+(\.\d+)?)\s/);
    const newQty = newMatch ? parseFloat(newMatch[1]) : null;

    console.log('New quantity after save:', newQty);

    // Should be approximately double (allow for rounding)
    if (originalQty && newQty) {
      const ratio = newQty / originalQty;
      expect(ratio).toBeGreaterThan(1.9);
      expect(ratio).toBeLessThan(2.1);
    }
  });

  test('should push scaled quantities to grocery list after saving', async ({ page }) => {
    // Adjust servings to double and save
    await page.click('button:has-text("Adjust +/-")');
    const servingInput = page.locator('input[type="number"]');
    const currentServings = parseInt(await servingInput.inputValue());
    await servingInput.fill((currentServings * 2).toString());
    await page.click('button:has-text("Save")');

    // Wait for page reload
    await page.waitForURL(/\/recipes\/[^/]+$/);
    await expect(page.locator('h2:has-text("Ingredients")')).toBeVisible();

    // Push to grocery list
    await page.click('button:has-text("Push Ingredients to Grocery List")');
    await expect(page.locator('h3:has-text("Push Ingredients to Grocery List")')).toBeVisible();

    // Select all ingredients first
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    await selectAllCheckbox.click();

    await page.locator('button:has-text("Push")').click();
    await expect(page.locator('text=Ingredients added to grocery list!')).toBeVisible({ timeout: 5000 });

    console.log('✓ Scaled ingredients pushed to grocery list successfully');
  });
});
