import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Onboarding Flow', () => {
  test('complete onboarding flow saves preferences and redirects to planner', async ({ page }) => {
    // Log in first (required to save preferences)
    const { cleanup } = await loginTestUser(page);

    // Navigate to preferences onboarding
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Step 1: Household Context
    await expect(page.locator('h1:has-text("Let\'s set up your MealBrain")')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Who is this app for?');
    await expect(page.locator('text=Step 1 of 6')).toBeVisible();

    // Select "Me + spouse/partner"
    await page.click('text=Me + spouse/partner');
    await page.click('text=Next');

    // Step 2: Dietary Constraints
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Any dietary constraints?');

    // Select "Dairy-free" and "Vegetarian"
    await page.click('text=Dairy-free');
    await page.click('text=Vegetarian');

    // Add custom constraint
    await page.click('text=+ Add custom');
    await page.fill('input[placeholder="Add custom constraint"]', 'Low sodium');
    await page.click('button:has-text("Add")');

    await page.click('text=Next');

    // Step 3: AI Collaboration Style
    await expect(page.locator('text=Step 3 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText('How would you like the AI to work with you?');

    // Select "Collaborator"
    await page.click('text=Collaborator');
    await page.click('text=Next');

    // Step 4: Planning Preferences
    await expect(page.locator('text=Step 4 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText('How do you usually plan meals?');

    // Select multiple preferences
    await page.click('text=Week-by-week');
    await page.click('text=Batch cooking');
    await page.click('text=Next');

    // Step 5: AI Learning
    await expect(page.locator('text=Step 5 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Should the AI learn from your choices?');

    // Select "Yes" (default)
    await page.click('button:has-text("Yes")');
    await page.click('text=Next');

    // Step 6: Summary
    await expect(page.locator('text=Step 6 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText("Let's confirm your preferences");

    // Verify summary shows correct selections
    await expect(page.locator('text=Me + spouse/partner')).toBeVisible();
    await expect(page.locator('text=Dairy-free, Vegetarian, Low sodium')).toBeVisible();
    await expect(page.locator('text=Collaborator')).toBeVisible();
    await expect(page.locator('text=Week-by-week, Batch cooking')).toBeVisible();
    await expect(page.locator('text=Enabled')).toBeVisible();

    // Complete onboarding
    await page.click('text=Get Started');

    // Should redirect to recipes page
    await expect(page).toHaveURL('http://localhost:3000/recipes');

    // Cleanup
    await cleanup();
  });

  test('skip onboarding applies safe defaults', async ({ page }) => {
    // Log in first (required to save preferences)
    const { cleanup } = await loginTestUser(page);

    // Navigate to preferences onboarding
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Click skip immediately
    await page.click('text=Skip for now');

    // Should redirect to recipes page
    await expect(page).toHaveURL('http://localhost:3000/recipes');

    // Cleanup
    await cleanup();
  });

  test('back button navigates to previous step', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Step 1: Select household context
    await page.click('text=Just me');
    await page.click('text=Next');

    // Step 2: Now on dietary constraints
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();

    // Click Back
    await page.click('button:has-text("Back")');

    // Should be back on Step 1
    await expect(page.locator('text=Step 1 of 6')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Who is this app for?');

    // Should still have "Just me" selected
    const justMeButton = page.locator('button:has-text("Just me")');
    await expect(justMeButton).toHaveCSS('border', /2px solid rgb\(249, 115, 22\)/);
  });

  test('cannot proceed without required selections', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Step 1: Don't select anything, try to click Next
    const nextButton = page.locator('button:has-text("Next")');

    // Next button should be disabled
    await expect(nextButton).toBeDisabled();

    // Select household context
    await page.click('text=Just me');

    // Now Next should be enabled
    await expect(nextButton).toBeEnabled();
    await page.click('button:has-text("Next")');

    // Step 2: Dietary constraints are optional, Next should be enabled
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();
    await expect(nextButton).toBeEnabled();
    await page.click('button:has-text("Next")');

    // Step 3: AI Style is required
    await expect(page.locator('text=Step 3 of 6')).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await page.click('text=Coach');
    await expect(nextButton).toBeEnabled();
  });

  test('progress bar updates as user advances through steps', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/preferences');

    // Verify progress text updates
    await expect(page.locator('text=Step 1 of 6')).toBeVisible();

    // Advance to Step 2
    await page.click('text=Just me');
    await page.click('text=Next');

    // Progress text should update to Step 2
    await expect(page.locator('text=Step 2 of 6')).toBeVisible();

    // Advance to Step 3
    await page.click('text=Next');

    // Progress text should update to Step 3
    await expect(page.locator('text=Step 3 of 6')).toBeVisible();
  });
});
