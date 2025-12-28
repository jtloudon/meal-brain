# Dev Login Implementation - Current Blocker

**Status:** BLOCKED - Requires different approach

## What We Tried (All Failed)

1. **Password-based login** - `signInWithPassword()` always returns "Invalid login credentials" even with proper bcrypt hashing
2. **Magic link OTP** - `verifyOtp()` fails with "Email link is invalid or has expired"
3. **PKCE signup** - Can't use for existing users ("email already registered")
4. **Server-side cookie injection** - Cookies don't persist across redirects
5. **Client-side session setting** - Requires valid tokens which leads back to problem #2
6. **Middleware session injection** - Same token expiration issues

## Root Cause

Supabase's local development auth is designed for production magic link flows, not automated dev login. All approaches hit fundamental limitations:
- Passwords require email confirmation flow
- Magic links (OTP) expire immediately and can't be reused
- PKCE codes only work for new user signup
- Session tokens must be valid Supabase JWT tokens

## Current Code State

### What Works
- ✅ `/dev-login` page UI
- ✅ `devLogin()` action creates users in `auth.users`
- ✅ `devLogin()` action creates records in `users` table with `household_id`
- ✅ Seed data has Demo Household and Test Household

### What's Incomplete
- ❌ Session creation - no working auth bypass for dev mode
- ❌ E2E tests - can't test login flow until it works
-❌ Dev login doesn't actually log you in

## Recommended Path Forward

**Option A: Accept Manual Magic Link for Dev** (Fastest)
- Use production magic link flow for local dev
- Check Mailpit at http://127.0.0.1:54324 for magic link emails
- Click link to authenticate
- Not automated, but works

**Option B: Custom Dev Auth Bypass** (Clean but Complex)
- Create custom middleware that:
  1. Checks for `dev-session` cookie
  2. If present, mock `getUser()` calls to return dev user
  3. Inject mock session into Supabase client
- Requires forking/wrapping Supabase client
- ~100 lines of code

**Option C: Supabase Config Deep Dive** (Time Intensive)
- Debug why password auth fails in local Supabase
- Check auth configuration in `supabase/config.toml`
- May require Supabase version upgrade
- No guarantee of success

## Files Modified (This Session)

- `app/dev-login/actions.ts` - Creates user + household, attempts session (incomplete)
- `app/dev-login/page.tsx` - UI for dev login
- `e2e/dev-login.spec.ts` - E2E test (will fail until login works)
- Deleted: `/app/auth/dev-session/`, `/app/auth/dev-callback/`, `/app/api/dev-session/`

## Next Steps

1. **Decide approach** - A, B, or C above
2. **If Option A**: Document manual magic link workflow
3. **If Option B**: Implement custom auth bypass (needs fresh session)
4. **If Option C**: Debug Supabase local config

## Authentication Flows (Documentation TODO)

### Production
- User enters email → Magic link sent → Click link → Authenticated

### Development (CURRENT BLOCKER)
- **Intended**: Click user in `/dev-login` → Instant auth bypass
- **Reality**: No working implementation

### Testing (E2E)
- **Intended**: Programmatic user creation with session
- **Reality**: Blocked by same auth issues

---

*Last Updated: 2025-12-27*
*Session Context: Nearly exhausted (148k/200k tokens)*
