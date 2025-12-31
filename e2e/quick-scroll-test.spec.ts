import { test } from '@playwright/test';

test('scroll test', async ({ page }) => {
  await page.goto('http://localhost:3000/dev-login');
  await page.click('button:has-text("Demo User")');
  await page.waitForTimeout(3000);
  
  // Just navigate to groceries directly
  await page.goto('http://localhost:3000/groceries');
  await page.waitForTimeout(2000);
  
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { error: 'No main' };
    
    return {
      style: main.getAttribute('style'),
      overflow: window.getComputedStyle(main).overflowY,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
});
