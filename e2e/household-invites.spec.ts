import { test, expect } from '@playwright/test';

test.describe('Household Invitation System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user (existing household member)
    await page.goto('/dev-login');
    await page.fill('input[name="email"]', 'demo@mealbrain.app');
    await page.click('button[type="submit"]');
    await page.waitForURL('/recipes');
  });

  test('should generate invite code', async ({ page }) => {
    // Navigate to invites page
    await page.goto('/settings');
    await page.click('text=Invite Members');
    await page.waitForURL('/settings/invites');

    // Create invite
    await page.click('button:has-text("Create Invite Link")');

    // Wait for invite to appear
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    // Verify invite code is displayed (8 chars, uppercase)
    const inviteCode = await page.locator('[style*="font-family: monospace"]').first().textContent();
    expect(inviteCode).toBeTruthy();
    expect(inviteCode?.length).toBe(8);
    expect(inviteCode).toMatch(/^[A-Z0-9]{8}$/);

    // Verify copy button exists
    const copyButton = page.locator('button:has-text("Copy Link")');
    await expect(copyButton).toBeVisible();
  });

  test('should validate invite code correctly', async ({ page, request }) => {
    // First, create an invite
    await page.goto('/settings/invites');
    await page.click('button:has-text("Create Invite Link")');
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    const inviteCode = await page.locator('[style*="font-family: monospace"]').first().textContent();
    expect(inviteCode).toBeTruthy();

    // Test validation endpoint directly
    const response = await request.post('/api/invites/validate', {
      data: { inviteCode },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.householdName).toBeTruthy();
    expect(data.householdId).toBeTruthy();
  });

  test('should reject invalid invite code', async ({ request }) => {
    const response = await request.post('/api/invites/validate', {
      data: { inviteCode: 'INVALID1' },
    });

    const data = await response.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test('should pre-fill invite code from URL parameter', async ({ page }) => {
    // First, create an invite
    await page.goto('/settings/invites');
    await page.click('button:has-text("Create Invite Link")');
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    const inviteCode = await page.locator('[style*="font-family: monospace"]').first().textContent();
    expect(inviteCode).toBeTruthy();

    // Logout
    await page.goto('/settings');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login');

    // Navigate to onboarding with code in URL
    await page.goto(`/onboarding?code=${inviteCode}`);

    // Should auto-validate and show household name
    await page.waitForSelector('text=You\'re joining:', { timeout: 5000 });
    const joinText = await page.locator('text=You\'re joining:').textContent();
    expect(joinText).toContain('You\'re joining:');

    // Should show Join Household button
    const joinButton = page.locator('button:has-text("Join Household")');
    await expect(joinButton).toBeVisible();
  });

  test('should show invite code input when no code in URL', async ({ page }) => {
    // Logout first
    await page.goto('/settings');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login');

    // Go to onboarding without code
    await page.goto('/onboarding');

    // Should show invite code input
    await expect(page.locator('input[name="invite_code"]')).toBeVisible();
    await expect(page.locator('button:has-text("Validate Code")')).toBeVisible();

    // Should show helper text
    await expect(page.locator('text=Ask your family member for an invite code')).toBeVisible();
  });

  test('should validate code entered manually', async ({ page }) => {
    // First, create an invite
    await page.goto('/settings/invites');
    await page.click('button:has-text("Create Invite Link")');
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    const inviteCode = await page.locator('[style*="font-family: monospace"]').first().textContent();
    expect(inviteCode).toBeTruthy();

    // Logout
    await page.goto('/settings');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login');

    // Go to onboarding
    await page.goto('/onboarding');

    // Enter code manually
    await page.fill('input[name="invite_code"]', inviteCode!);
    await page.click('button:has-text("Validate Code")');

    // Should show join screen
    await page.waitForSelector('text=You\'re joining:', { timeout: 5000 });
    await expect(page.locator('button:has-text("Join Household")')).toBeVisible();
  });

  test('should show error for invalid manually entered code', async ({ page }) => {
    // Logout first
    await page.goto('/settings');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login');

    // Go to onboarding
    await page.goto('/onboarding');

    // Enter invalid code
    await page.fill('input[name="invite_code"]', 'BADCODE1');
    await page.click('button:has-text("Validate Code")');

    // Should show error
    await page.waitForSelector('text=Invalid invite code', { timeout: 5000 });
  });

  test('should track invite usage count', async ({ page }) => {
    // Create invite
    await page.goto('/settings/invites');
    await page.click('button:has-text("Create Invite Link")');
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    // Verify initial usage count is 0/1
    const usageText = await page.locator('text=Uses:').first().textContent();
    expect(usageText).toContain('Uses: 0 / 1');

    // Note: Actually using the invite would require creating a new user
    // which is complex in E2E tests. This test verifies the UI displays correctly.
  });

  test('should show expiration date', async ({ page }) => {
    // Create invite
    await page.goto('/settings/invites');
    await page.click('button:has-text("Create Invite Link")');
    await page.waitForSelector('[style*="font-family: monospace"]', { timeout: 5000 });

    // Verify expiration date is shown (should be ~30 days from now)
    const expiresText = await page.locator('text=Expires:').first().textContent();
    expect(expiresText).toContain('Expires:');

    // Should show a date
    expect(expiresText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});
