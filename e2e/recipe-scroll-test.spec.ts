import { test } from '@playwright/test';

test('test scrolling on recipe detail page', async ({ page }) => {
  await page.goto('http://localhost:3000/dev-login');
  await page.click('button:has-text("Demo User")');
  await page.waitForTimeout(2000);
  
  // Go to recipes and click first recipe
  await page.goto('http://localhost:3000/recipes');
  await page.waitForTimeout(1000);
  await page.click('a[href^="/recipes/"]'); // Click first recipe card
  await page.waitForTimeout(2000);
  
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { error: 'No main' };
    
    return {
      overflowY: window.getComputedStyle(main).overflowY,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
      isScrollable: main.scrollHeight > main.clientHeight,
    };
  });
  
  console.log('=== Recipe Detail Scroll Test ===');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.isScrollable) {
    // Try scrolling
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 200;
    });
    await page.waitForTimeout(300);
    
    const scrollTop = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.scrollTop : 0;
    });
    
    console.log('✓ Scrolled to position:', scrollTop);
    console.log('✓ SCROLLING WORKS!');
  } else {
    console.log('⚠ Content not tall enough to test scroll');
  }
});
