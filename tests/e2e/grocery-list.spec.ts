import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'grocery-test@mealbrain.app';
const DEMO_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000001';

test.describe('Grocery List', () => {
  test.beforeEach(async () => {
    // Clean up test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find((u) => u.email === TEST_EMAIL);
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }

    // Clean up users table
    await supabase.from('users').delete().eq('email', TEST_EMAIL);
  });

  test('should display grocery list with items', async ({ page }) => {
    // Given: A user with a grocery list containing items
    // (Using seeded data: Demo Household has "This Week" list with items)

    // When: User logs in and navigates to groceries
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button:has-text("Send Magic Link")');

    // Wait for email and click magic link
    await page.waitForTimeout(2000);
    const mailpitPage = await page.context().newPage();
    await mailpitPage.goto('http://127.0.0.1:54324');
    await mailpitPage.waitForTimeout(1000);

    // Click the first email
    await mailpitPage.click('.message');

    // Find and click the magic link in the iframe
    const iframe = mailpitPage.frameLocator('iframe[name="preview-html"]');
    const magicLink = await iframe.locator('a:has-text("Log in")').getAttribute('href');
    await mailpitPage.close();

    if (magicLink) {
      await page.goto(magicLink);
    }

    // Complete onboarding to join Demo Household
    await page.waitForURL('**/onboarding');
    await page.fill('input[name="householdName"]', 'Demo Household');
    await page.click('button:has-text("Create Household")');

    // Navigate to groceries tab
    await page.waitForURL('**/planner');
    await page.click('a[href="/groceries"]');
    await page.waitForURL('**/groceries');

    // Then: Should see the grocery list selector
    await expect(page.locator('select, [role="combobox"]')).toBeVisible();

    // Then: Should see "This Week" list selected (seeded data)
    await expect(page.locator('text=This Week')).toBeVisible();

    // Then: Should see grocery items from seeded data
    await expect(page.locator('text=chicken breast')).toBeVisible();
    await expect(page.locator('text=1.5 lb')).toBeVisible();

    await expect(page.locator('text=rice')).toBeVisible();
    await expect(page.locator('text=2 cup')).toBeVisible();

    await expect(page.locator('text=coconut milk')).toBeVisible();
    await expect(page.locator('text=1 can')).toBeVisible();

    // Then: Items should have checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(7); // 7 items in seeded list
  });
});
