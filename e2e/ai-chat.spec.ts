import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('AI Chat Panel', () => {
  let cleanup: () => Promise<void>;

  test.beforeEach(async ({ page }) => {
    // Log in using helper
    const { cleanup: cleanupFn } = await loginTestUser(page);
    cleanup = cleanupFn;

    // Navigate to recipes page
    await page.goto('http://localhost:3000/recipes');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  test('Test Case 1: Open and close chat panel', async ({ page }) => {
    // Click the floating chef's hat button
    const chatButton = page.locator('button[aria-label="Open AI Assistant"]');
    await expect(chatButton).toBeVisible();
    await chatButton.click();

    // Verify chat panel slides up
    const chatPanel = page.locator('text=AI Sous Chef').first();
    await expect(chatPanel).toBeVisible();

    // Verify backdrop appears
    const backdrop = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(backdrop).toBeVisible();

    // Verify panel shows empty state message
    await expect(page.locator('text=Hi! I\'m your AI sous chef')).toBeVisible();

    // Close by clicking backdrop
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(chatPanel).not.toBeVisible();

    // Reopen panel
    await chatButton.click();
    await expect(chatPanel).toBeVisible();

    // Close by clicking X button
    const closeButton = page.locator('button[aria-label="Close chat"]');
    await closeButton.click();
    await expect(chatPanel).not.toBeVisible();
  });

  test('Test Case 2: Send message and receive response', async ({ page }) => {
    // Open chat panel
    await page.locator('button[aria-label="Open AI Assistant"]').click();

    // Type message
    const input = page.locator('input[placeholder*="Ask about meals"]');
    await expect(input).toBeVisible();
    await input.fill('What recipes do I have?');

    // Send button should be enabled
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // User message appears (orange bubble, right side)
    await expect(page.locator('text=What recipes do I have?')).toBeVisible();

    // Loading indicator appears
    await expect(page.locator('.animate-bounce').first()).toBeVisible({ timeout: 2000 });

    // AI response appears (gray bubble, left side)
    // Wait for response (may take a few seconds with real API)
    await expect(page.locator('.bg-gray-100').filter({ hasText: /recipe/i })).toBeVisible({ timeout: 15000 });

    // Input field should be cleared
    await expect(input).toHaveValue('');
  });

  test('Test Case 3: AI uses tools to answer questions', async ({ page }) => {
    // Open chat panel
    await page.locator('button[aria-label="Open AI Assistant"]').click();

    // Ask for recipes
    const input = page.locator('input[placeholder*="Ask about meals"]');
    await input.fill('Show me all my recipes');
    await page.locator('button[aria-label="Send message"]').click();

    // AI should list recipes
    const aiResponse = page.locator('.bg-gray-100').first();
    await expect(aiResponse).toBeVisible({ timeout: 15000 });

    // Should mention at least one recipe name
    await expect(page.locator('text=/Chicken Curry|Beef Tacos|Black Bean Tacos/i')).toBeVisible({ timeout: 5000 });
  });

  test('Test Case 6: Empty message validation', async ({ page }) => {
    // Open chat panel
    await page.locator('button[aria-label="Open AI Assistant"]').click();

    const sendButton = page.locator('button[aria-label="Send message"]');

    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();

    // Type and delete message
    const input = page.locator('input[placeholder*="Ask about meals"]');
    await input.fill('Test');
    await expect(sendButton).toBeEnabled();

    await input.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('Test Case 8: Panel positioning prevents content bleed-through', async ({ page }) => {
    // Verify recipes are visible before opening chat
    await expect(page.locator('text=Example: Chicken Curry')).toBeVisible();

    // Open chat panel
    await page.locator('button[aria-label="Open AI Assistant"]').click();

    // Backdrop should cover the screen
    const backdrop = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(backdrop).toBeVisible();

    // Panel should be visible
    await expect(page.locator('text=AI Sous Chef')).toBeVisible();

    // Verify panel has higher z-index than content
    const panel = page.locator('.fixed.inset-x-0.bottom-0').filter({ hasText: 'AI Sous Chef' });
    await expect(panel).toBeVisible();

    // Panel should be positioned at z-index 50, backdrop at z-index 40
    await expect(panel).toHaveClass(/z-50/);
    await expect(backdrop).toHaveClass(/z-40/);
  });
});
