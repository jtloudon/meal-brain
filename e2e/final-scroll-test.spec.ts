import { test } from '@playwright/test';

test('test scroll on authenticated grocery page', async ({ page }) => {
  // Navigate to dev-login
  await page.goto('http://localhost:3000/dev-login');
  
  // Click the demo user button (button-based dev login)
  await page.click('button:has-text("Demo User")');
  
  // Wait for redirect to planner
  await page.waitForURL(/\/planner/, { timeout: 10000 });
  
  // Navigate to groceries
  await page.click('[aria-label="Groceries"]');
  await page.waitForTimeout(2000);
  
  // Now check the actual AuthenticatedLayout structure
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { error: 'No main element found' };
    
    const computedStyle = window.getComputedStyle(main);
    const parentDiv = main.parentElement;
    const parentStyle = parentDiv ? window.getComputedStyle(parentDiv) : null;
    
    return {
      main: {
        tagName: main.tagName,
        className: main.className,
        inlineStyle: main.getAttribute('style'),
        computedOverflow: computedStyle.overflow,
        computedOverflowY: computedStyle.overflowY,
        computedHeight: computedStyle.height,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        isScrollable: main.scrollHeight > main.clientHeight,
      },
      parent: parentStyle ? {
        className: parentDiv?.className,
        height: parentStyle.height,
      } : null,
    };
  });
  
  console.log('=== AUTHENTICATED PAGE SCROLL TEST ===');
  console.log(JSON.stringify(result, null, 2));
  
  // Try to scroll
  if (result.main && !result.error) {
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 100;
    });
    await page.waitForTimeout(500);
    
    const scrollTop = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.scrollTop : 0;
    });
    console.log('Scroll position after scrolling:', scrollTop);
  }
  
  await page.waitForTimeout(3000);
});
