# 16 – Authentication Flow

**Complete authentication and authorization specification.**

This document defines the magic-link flow, session management, household creation, spouse invitation, and security policies.

---

## Authentication Method: Magic-Link Email

### Why Magic-Link?
- **No password management**: Users don't create/remember passwords
- **Secure**: One-time tokens, auto-expire
- **Mobile-friendly**: Easy to use on phones
- **Simple UX**: Just enter email, click link

### Alternative Rejected
- ❌ **Password**: Adds complexity, users forget passwords
- ❌ **OAuth (Google, Apple)**: Vendor dependency, overkill for 2-user app
- ❌ **SMS**: Costs money, carrier dependency

---

## Core Flows

### 1. First-Time User (Household Creation)

**Scenario**: New user arrives at app for first time

**Flow**:
```
1. User visits app → Redirected to /login
2. User enters email → Clicks "Send Magic Link"
3. System sends email with magic link (expires in 15min)
4. User clicks link → Token validated → Session created
5. System detects no household → Shows "Create Household" form
6. User enters household name → Household created
7. User added to household as owner
8. Redirected to /planner (home screen)
```

**Database Operations**:
```sql
-- Step 6: Create household
INSERT INTO households (name) VALUES ('Smith Family')
RETURNING id;

-- Step 7: Associate user with household
UPDATE users
SET household_id = <household_id>, role = 'owner'
WHERE id = <user_id>;
```

---

### 2. Returning User (Existing Household)

**Scenario**: User already has household, logging in again

**Flow**:
```
1. User visits app → Redirected to /login (if not authenticated)
2. User enters email → Clicks "Send Magic Link"
3. System sends email with magic link
4. User clicks link → Token validated → Session created
5. System detects existing household → Redirected to /planner
```

**Session Persistence**: 30 days (JWT token)

---

### 3. Spouse Invitation

**Scenario**: Primary user invites spouse to join household

**Flow**:
```
1. User A (owner) goes to Settings → "Invite Household Member"
2. System generates unique invite link (e.g., /invite/<token>)
3. User A shares link with User B (via text, email, etc.)
4. User B clicks link → Redirected to /login with invite_token
5. User B enters email → Clicks "Send Magic Link"
6. User B clicks magic link → Session created
7. System detects invite_token → Associates User B with same household
8. User B redirected to /planner
9. Both users now share same household data
```

**Invite Link Format**:
```
https://mealbrain.app/invite/abc123xyz
```

**Invite Token**:
- Stored in `household_invites` table
- Expires after 7 days or first use (whichever comes first)
- One-time use only

**Database Schema**:
```sql
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by UUID REFERENCES users(id)
);
```

---

### 4. Session Expiration & Refresh

**Scenario**: User's session expires after 30 days

**Flow**:
```
1. User visits app with expired JWT
2. Supabase Auth detects invalid session
3. User redirected to /login
4. User enters email → New magic link sent
5. User clicks link → New session created
6. Redirected to previous URL (preserved in redirect param)
```

**Session Duration**:
- **JWT expiry**: 30 days (configurable in Supabase Auth)
- **Refresh token**: 60 days (Supabase default)
- **Refresh strategy**: Automatic (Supabase client handles)

---

## Magic-Link Email

### Email Template

**Subject**: Your MealBrain login link

**Body**:
```
Hi there,

Click the link below to log in to MealBrain:

[Log In to MealBrain]

This link expires in 15 minutes and can only be used once.

If you didn't request this, you can safely ignore this email.

---
MealBrain - Household Meal Planning
```

**Link Format**:
```
https://mealbrain.app/auth/callback?token=<one-time-token>
```

### Email Delivery

