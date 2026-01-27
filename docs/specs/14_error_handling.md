# 14 – Error Handling Strategy

**Comprehensive error handling strategy for all system failure modes.**

This document defines how the system handles errors, degrades gracefully, and communicates failures to users.

---

## Guiding Principles

### Error Handling Philosophy
1. **Fail visibly, not silently**: Users must know when something went wrong
2. **Graceful degradation**: Non-critical failures shouldn't break core functionality
3. **Clear, actionable messages**: Tell users what happened and what they can do
4. **Preserve user data**: Never lose user input due to errors
5. **Log for debugging**: Capture errors for troubleshooting without exposing to user

### User Experience Goals
- **No cryptic error codes**: Human-readable messages only
- **Suggest next actions**: "Try again", "Check connection", "Contact support"
- **Preserve context**: Don't lose user's work when error occurs
- **Quick recovery**: Easy retry or alternative path

---

## Error Categories

### 1. Network Failures
**Cause**: Internet connection lost, service unreachable

**Examples**:
- User's device offline
- Supabase server unreachable
- Anthropic API timeout
- DNS resolution failure

**Handling Strategy**:
- **Detection**: Network request timeout (10s for API calls, 30s for LLM)
- **User message**: "Unable to connect. Check your internet connection and try again."
- **Retry logic**: Exponential backoff (1s, 2s, 4s) up to 3 attempts
- **Fallback**: Enable offline mode for read-only operations (if applicable)

