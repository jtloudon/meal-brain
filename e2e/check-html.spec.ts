import { test } from '@playwright/test';

test('check actual HTML', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  
  // Get the full HTML
  const html = await page.content();
  console.log('=== FULL HTML ===');
  console.log(html);
  
  // Check if AuthenticatedLayout is used
  const hasMain = await page.locator('main').count();
  console.log('\n=== HAS MAIN:', hasMain);
  
  if (hasMain > 0) {
    const mainHTML = await page.locator('main').first().evaluate(el => el.outerHTML);
    console.log('\n=== MAIN ELEMENT ===');
    console.log(mainHTML);
  }
});
