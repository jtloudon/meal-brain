# E2E Test: Authentication Flow

**Module**: End-to-end authentication user journey

**Status**: ⬜ Not started

**Test Count**: 0/4 passing

**Framework**: Playwright

---

## Overview

Critical user flow testing magic-link authentication from login to authenticated session.

**Screens tested**:
- `/login`
- `/auth/callback`
- `/planner` (post-auth redirect)

**Dependencies**:
- Supabase Auth
- Email delivery (mocked in tests)
- Session management

---

## Test Case 1: Complete magic-link flow (new user)

**Status**: ⬜

**Given**:
```typescript
// Fresh user, never logged in before
const testEmail = 'newuser@example.com';
```

**Steps**:
```typescript
// 1. Visit login page
await page.goto('/login');
await expect(page).toHaveURL('/login');

// 2. Enter email and submit
await page.fill('input[type="email"]', testEmail);
await page.click('button:has-text("Send Magic Link")');

// 3. Verify "check email" message
await expect(page.locator('text=/check your email/i')).toBeVisible();

// 4. Mock email capture - extract magic link
const magicLink = await mockEmailService.getLatestEmail(testEmail);
expect(magicLink).toContain('/auth/callback?token=');

// 5. Extract token and visit callback URL
const url = new URL(magicLink);
const token = url.searchParams.get('token');
await page.goto(`/auth/callback?token=${token}`);

// 6. Should redirect to onboarding (new user, no household)
await expect(page).toHaveURL(/\/onboarding/);
await expect(page.locator('text=/create.*household/i')).toBeVisible();

// 7. Create household
await page.fill('input[name="household_name"]', 'Test Household');
await page.click('button:has-text("Create Household")');

// 8. Should redirect to planner
await expect(page).toHaveURL('/planner');

// 9. Verify authenticated state
const user = await page.evaluate(() => {
  return window.localStorage.getItem('supabase.auth.token');
});
expect(user).toBeTruthy();
```

**Then**:
- User is authenticated
- Household created
- Session persists (JWT in cookie)

---

## Test Case 2: Returning user login

**Status**: ⬜

**Given**:
```typescript
// User already has household
// Pre-seed database with user + household
await seedDatabase({
  user: { email: 'existing@example.com', household_id: 'household-123' },
  household: { id: 'household-123', name: 'Existing Household' },
});
```

**Steps**:
```typescript
// 1. Visit login
await page.goto('/login');

// 2. Enter email
await page.fill('input[type="email"]', 'existing@example.com');
await page.click('button:has-text("Send Magic Link")');

// 3. Get magic link
const magicLink = await mockEmailService.getLatestEmail('existing@example.com');

// 4. Click link
const token = new URL(magicLink).searchParams.get('token');
await page.goto(`/auth/callback?token=${token}`);

// 5. Should redirect DIRECTLY to planner (skip onboarding)
await expect(page).toHaveURL('/planner');
await expect(page.locator('text=/onboarding/i')).not.toBeVisible();
```

**Then**:
- User authenticated
- Redirected to planner
- No onboarding step

---

## Test Case 3: Expired token error

**Status**: ⬜

**Given**:
```typescript
// Token that expired 16 minutes ago
const expiredToken = await createMagicLinkToken('user@example.com', {
  expiresInMinutes: -16, // Already expired
});
```

**Steps**:
```typescript
// 1. Visit callback with expired token
await page.goto(`/auth/callback?token=${expiredToken}`);

// 2. Should show error message
await expect(page.locator('text=/expired/i')).toBeVisible();
await expect(page.locator('text=/request.*new/i')).toBeVisible();

// 3. Should redirect to login
await expect(page).toHaveURL('/login');
```

**Then**:
- Error displayed
- Redirected to login
- No session created

---

## Test Case 4: Reused token error

**Status**: ⬜

**Given**:
```typescript
const email = 'test@example.com';
```

**Steps**:
```typescript
// 1. Get magic link
await page.goto('/login');
await page.fill('input[type="email"]', email);
await page.click('button:has-text("Send Magic Link")');
const magicLink = await mockEmailService.getLatestEmail(email);
const token = new URL(magicLink).searchParams.get('token');

// 2. Use token FIRST time (success)
await page.goto(`/auth/callback?token=${token}`);
await expect(page).toHaveURL(/\/(planner|onboarding)/);

// 3. Log out
await page.click('button:has-text("Log out")');
await expect(page).toHaveURL('/login');

// 4. Try to use SAME token again
await page.goto(`/auth/callback?token=${token}`);

// 5. Should show error
await expect(page.locator('text=/no longer valid/i')).toBeVisible();
await expect(page).toHaveURL('/login');
```

**Then**:
- Token marked as used
- Reuse rejected
- Error displayed

---

## Additional Test Cases (Lower Priority)

### Test Case 5: Multi-device support
```typescript
// Login on device A, then device B
// Both sessions should work independently
```

### Test Case 6: Session expiration
```typescript
// Mock JWT expiration after 30 days
// User should be redirected to login
```

### Test Case 7: Spouse invitation flow
```typescript
// User A creates household → generates invite link
// User B clicks invite → authenticates → joins household
```

---

## Test File Location

`e2e/authentication.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockEmailService } from './helpers/mock-email';
import { seedDatabase } from './helpers/seed-database';

test.describe('Authentication Flow', () => {
  test('new user completes magic-link flow', async ({ page }) => {
    // Test Case 1
  });

  test('returning user logs in directly', async ({ page }) => {
    // Test Case 2
  });

  test('expired token shows error', async ({ page }) => {
    // Test Case 3
  });

  test('reused token is rejected', async ({ page }) => {
    // Test Case 4
  });
});
```

---

## Mock Email Service

```typescript
// e2e/helpers/mock-email.ts

class MockEmailService {
  private emails: Map<string, string> = new Map();

  async captureEmail(to: string, body: string) {
    // Extract magic link from email body
    const linkMatch = body.match(/https?:\/\/[^\s]+auth\/callback\?token=[^\s]+/);
    if (linkMatch) {
      this.emails.set(to, linkMatch[0]);
    }
  }

  async getLatestEmail(to: string): Promise<string> {
    const link = this.emails.get(to);
    if (!link) throw new Error(`No email found for ${to}`);
    return link;
  }

  clear() {
    this.emails.clear();
  }
}

export const mockEmailService = new MockEmailService();
```

---

## Progress Tracking

- [ ] Test Case 1: New user flow
- [ ] Test Case 2: Returning user
- [ ] Test Case 3: Expired token
- [ ] Test Case 4: Reused token

**When all 4 pass**: Update [../README.md](../README.md) status to ✅
