import { test, expect } from '@playwright/test';

test('check page structure and scrolling', async ({ page }) => {
  // Go directly to recipes page (should work without auth check for this test)
  await page.goto('http://localhost:3000/recipes');
  await page.waitForTimeout(2000);
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/recipes-page.png', fullPage: true });
  
  // Get all elements and their computed styles
  const bodyOverflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const mainEl = document.querySelector('main');
    const layoutDiv = document.querySelector('div[class*="h-screen"]');
    
    return {
      html: {
        height: window.getComputedStyle(html).height,
        overflow: window.getComputedStyle(html).overflow,
      },
      body: {
        height: window.getComputedStyle(body).height,
        overflow: window.getComputedStyle(body).overflow,
      },
      main: mainEl ? {
        height: window.getComputedStyle(mainEl).height,
        overflow: window.getComputedStyle(mainEl).overflow,
        scrollHeight: mainEl.scrollHeight,
        clientHeight: mainEl.clientHeight,
      } : null,
      layoutDiv: layoutDiv ? {
        height: window.getComputedStyle(layoutDiv).height,
      } : null,
    };
  });
  
  console.log(JSON.stringify(bodyOverflow, null, 2));
});