**Implementation**:
```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

### 2. LLM Timeouts & Failures

**Cause**: Anthropic API slow response, rate limit, or service error

**Examples**:
- Claude API timeout (>30s)
- Rate limit exceeded
- Model overloaded
- Invalid API key

**Handling Strategy**:

**Timeout** (response >30s):
- **Detection**: Request timeout after 30s
- **User message**: "AI is taking longer than usual. Try a simpler request or try again later."
- **Retry logic**: Allow manual retry, don't auto-retry (expensive)
- **Fallback**: Offer manual operation (e.g., "Create recipe manually instead?")

**Rate Limit** (429 error):
- **Detection**: HTTP 429 response
- **User message**: "AI is temporarily busy. Please wait a moment and try again."
- **Retry logic**: Wait 60s and retry once
- **Fallback**: Queue request for later processing (Phase 2+ feature)

**API Error** (500, 503):
- **Detection**: HTTP 5xx response
- **User message**: "AI service temporarily unavailable. You can still use manual features."
- **Retry logic**: No auto-retry
- **Fallback**: Disable AI panel, show notice at top of screen

**Invalid API Key** (401 error):
- **Detection**: HTTP 401 response
- **User message**: (Admin only) "AI API key invalid. Check environment variables."
- **Retry logic**: None
- **Fallback**: Disable AI features entirely

---

### 3. Supabase Database Errors

**Cause**: Database connection failure, constraint violation, permission denied

**Examples**:
- Connection timeout
- Foreign key violation
- Unique constraint violation
- RLS policy denied access

**Handling Strategy**:

**Connection Timeout**:
- **Detection**: Supabase client timeout (10s)
- **User message**: "Database temporarily unavailable. Try again in a moment."
- **Retry logic**: Exponential backoff (3 attempts)
- **Fallback**: None (database is critical)

**Constraint Violation** (duplicate recipe, foreign key error):
- **Detection**: Postgres error code (23505, 23503)
- **User message**: "A recipe with this name already exists. Choose a different name."
- **Retry logic**: None (user must fix input)
- **Fallback**: Show validation error inline

**Permission Denied** (RLS policy block):
- **Detection**: Postgres error (insufficient privilege)
- **User message**: "You don't have permission to access this resource."
- **Retry logic**: None
- **Fallback**: Log user out, force re-authentication

**Query Timeout** (slow query >10s):
- **Detection**: Supabase timeout
- **User message**: "This operation is taking too long. Try again or simplify your request."
- **Retry logic**: Allow manual retry
- **Fallback**: None

---

### 4. Tool Execution Errors

**Cause**: Tool validation failure, business logic error, database constraint

**Examples**:
- Invalid input schema (Zod validation fails)
- Recipe not found
- Ingredient quantity invalid
- Date format wrong

**Handling Strategy**:

**Validation Error** (Zod schema fails):
- **Detection**: Zod `ZodError` thrown
- **User message**: "Invalid input: [field] [error]. Please fix and try again."
- **Example**: "Invalid input: quantity must be a number. Please fix and try again."
- **Retry logic**: None (user must fix)
- **Fallback**: Show inline validation error with suggested correction

**Business Logic Error** (e.g., recipe not found):
- **Detection**: Tool returns error object
- **User message**: "Recipe not found. It may have been deleted."
- **Retry logic**: None
- **Fallback**: Return to previous screen

**Transaction Rollback** (partial failure):
- **Detection**: Database transaction fails midway
- **User message**: "Operation failed. No changes were made."
- **Retry logic**: Allow manual retry
- **Fallback**: Ensure all-or-nothing (no partial writes)

**Example Tool Error Response**:
```typescript
// Tool execution error
{
  success: false,
  error: {
    type: "VALIDATION_ERROR" | "NOT_FOUND" | "PERMISSION_DENIED" | "UNKNOWN",
    message: "Quantity must be a positive number",
    field: "quantity", // optional
    suggestion: "Please enter a number greater than 0", // optional
  }
}
```

---

### 5. Authentication Errors

**Cause**: Session expired, invalid token, magic-link expired

**Examples**:
- JWT expired (after 30 days)
- Magic-link clicked after 15 minutes
- Invalid session token
- User logged out on another device

**Handling Strategy**:

**Session Expired**:
- **Detection**: Supabase Auth `onAuthStateChange` event
- **User message**: "Your session expired. Please log in again."
- **Retry logic**: None
- **Fallback**: Redirect to login, preserve URL for redirect after auth

**Magic-Link Expired** (clicked after 15min):
- **Detection**: Supabase Auth error on token validation
- **User message**: "This login link expired. Request a new one."
- **Retry logic**: None
- **Fallback**: Show login form again

**Invalid Token**:
- **Detection**: Supabase Auth error
- **User message**: "Invalid login link. Request a new one."
- **Retry logic**: None
- **Fallback**: Show login form

**Multi-Device Conflict** (logged out elsewhere):
- **Detection**: Session invalidated
- **User message**: "You were logged out from another device. Please log in again."
- **Retry logic**: None
- **Fallback**: Redirect to login

---

### 6. Client-Side Validation Errors

**Cause**: User input doesn't match expected format

**Examples**:
- Empty required field
- Invalid email format
- Negative quantity
- Date in past

**Handling Strategy**:
- **Detection**: Form validation before submission
- **User message**: Inline error under field ("Email is required", "Quantity must be positive")
- **Retry logic**: None (user fixes inline)
- **Fallback**: Disable submit button until valid
- **UX**: Real-time validation (on blur or after 500ms typing pause)

**Example Validation Messages**:
- Email: "Please enter a valid email address"
- Quantity: "Quantity must be a positive number"
- Date: "Date cannot be in the past"
- Recipe name: "Recipe name is required (max 100 characters)"

---

### 7. File Upload Errors (Phase 2+)

**Cause**: Image too large, unsupported format, storage quota exceeded

**Examples**:
- Image >5MB
- Non-image file uploaded
- Supabase storage quota exceeded

**Handling Strategy**:

**File Too Large**:
- **Detection**: Client-side check before upload
- **User message**: "Image must be smaller than 5MB. Compress and try again."
- **Retry logic**: None
- **Fallback**: Show image compression tips

**Unsupported Format**:
- **Detection**: Client-side MIME type check
- **User message**: "Only JPG, PNG, and WebP images are supported."
- **Retry logic**: None
- **Fallback**: Show supported formats

**Storage Quota Exceeded**:
- **Detection**: Supabase storage error
- **User message**: "Storage limit reached. Delete old images or upgrade plan."
- **Retry logic**: None
- **Fallback**: Disable image uploads, show admin notice

---

## Error Message Templates

### User-Facing Messages (Non-Technical)

```typescript
const ERROR_MESSAGES = {
  // Network
  NETWORK_ERROR: "Unable to connect. Check your internet connection and try again.",
  TIMEOUT: "This is taking longer than usual. Try again later.",

  // Authentication
  SESSION_EXPIRED: "Your session expired. Please log in again.",
  INVALID_LINK: "This login link is invalid or expired. Request a new one.",

  // Database
  DB_UNAVAILABLE: "Service temporarily unavailable. Try again in a moment.",
  PERMISSION_DENIED: "You don't have permission to access this.",

  // AI
  AI_TIMEOUT: "AI is taking too long. Try a simpler request.",
  AI_UNAVAILABLE: "AI temporarily unavailable. Manual features still work.",
  AI_RATE_LIMIT: "Too many AI requests. Please wait a moment.",

  // Validation
  REQUIRED_FIELD: "{field} is required.",
  INVALID_FORMAT: "{field} format is invalid.",
  DUPLICATE: "A {resource} with this name already exists.",
  NOT_FOUND: "{resource} not found. It may have been deleted.",

  // Generic
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};
```

### Developer-Facing Logs (Technical)

```typescript
// Structured error logging
logger.error({
  errorType: "SUPABASE_QUERY_TIMEOUT",
  userId: user.id,
  query: "SELECT * FROM recipes WHERE household_id = ?",
  duration: "10043ms",
  timestamp: new Date().toISOString(),
  stack: error.stack,
});
```

---

## Error UI Components

### Toast Notification (Temporary)
Use for non-critical errors that don't block workflow:
- Network temporarily slow
- AI timeout (can retry)
- Non-blocking validation

**Design**:
- Red background for errors
- Yellow background for warnings
- Auto-dismiss after 5s (user can dismiss earlier)
- Position: Top-right on desktop, top-center on mobile

### Modal Dialog (Blocking)
Use for critical errors requiring user action:
- Session expired (must log in)
- Permission denied (can't proceed)
- Tool execution failed (data not saved)

**Design**:
- Full-screen overlay (semi-transparent)
- Centered modal with error icon
- Clear message + action button ("Log in", "Go back", "Try again")

### Inline Error (Field-Level)
Use for validation errors on forms:
- Required field empty
- Invalid format
- Duplicate name

**Design**:
- Red text under field
- Red border on input
- Clear, specific message ("Email is required")

---

## Retry & Recovery Strategies

### Exponential Backoff
For transient network errors:
```
Attempt 1: Wait 0s → Retry
Attempt 2: Wait 1s → Retry
Attempt 3: Wait 2s → Retry
Attempt 4: Wait 4s → Retry
Give up → Show error
```

### Circuit Breaker
For repeated failures to same service:
```
If 5 consecutive failures:
  → Mark service as "down"
  → Skip retries for 60s
  → Show "Service unavailable" notice
  → After 60s, attempt 1 request to test recovery
