import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test('test scrolling with auth', async ({ page, context }) => {
  // Create a session manually
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Sign in as demo user
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'demo@mealbrain.app',
    options: {
      redirectTo: 'http://localhost:3000/planner',
    },
  });
  
  if (error) {
    console.error('Auth error:', error);
    return;
  }
  
  // Extract token and set session
  const url = new URL(data.properties.action_link);
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type');
  
  // Navigate and set auth
  await page.goto(`http://localhost:3000/auth/callback?token=${token}&type=${type}`);
  await page.waitForTimeout(2000);
  
  // Now go to groceries
  await page.goto('http://localhost:3000/groceries');
  await page.waitForTimeout(2000);
  
  // Check the structure
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    const layoutDiv = document.querySelector('div');
    
    return {
      url: window.location.href,
      mainExists: !!main,
      main: main ? {
        overflow: window.getComputedStyle(main).overflow,
        overflowY: window.getComputedStyle(main).overflowY,
        height: window.getComputedStyle(main).height,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
      } : null,
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
});
