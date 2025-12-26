import { Page } from '@playwright/test';
import { mockEmailService } from './mock-email';
import { seedDatabase, cleanupDatabase } from './seed-database';

/**
 * Logs in a test user and returns to the app.
 * Uses the demo household which already has recipes seeded.
 */
export async function loginTestUser(page: Page): Promise<{ email: string; cleanup: () => Promise<void> }> {
  const testEmail = `test-${Date.now()}@example.com`;

  // Use the demo household ID (has recipes already)
  const DEMO_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000001';

  // Create user associated with demo household
  await seedDatabase({
    user: {
      email: testEmail,
      household_id: DEMO_HOUSEHOLD_ID,
    },
  });

  // Go to login page
  await page.goto('/login');

  // Submit email
  await page.fill('input[type="email"]', testEmail);
  await page.click('button:has-text("Send Magic Link")');

  // Wait for confirmation
  await page.locator('text=/check your email/i').waitFor({ timeout: 10000 });

  // Get magic link
  const magicLink = await mockEmailService.getLatestEmail(testEmail);

  // Visit magic link
  await page.goto(magicLink);

  // Should redirect to planner (user already has household)
  await page.waitForURL('/planner', { timeout: 10000 });

  // Return cleanup function
  return {
    email: testEmail,
    cleanup: async () => {
      await cleanupDatabase(testEmail);
    },
  };
}
