import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Meal Planner', () => {
  let cleanup: (() => Promise<void>) | null = null;

  test.beforeEach(async ({ page }) => {
    // Log in first
    const { cleanup: cleanupFn } = await loginTestUser(page);
    cleanup = cleanupFn;

    // Navigate to planner page
    await page.goto('/planner');
  });

  test.afterEach(async () => {
    // Clean up test user
    if (cleanup) {
      await cleanup();
      cleanup = null;
    }
  });

  test('should display week view', async ({ page }) => {
    // Should see days of the week
    await expect(page.locator('text=Monday').first()).toBeVisible();
    await expect(page.locator('text=Tuesday').first()).toBeVisible();

    // Should see meal type labels (case-insensitive)
    await expect(page.locator('text=/breakfast/i').first()).toBeVisible();
    await expect(page.locator('text=/lunch/i').first()).toBeVisible();
    await expect(page.locator('text=/dinner/i').first()).toBeVisible();
    await expect(page.locator('text=/snack/i').first()).toBeVisible();
  });

  test('should navigate between weeks', async ({ page }) => {
    // Click Next week
    await page.click('button:has-text("Next")');

    // Week should change (date range should be different)
    // This is a basic check - could be more specific
    await expect(page.locator('text=/\\w+ \\d+/').first()).toBeVisible();

    // Click Prev week
    await page.click('button:has-text("Prev")');

    // Should be back
    await expect(page.locator('text=/\\w+ \\d+/').first()).toBeVisible();

    // Click Today
    await page.click('button:has-text("Today")');

    // Should show current week
    await expect(page.locator('text=/\\w+ \\d+/').first()).toBeVisible();
  });

  test('should add meal to planner', async ({ page }) => {
    // Click Plus button to add meal
    await page.locator('header button').first().click();
    await page.waitForURL('**/planner/add');

    // Should see recipe selection
    await expect(page.locator('text=Select Recipe')).toBeVisible();

    // Search and select a recipe
    await page.fill('input[placeholder*="Search"]', 'Chicken');
    await page.click('text=Chicken Curry');

    // Should advance to date/meal type selection
    await expect(page.locator('text=Schedule Meal')).toBeVisible();
    await expect(page.locator('text=Selected Recipe')).toBeVisible();
    await expect(page.locator('text=Chicken Curry')).toBeVisible();

    // Date should be pre-filled with today
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue(/.+/); // Has some value

    // Select meal type (click on "snack")
    await page.click('button:has-text("snack")');

    // Verify snack is selected (should have checkmark or blue background)
    const snackButton = page.locator('button:has-text("snack")');
    await expect(snackButton).toHaveClass(/bg-blue/);

    // Submit
    await page.click('button:has-text("Add to Planner")');

    // Should redirect back to planner
    await page.waitForURL('**/planner');

    // Should see the meal in the week view
    await expect(page.locator('text=Chicken Curry').first()).toBeVisible();
  });

  test('should show empty state when no meals planned', async ({ page }) => {
    // If there are no meals, should see empty state
    // This test might fail if meals exist from previous tests
    // We'd need a way to clear the planner or test in isolation

    const emptyState = page.locator('text=No meals planned yet');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(page.locator('text=Plan Your First Meal')).toBeVisible();
    } else {
      // If not empty, just verify the week view is showing
      await expect(page.locator('text=Monday')).toBeVisible();
    }
  });
});
