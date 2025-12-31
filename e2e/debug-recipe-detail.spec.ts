import { test } from '@playwright/test';

test('debug recipe detail page', async ({ page }) => {
  await page.goto('http://localhost:3000/dev-login');
  await page.click('button:has-text("Demo User")');
  await page.waitForTimeout(2000);
  
  // Go directly to a recipe detail page
  await page.goto('http://localhost:3000/recipes/b0000000-0000-4000-8000-000000000001');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/recipe-detail.png', fullPage: false });
  
  // Check all the divs and their styles
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    const body = document.body;
    const html = document.documentElement;
    
    // Get all parent divs of main
    const parents = [];
    let el = main?.parentElement;
    while (el && el !== body) {
      parents.push({
        tagName: el.tagName,
        className: el.className,
        style: el.getAttribute('style'),
        computedHeight: window.getComputedStyle(el).height,
        computedOverflow: window.getComputedStyle(el).overflow,
      });
      el = el.parentElement;
    }
    
    return {
      html: {
        height: window.getComputedStyle(html).height,
        overflow: window.getComputedStyle(html).overflow,
      },
      body: {
        height: window.getComputedStyle(body).height,
        overflow: window.getComputedStyle(body).overflow,
      },
      parents: parents,
      main: main ? {
        style: main.getAttribute('style'),
        className: main.className,
        computedHeight: window.getComputedStyle(main).height,
        computedOverflowY: window.getComputedStyle(main).overflowY,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
        isScrollable: main.scrollHeight > main.clientHeight,
      } : null,
    };
  });
  
  console.log('=== RECIPE DETAIL PAGE STRUCTURE ===');
  console.log(JSON.stringify(result, null, 2));
  
  await page.waitForTimeout(2000);
});
