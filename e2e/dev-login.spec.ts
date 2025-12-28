import { test, expect } from '@playwright/test';

test.describe('Dev Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to debug issues
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Log any page errors
    page.on('pageerror', (error) => {
      console.error('[BROWSER ERROR]:', error.message);
    });
  });

  test('should login demo user via dev session bypass', async ({ page }) => {
    console.log('\n=== Starting Dev Login Test ===\n');

    // Step 1: Go to dev-login page
    console.log('1. Navigating to /dev-login...');
    await page.goto('http://localhost:3000/dev-login');
    await expect(page.locator('h1')).toContainText('Dev Login');
    console.log('✓ Dev login page loaded');

    // Step 2: Click Demo User button (sets dev-session cookie, middleware injects Supabase session)
    console.log('2. Clicking "Demo User" button...');
    await page.click('text=Demo User');

    // Step 3: Wait for redirect to planner
    console.log('3. Waiting for redirect to /planner...');
    await page.waitForURL('**/planner', { timeout: 10000 });
    console.log('✓ Redirected to /planner');

    // Step 4: Verify planner page loaded
    expect(page.url()).toContain('/planner');
    await expect(page.locator('h1')).toContainText('Planner', { timeout: 5000 });
    console.log('✓ Planner page loaded');

    // Step 5: Verify session persists across page reloads
    console.log('4. Testing session persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/planner');
    console.log('✓ Session persisted after reload');

    // Step 6: Verify authenticated API access
    console.log('5. Verifying authenticated API access...');
    const response = await page.goto('http://localhost:3000/api/planner?start_date=2025-12-22&end_date=2025-12-28');
    expect(response?.status()).toBe(200);
    console.log('✓ Can access authenticated API');

    console.log('\n=== ✅ Dev Login Test PASSED ===\n');
  });

  test('should login spouse user to same household', async ({ page }) => {
    console.log('\n=== Testing Spouse User Login ===\n');

    await page.goto('http://localhost:3000/dev-login');
    await page.click('text=Spouse User');

    await page.waitForURL('**/planner', { timeout: 10000 });
    expect(page.url()).toContain('/planner');

    // Spouse should see Demo Household's recipes
    await page.goto('http://localhost:3000/recipes');
    await expect(page.locator('text=Chicken Curry')).toBeVisible({ timeout: 5000 });

    console.log('✓ Spouse user can see Demo Household recipes');
  });

  test('should login test user to empty Test Household', async ({ page }) => {
    console.log('\n=== Testing Test User Login ===\n');

    await page.goto('http://localhost:3000/dev-login');
    await page.click('text=Test User');

    await page.waitForURL('**/planner', { timeout: 10000 });
    expect(page.url()).toContain('/planner');

    // Test user should have empty household
    await page.goto('http://localhost:3000/recipes');
    await expect(page.locator('text=No recipes yet')).toBeVisible({ timeout: 5000 });

    console.log('✓ Test user has clean Test Household');
  });
});
