import { test, expect } from '@playwright/test';

test('test scrolling on grocery page', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/dev-login');
  await page.fill('input[type="email"]', 'demo@example.com');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button:has-text("Dev Login")');
  await page.waitForURL(/\/planner/);
  
  // Go to groceries
  await page.goto('http://localhost:3000/groceries');
  await page.waitForTimeout(1000);
  
  // Get the main element
  const main = page.locator('main').first();
  
  // Check scroll properties
  const scrollHeight = await main.evaluate(el => el.scrollHeight);
  const clientHeight = await main.evaluate(el => el.clientHeight);
  const initialScrollTop = await main.evaluate(el => el.scrollTop);
  
  console.log('=== Scroll Test Results ===');
  console.log('scrollHeight:', scrollHeight);
  console.log('clientHeight:', clientHeight);
  console.log('initialScrollTop:', initialScrollTop);
  console.log('isScrollable:', scrollHeight > clientHeight);
  
  // Try to scroll programmatically
  if (scrollHeight > clientHeight) {
    await main.evaluate(el => el.scrollTop = 100);
    await page.waitForTimeout(500);
    const newScrollTop = await main.evaluate(el => el.scrollTop);
    console.log('scrollTop after scroll:', newScrollTop);
    console.log('Scroll worked:', newScrollTop > 0);
  } else {
    console.log('Content not tall enough to scroll - test on recipe detail instead');
  }
  
  await page.waitForTimeout(2000);
});
