import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-setup';

test.describe('Grocery List Rename', () => {
  test('can rename a grocery list', async ({ page }) => {
    // Log in
    const { cleanup } = await loginTestUser(page);

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');

    // Wait for page to load
    await page.waitForSelector('text=My First List', { timeout: 10000 });

    // Click the pencil icon to edit the list name
    await page.click('button[title="Rename list"]');

    // Input field should appear with current name
    const input = page.locator('input[value="My First List"]');
    await expect(input).toBeVisible();

    // Clear and type new name
    await input.fill('');
    await input.fill('Weekly Shopping');

    // Click Save button
    await page.click('button:has-text("Save")');

    // Name should update
    await expect(page.locator('text=Weekly Shopping')).toBeVisible();
    await expect(page.locator('text=My First List')).not.toBeVisible();

    // Cleanup
    await cleanup();
  });

  test('can cancel renaming a grocery list', async ({ page }) => {
    // Log in
    const { cleanup } = await loginTestUser(page);

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');

    // Wait for page to load
    await page.waitForSelector('text=My First List', { timeout: 10000 });

    // Click the pencil icon
    await page.click('button[title="Rename list"]');

    // Input field should appear
    const input = page.locator('input[value="My First List"]');
    await expect(input).toBeVisible();

    // Change the name
    await input.fill('New Name');

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Should revert to original name
    await expect(page.locator('text=My First List')).toBeVisible();
    await expect(input).not.toBeVisible();

    // Cleanup
    await cleanup();
  });

  test('can save list name by pressing Enter', async ({ page }) => {
    // Log in
    const { cleanup } = await loginTestUser(page);

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');

    // Wait for page to load
    await page.waitForSelector('text=My First List', { timeout: 10000 });

    // Click the pencil icon
    await page.click('button[title="Rename list"]');

    // Input field should appear
    const input = page.locator('input[value="My First List"]');
    await expect(input).toBeVisible();

    // Type new name and press Enter
    await input.fill('');
    await input.fill('Quick List');
    await input.press('Enter');

    // Name should update
    await expect(page.locator('text=Quick List')).toBeVisible();

    // Cleanup
    await cleanup();
  });

  test('cannot save empty list name', async ({ page }) => {
    // Log in
    const { cleanup } = await loginTestUser(page);

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');

    // Wait for page to load
    await page.waitForSelector('text=My First List', { timeout: 10000 });

    // Click the pencil icon
    await page.click('button[title="Rename list"]');

    // Input field should appear
    const input = page.locator('input[value="My First List"]');
    await expect(input).toBeVisible();

    // Clear the name
    await input.fill('');

    // Save button should be disabled
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeDisabled();

    // Cleanup
    await cleanup();
  });

  test('renamed list persists after page reload', async ({ page }) => {
    // Log in
    const { cleanup } = await loginTestUser(page);

    // Go to groceries page
    await page.goto('http://localhost:3000/groceries');

    // Wait for page to load
    await page.waitForSelector('text=My First List', { timeout: 10000 });

    // Rename the list
    await page.click('button[title="Rename list"]');
    const input = page.locator('input[value="My First List"]');
    await input.fill('Persistent List');
    await page.click('button:has-text("Save")');

    // Verify new name
    await expect(page.locator('text=Persistent List')).toBeVisible();

    // Reload page
    await page.reload();

    // Name should still be changed
    await expect(page.locator('text=Persistent List')).toBeVisible();
    await expect(page.locator('text=My First List')).not.toBeVisible();

    // Cleanup
    await cleanup();
  });
});