**Local Development**:
- Supabase Inbucket (http://localhost:54324)
- Emails captured locally, no external service needed
- View emails in browser

**Production Options**:

**Option 1: Supabase Built-In** (Recommended for MVP):
- Uses Supabase's email service
- Free tier: Rate-limited (60 emails/hour)
- Pros: Zero configuration, included
- Cons: Rate limits, generic "from" address

**Option 2: Custom SMTP** (For production):
- SendGrid, Resend, AWS SES, etc.
- Configure in Supabase Dashboard → Auth → Email
- Pros: Custom domain, higher rate limits
- Cons: Requires setup, small cost

**Recommended**: Start with Supabase built-in, migrate to custom SMTP if hitting rate limits.

---

## Security Policies

### Token Security

**Magic-Link Token**:
- **Format**: Cryptographically random string (256-bit)
- **Expiration**: 15 minutes
- **Single-use**: Token invalidated after first use
- **Storage**: Hashed in database (bcrypt or similar)

**Invite Token**:
- **Format**: URL-safe random string (128-bit)
- **Expiration**: 7 days or first use
- **Single-use**: Marked as `used_at` after claim
- **Storage**: Plaintext (not sensitive - just links household)

**Session Token (JWT)**:
- **Format**: Supabase-generated JWT
- **Expiration**: 30 days
- **Refresh**: Automatic via refresh token
- **Storage**: httpOnly cookie (secure, not accessible to JS)

### Row-Level Security (RLS)

**All tables enforce household isolation**:

```sql
-- recipes table RLS policy
CREATE POLICY "Users can only access their household's recipes"
ON recipes
FOR ALL
USING (household_id IN (
  SELECT household_id FROM users WHERE id = auth.uid()
));

-- Similar policies for:
-- - planner_meals
-- - grocery_lists
-- - grocery_items
-- - recipe_ingredients
```

**Effect**: Users can only see/modify data from their own household, even if they guess another household's UUID.

---

## Multi-Device Support

### Scenario: User logs in on phone and laptop

**Behavior**:
- Same JWT works on both devices
- Sessions independent (logging out on one doesn't affect other)
- Data syncs via Supabase real-time (Phase 2+ feature)

**No device limit**: User can be logged in on unlimited devices

---

## Error Scenarios

### 1. Expired Magic-Link

**User clicks link after 15 minutes**:
- Supabase returns `invalid_token` error
- UI shows: "This login link expired. Request a new one."
- User can re-enter email to get new link

### 2. Invalid Invite Token

**User clicks invite link with invalid/used token**:
- System checks `household_invites` table
- If `used_at` is set OR `expires_at` passed → Error
- UI shows: "This invite link is no longer valid. Ask the sender for a new one."

### 3. Email Not Delivered

**User doesn't receive magic-link email**:
- Check spam folder (common with Supabase default sender)
- Rate limit exceeded (60/hour on free tier)
- Invalid email address
- UI shows: "Email not arrived? Check spam or request a new link."

### 4. Session Expired Mid-Use

**User's JWT expires while using app**:
- Supabase client detects 401 error
- Trigger `onAuthStateChange` event
- Redirect to /login with `?redirect=/current-page`
- After re-auth, redirect back to original page

### 5. Household Already Full

**User B tries to join, but household already has 2 members**:
- Check `users` table: `COUNT(*) WHERE household_id = ?`
- If count >= 2 → Reject
- UI shows: "This household is full. Only 2 members allowed."

**Note**: Phase 1 hard-limits to 2 users per household.

---

## Implementation Details

### Supabase Auth Configuration

**Auth Settings** (Supabase Dashboard → Authentication → Settings):
```
Site URL: https://mealbrain.app (or http://localhost:3000 for local)
Redirect URLs:
  - https://mealbrain.app/**
  - http://localhost:3000/**

Email Auth: Enabled
Email Template: Magic Link
Confirm email: Disabled (magic-link is confirmation)
Mailer Autoconfirm: Enabled

JWT Expiry: 2592000 (30 days in seconds)
Refresh Token Expiry: 5184000 (60 days in seconds)
```

### Frontend: Login Page

**Route**: `/login`

**UI**:
```
┌───────────────────────────────┐
│      MealBrain                │
│                               │
│  [Email address]              │
│                               │
│  [Send Magic Link]            │
│                               │
│  Privacy Policy | Terms       │
└───────────────────────────────┘
```

**Code** (`app/login/page.tsx`):
```typescript
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return <div>Check your email for the magic link!</div>;
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <button type="submit">Send Magic Link</button>
    </form>
  );
}
```

### Frontend: Auth Callback

**Route**: `/auth/callback`

**Purpose**: Handle magic-link redirect, validate token, create session

**Code** (`app/auth/callback/route.ts`):
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token');
  const inviteToken = requestUrl.searchParams.get('invite');

  if (token) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' });

    // Check if user has household
    const { data: user } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!user.household_id && inviteToken) {
      // Handle invite flow
      const { data: invite } = await supabase
        .from('household_invites')
        .select('household_id')
        .eq('token', inviteToken)
        .is('used_at', null)
        .single();

      if (invite) {
        await supabase.from('users').update({
          household_id: invite.household_id,
        }).eq('id', user.id);

        await supabase.from('household_invites').update({
          used_at: new Date().toISOString(),
          used_by: user.id,
        }).eq('token', inviteToken);
      }
    } else if (!user.household_id) {
      // Redirect to household creation
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/planner`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
```

---

## Household Roles (Phase 2+)

**Phase 1**: All users are equal (no role distinction)

**Phase 2+**: Optional role-based permissions
- **Owner**: Can invite members, delete household
- **Member**: Can use all features, cannot delete household

---

## Security Best Practices

### DO
- ✅ Use httpOnly cookies for session tokens
- ✅ Enforce HTTPS in production
- ✅ Rate-limit login attempts (Supabase built-in)
- ✅ Expire magic-links after 15min
- ✅ Validate all tokens server-side
- ✅ Use RLS policies for all tables
- ✅ Log auth events (login, logout, failures)

### DON'T
- ❌ Store session tokens in localStorage (XSS risk)
- ❌ Reuse magic-link tokens
- ❌ Send sensitive data in email
- ❌ Allow unlimited login attempts
- ❌ Skip email validation
- ❌ Trust client-side auth state (always validate server-side)

---

## Testing

### Unit Tests
- Token generation (random, unique)
- Token expiration logic
- Invite link validation

### Integration Tests
- Magic-link flow (send → click → session created)
- Household creation
- Invite flow
- RLS policy enforcement

### E2E Tests
```typescript
test('magic-link authentication flow', async ({ page }) => {
  // 1. Visit login page
  await page.goto('/login');

  // 2. Enter email
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button:has-text("Send Magic Link")');

  // 3. Mock email delivery, extract token
  const magicLink = await getMockEmail('test@example.com');
  const token = new URL(magicLink).searchParams.get('token');

  // 4. Visit callback URL
  await page.goto(`/auth/callback?token=${token}`);

  // 5. Should redirect to planner or onboarding
  await expect(page).toHaveURL(/\/(planner|onboarding)/);
});
```

---

## Monitoring & Analytics

### Auth Events to Track
- Login attempts (success/failure)
- Magic-link sends
- Invite link generation
- Invite link redemption
- Session expirations
- Rate limit hits

### Metrics to Monitor
- Login success rate (target: >95%)
- Magic-link delivery time (target: <30s)
- Session duration (avg: 7-14 days before re-auth)
- Invite conversion rate (invited → joined)

---

## Future Enhancements (Phase 3+)

### Potential Features
- **Biometric auth**: Face ID, Touch ID (native app only)
- **Remember this device**: Skip magic-link for 90 days on trusted devices
- **Multi-household support**: User belongs to >1 household
- **Guest access**: Temporary read-only access (e.g., babysitter)
- **Account deletion**: GDPR compliance, full data export

---

## Version History
- **v1.0** (2025-12-22): Initial authentication flow specification