```

### Queue for Later (Phase 2+)
For non-urgent operations:
- AI-suggested meal plans
- Recipe imports from URLs
- Background data sync

**Strategy**: Queue failed operations, retry when service recovers

---

## Logging & Monitoring

### What to Log

**Errors** (always log):
- Error type and message
- User ID (for support)
- Timestamp
- Request context (URL, method, params)
- Stack trace (server-side only)

**Warnings** (log for investigation):
- Slow queries (>2s)
- High retry counts
- Approaching rate limits

**Don't Log** (security/privacy):
- API keys
- Passwords
- Magic-link tokens
- Full request bodies (may contain sensitive data)

### Log Levels
```
ERROR:   System failures, critical issues
WARN:    Degraded performance, approaching limits
INFO:    Normal operations, significant events
DEBUG:   Detailed diagnostics (dev only)
```

### Where to Log

**Development**:
- Console (`console.error`, `console.warn`)
- Local files (optional)

**Production**:
- **Option 1**: Vercel logs (built-in, limited retention)
- **Option 2**: Sentry (error tracking, free tier: 5K events/month)
- **Option 3**: LogRocket (session replay + logs, paid)

**Recommendation**: Start with Vercel logs, add Sentry if errors frequent.

---

## Testing Error Scenarios

### Manual Testing Checklist
- [ ] Disconnect WiFi → Test network error handling
- [ ] Invalid Anthropic API key → Test AI unavailable fallback
- [ ] Expire session manually → Test session expired flow
- [ ] Submit invalid form data → Test validation errors
- [ ] Delete recipe used in planner → Test cascade error handling
- [ ] Exceed Supabase rate limit → Test throttling

### Automated Error Tests
```typescript
describe('Error Handling', () => {
  it('shows network error on fetch timeout', async () => {
    // Mock fetch to timeout
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
    );

    await expect(fetchRecipes()).rejects.toThrow();
    expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
  });

  it('gracefully degrades when AI unavailable', async () => {
    // Mock Anthropic API 503 error
    mockAnthropicAPI.mockRejectedValue(new Error('Service unavailable'));

    render(<ChatPanel />);
    expect(screen.getByText(/AI temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument(); // Chat disabled
  });
});
```

---

## Fallback Modes

### Read-Only Mode
When database writes fail but reads work:
- Disable all edit/create buttons
- Show banner: "Some features temporarily unavailable"
- Allow viewing data only

### Offline Mode (Phase 2+)
When network completely unavailable:
- Cache last-fetched data (recipes, planner, grocery lists)
- Allow browsing cached data
- Queue write operations for later sync
- Show banner: "Offline - changes will sync when online"

### Manual-Only Mode
When AI unavailable:
- Disable AI chat panel
- Show notice: "AI features temporarily unavailable"
- All manual CRUD still works

---

## Version History
- **v1.0** (2025-12-22): Initial error handling strategy specification
