import { test, expect } from '@playwright/test';
import { mockEmailService } from './helpers/mock-email';
import { seedDatabase, cleanupDatabase } from './helpers/seed-database';

test.describe('Authentication Flow', () => {
  test.afterEach(async () => {
    // Clean up Mailpit messages after each test
    try {
      await fetch('http://127.0.0.1:54324/api/v1/messages', {
        method: 'DELETE',
      });
    } catch (error) {
      // Mailpit might not be running
    }
  });

  test('new user completes magic-link flow', async ({ page }) => {
    const testEmail = `newuser-${Date.now()}@example.com`;

    // 1. Visit login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // 2. Enter email and submit
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Send Magic Link")');

    // 3. Verify "check email" message
    await expect(page.locator('text=/check your email/i')).toBeVisible({
      timeout: 10000,
    });

    // 4. Get magic link (has retry logic built in)
    const magicLink = await mockEmailService.getLatestEmail(testEmail);
    expect(magicLink).toContain('/auth/v1/verify');

    // 5. Visit the magic link
    await page.goto(magicLink);

    // 6. Should redirect to onboarding (new user, no household)
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Welcome to MealBrain!")')).toBeVisible();

    // 7. Create household
    await page.fill('input[name="household_name"]', 'Test Household');
    await page.click('button:has-text("Create Household")');

    // 8. Should redirect to planner
    await expect(page).toHaveURL('/planner', { timeout: 10000 });

    // 9. Verify authenticated state - look for logout button
    await expect(page.locator('button:has-text("Log out")')).toBeVisible();

    // Cleanup
    await cleanupDatabase(testEmail);
  });

  test('returning user logs in directly', async ({ page }) => {
    const testEmail = `existing-${Date.now()}@example.com`;

    // Capture console logs from the browser
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}]`, msg.text());
    });

    // Pre-seed database with user + household
    await seedDatabase({
      household: { name: 'Existing Household' },
      user: { email: testEmail },
    });

    // 1. Visit login
    await page.goto('/login');

    // 2. Enter email
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Send Magic Link")');

    // 3. Wait for confirmation message
    await expect(page.locator('text=/check your email/i')).toBeVisible({
      timeout: 10000,
    });

    // 4. Get magic link (has retry logic built in)
    const magicLink = await mockEmailService.getLatestEmail(testEmail);

    // 5. Click link
    await page.goto(magicLink);

    // 6. Should redirect DIRECTLY to planner (skip onboarding)
    await expect(page).toHaveURL('/planner', { timeout: 10000 });
    await expect(page.locator('text=/onboarding/i')).not.toBeVisible();
    await expect(page.locator('button:has-text("Log out")')).toBeVisible();

    // Cleanup
    await cleanupDatabase(testEmail);
  });

  test('expired token shows error', async ({ page }) => {
    // Create a fake expired token
    const expiredToken = 'expired-token-12345';

    // 1. Visit callback with expired/invalid token
    await page.goto(
      `/auth/callback?token_hash=${expiredToken}&type=magiclink`
    );

    // 2. Should show error message
    await expect(
      page.locator('text=/no longer valid|expired/i')
    ).toBeVisible({ timeout: 10000 });

    // 3. Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('reused token is rejected', async ({ page, context }) => {
    const testEmail = `reuse-${Date.now()}@example.com`;

    // 1. Get magic link
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Send Magic Link")');

    await expect(page.locator('text=/check your email/i')).toBeVisible({
      timeout: 10000,
    });

    const magicLink = await mockEmailService.getLatestEmail(testEmail);

    // 2. Use token FIRST time (success)
    await page.goto(magicLink);
    await expect(page).toHaveURL(/\/(planner|onboarding)/, {
      timeout: 10000,
    });

    // Complete onboarding if needed
    const isOnboarding = await page
      .locator('text=/create.*household/i')
      .isVisible()
      .catch(() => false);

    if (isOnboarding) {
      await page.fill('input[name="household_name"]', 'Test Household');
      await page.click('button:has-text("Create Household")');
      await expect(page).toHaveURL('/planner', { timeout: 10000 });
    }

    // 3. Log out
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // 4. Try to use SAME token again in a new context (simulates new browser)
    const newPage = await context.newPage();
    await newPage.goto(magicLink);

    // 5. Should show error
    await expect(
      newPage.locator('text=/no longer valid|already been used/i')
    ).toBeVisible({ timeout: 10000 });

    await expect(newPage).toHaveURL('/login', { timeout: 5000 });

    // Cleanup
    await newPage.close();
    await cleanupDatabase(testEmail);
  });
});
