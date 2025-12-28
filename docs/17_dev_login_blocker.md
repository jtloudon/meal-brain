# Dev Login Implementation - Resolution

**Status:** ✅ RESOLVED (2025-12-27)

## Problem

The `/dev-login` page was **setting a custom cookie instead of generating valid Supabase session tokens**, causing all API calls to fail with authentication errors.

**What Was Wrong:**
```typescript
// ❌ INCORRECT (app/dev-login/actions.ts:100-118)
cookieStore.set('dev-session', JSON.stringify({
  userId: authUserId,
  email: email,
  householdId: householdId,
}))
```

**Why This Failed:**
1. Supabase SDK doesn't recognize custom cookies
2. `createClient()` calls have no valid session
3. RLS policies can't authenticate (`auth.uid()` returns NULL)
4. All API endpoints return 401 Unauthorized

## Root Cause Analysis

**Attempted Approaches (All Failed):**
1. **Custom cookie** - Not recognized by Supabase SDK ❌
2. **Password-based login** - Returned "Invalid login credentials" ❌
3. **Magic link OTP** - "Email link is invalid or has expired" ❌
4. **PKCE signup** - Only works for new users ❌

**Fundamental Issue:**
We were trying to bypass Supabase's auth system instead of **using it correctly**.

## Solution (Per Supabase Official Docs)

### Server-Side (`app/dev-login/actions.ts`)

```typescript
'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function devLogin(userId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dev login not available in production');
  }

  const email = getEmailForUserId(userId);
  const householdId = getHouseholdIdForUserId(userId);

  // Admin client (service role)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Create or verify user exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const user = existingUser?.users.find((u) => u.email === email);

  if (!user) {
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'dev-password-12345', // Dev only!
      email_confirm: true,
    });
  }

  // 2. Create/update users table record
  await supabaseAdmin.from('users').upsert({
    id: user.id,
    email,
    household_id: householdId,
  });

  // 3. Generate REAL session tokens via signIn
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password: 'dev-password-12345',
  });

  if (error) throw error;

  // 4. Return tokens to client
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}
```

### Client-Side (`app/dev-login/page.tsx`)

```typescript
'use client';

import { createClient } from '@/lib/auth/supabase-client';

const handleDevLogin = async (user) => {
  const { devLogin } = await import('./actions');
  const tokens = await devLogin(user.userId);

  // Set REAL Supabase session
  const supabase = createClient();
  await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  // Now redirect - session is valid!
  router.push('/planner');
};
```

## Why This Works

1. **Uses Supabase Auth API** - Not bypassing, using it correctly
2. **Generates real JWT tokens** - SDK recognizes them
3. **RLS policies work** - `auth.uid()` returns actual user ID
4. **API calls succeed** - Valid session in all requests

## Comparison: E2E Tests vs Dev-Login

| Aspect | E2E Tests | Old Dev-Login | New Dev-Login |
|--------|-----------|---------------|---------------|
| Creates user | ✅ Service role | ✅ Service role | ✅ Service role |
| Session method | Magic link flow | ❌ Custom cookie | ✅ signInWithPassword |
| Valid tokens | ✅ Yes | ❌ No | ✅ Yes |
| SDK recognizes | ✅ Yes | ❌ No | ✅ Yes |
| RLS works | ✅ Yes | ❌ No | ✅ Yes |

## Implementation Checklist

- [x] Update `app/dev-login/actions.ts` server-side logic ✅
- [x] Update `app/dev-login/page.tsx` client-side logic ✅
- [x] Remove custom cookie code ✅
- [x] Test all three dev users (demo, spouse, test) ✅
- [x] Verify API calls work after dev-login ✅
- [x] E2E tests passing (3/3 dev-login tests) ✅
- [x] Add user email to header for visibility ✅

## Database Seeding

**Separate Issue (Resolved):**
- Tests were failing because `supabase/seed.sql` wasn't loaded
- **Fix:** Run `supabase db reset` to load seed data
- **Automation:** Consider pre-test hook to ensure seed data exists

**Source:** [Supabase Seeding Docs](https://supabase.com/docs/guides/local-development/seeding-your-database)

## Files to Modify

1. `app/dev-login/actions.ts` - Replace cookie logic with `signInWithPassword`
2. `app/dev-login/page.tsx` - Add `setSession()` call after getting tokens
3. `docs/16_authentication_flow.md` - Already updated with architecture
4. `docs/17_dev_login_blocker.md` - This file (resolution)

## References

- [Supabase Auth Sessions](https://supabase.com/docs/guides/auth/sessions)
- [setSession API](https://supabase.com/docs/reference/javascript/v1/auth-setsession)
- [Local Development](https://supabase.com/docs/guides/local-development)
- [Service Role Key Usage](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)

---

*Last Updated: 2025-12-27*
*Status: RESOLVED - Ready for implementation*
