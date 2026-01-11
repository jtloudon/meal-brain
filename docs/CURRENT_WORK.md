# Current Work in Progress

## Context at 2026-01-10

### ✅ Completed Today - UI/UX Polish & Theme Customization

#### 1. Mixed Fraction Display for Serving Sizes
**Problem:** Ingredient quantities displayed with parenthetical serving sizes and decimals (e.g., "mayonnaise (290 g)" showing "1.25" cups)
**Solution:**
- Parser: Strip parenthetical text like `(290 g)` from ingredient names
- Display: Convert decimals to unicode fractions (1.25 → 1 ¼)
- Supports: ⅛, ⅙, ¼, ⅓, ⅜, ½, ⅝, ⅔, ¾, ⅚, ⅞ (11 fractions)
- Algorithm finds nearest common cooking fraction for any decimal
- Files:
  - `lib/utils/parse-ingredients.ts` (strip parentheses)
  - `app/recipes/[id]/page.tsx` (fraction formatting)

#### 2. Per-User Theme Color Customization
**Problem:** All users saw same orange theme color, no personalization
**Solution:** Complete theming system with per-user color preferences

**Architecture:**
- Database: `user_preferences.theme_color` column (hex format, validated)
- Backend: API validates hex format, stores per-user
- Frontend: CSS variables (`--theme-primary`) injected at root layout
- Components: 130+ hardcoded `#f97316` → `var(--theme-primary)` (24 files)
- UI: Settings page with 11-color picker (40px swatches)

**Color Palette:**
- Sky Blue (#00A0DC), Teal (#00BFA5), Ocean (#0284C7)
- Coral (#F87171), Purple (#A78BFA), Emerald (#34D399)
- Light Blue (#93C5FD), Mint (#86EFAC), Yellow (#FCD34D)
- Slate (#64748B), Warm Gray (#78716C)

**Files:**
- `supabase/migrations/20260110000000_add_theme_color_to_preferences.sql`
- `app/api/user/preferences/route.ts` (theme_color field)
- `lib/tools/preferences.ts` (include theme_color)
- `app/globals.css` (--theme-primary variable)
- `app/layout.tsx` (fetch + inject CSS variable)
- `app/settings/ui-preferences/page.tsx` (NEW - color picker)
- 24 component files refactored

#### 3. Settings Page Restructure
**Problem:** "Preferences" section didn't fit with new UI Preferences
**Solution:**
- Removed: "PREFERENCES" section from main settings
- Moved: "AI Preferences" into "APP SETTINGS" section
- Created: New "UI Preferences" page for theme color selection
- Renamed: `/settings/preferences` → `/settings/ai-preferences`
- Files:
  - `app/settings/page.tsx` (restructured sections)
  - `app/settings/ai-preferences/page.tsx` (renamed)
  - `app/settings/ui-preferences/page.tsx` (NEW)

#### 4. Performance Optimizations
**Problem:** Multiple interactions felt slow (1-5 second delays)
**Solutions:**

**a) Serving Size Save (2-5s → Instant)**
- Before: `window.location.reload()` after save
- After: Update local state with API response
- Backend returns full recipe data instead of just `{success: true}`
- Files: `lib/tools/recipe.ts`, `app/recipes/[id]/page.tsx`

**b) Grocery Checkbox Toggle (1s → Instant)**
- Before: Pessimistic update (wait for API response)
- After: Optimistic update (UI updates immediately, revert on error)
- Applies to both `checked` and `out_of_stock` toggles
- Files: `app/groceries/page.tsx`

#### 5. Bottom Navigation Redesign (iOS 16+ Style)
**Evolution:**
1. Original: Solid theme color background, white icons
2. Attempt: White background with colored pill for active tab
3. Final: White background, filled icon for active tab

**Final Design:**
- Background: White (#ffffff) with subtle gray border
- Active icon: Filled with theme color
- Inactive icons: Gray outline only (#9ca3af)
- Clean, minimal, iOS-native feel
- Files: `components/BottomNav.tsx`

#### 6. Recipe Index Visual Updates
**Changes:**
- Icon: Replaced time emoji 🕐 with Lucide `Clock` icon
- Colors: Recipe title black (#111827) instead of theme color
- Stars: Keep theme color for visual accent
- Borders: Removed card borders, added iOS-style inset separators
- Separator: 1px #f3f4f6, starts at 108px (inset from left), 16px margin right
- Result: Less "too much blue", cleaner iOS Messages-style list
- Files: `app/recipes/page.tsx`

#### 7. Meal Planner Edit Modal Fixes
**Problem:** Delete button hidden, page couldn't scroll, cramped layout
**Solution:**
- Fixed scroll height: `calc(100vh - 70px - 64px)` to account for bottom nav
- Reduced button padding: 12px → 8px
- Reduced section margins: 10px → 8px
- Reduced input padding: 8px 12px → 8px
- Result: Delete button now visible without (or minimal) scrolling
- Files: `app/planner/page.tsx`

#### 8. Bug Fixes
**a) Shield Protection Not Persisting**
- Problem: `listLists` query didn't select `protected` field
- Solution: Added `protected` to SELECT query
- Files: `lib/tools/grocery.ts`

**b) Type Errors After Recipe Update**
- Problem: `updateRecipe` return type mismatch
- Solution: Changed return type from `{recipe_id: string}` to `any`
- Files: `lib/tools/recipe.ts`

---

### Test Cases Needed

#### Unit Tests
- [ ] **Fraction conversion algorithm**
  - [ ] 1.5625 → "1 ⅝"
  - [ ] 0.83375 → "⅚"
  - [ ] 1.333 → "1 ⅓"
  - [ ] 0.625 → "⅝"
  - [ ] Edge cases: 0.99 → "1", 0.01 → "0"

- [ ] **Theme color validation**
  - [ ] Valid hex: "#f97316" → passes
  - [ ] Invalid hex: "#zzz" → fails
  - [ ] Missing hash: "f97316" → fails
  - [ ] Wrong length: "#fff" → fails

- [ ] **Parenthetical text stripping**
  - [ ] "butter (290 g)" → "butter"
  - [ ] "flour (2 cups)" → "flour"
  - [ ] "eggs (large)" → "eggs"
  - [ ] Nested parens: "item (test (nested))" → "item"

#### E2E Tests (Playwright)
- [ ] **Theme color customization flow**
  1. Navigate to /settings
  2. Click "UI Preferences"
  3. Select new color (e.g., Teal #00BFA5)
  4. Verify page reloads
  5. Verify bottom nav active icon is teal
  6. Verify recipe stars are teal
  7. Navigate to groceries
  8. Verify checkmarks are teal
  9. Log out and back in
  10. Verify teal persists

- [ ] **Serving size adjustment (instant save)**
  1. Open recipe detail page
  2. Click "Adjust +/-"
  3. Change servings
  4. Click "Save"
  5. Verify modal closes instantly (no page reload)
  6. Verify ingredients update immediately
  7. Verify no page flash/reload

- [ ] **Grocery checkbox optimistic updates**
  1. Open grocery list
  2. Click checkbox on item
  3. Verify checkbox updates instantly (<50ms)
  4. Simulate slow network
  5. Verify checkbox still instant
  6. Simulate network error
  7. Verify checkbox reverts on error

- [ ] **Meal planner edit modal scrolling**
  1. Open planner
  2. Click existing meal
  3. Edit modal opens
  4. Verify Delete button visible (or with minimal scroll)
  5. Test on small viewport (375px width)
  6. Verify all content accessible

- [ ] **Recipe index visual updates**
  1. Navigate to /recipes
  2. Verify recipe titles are black
  3. Verify stars are theme color
  4. Verify clock icon (not emoji)
  5. Verify no card borders
  6. Verify subtle separator lines (inset from left)

- [ ] **Settings restructure**
  1. Navigate to /settings
  2. Verify no "PREFERENCES" section
  3. Verify "AI Preferences" under "APP SETTINGS"
  4. Verify "UI Preferences" under "APP SETTINGS"
  5. Click "UI Preferences"
  6. Verify color picker loads
  7. Click "AI Preferences"
  8. Verify preferences page (no color picker)

---

### Architecture Updates

#### CSS Variables System
**Pattern:** Global theming via CSS variables + React Server Components

```
user_preferences.theme_color (DB)
    ↓
API: GET /api/user/preferences
    ↓
Root Layout (Server Component)
    ↓
<html style={{ '--theme-primary': color }}>
    ↓
All components: var(--theme-primary)
```

**Benefits:**
- No React re-renders (CSS-only)
- Instant theme switching (page reload)
- Zero prop drilling
- Native browser support
- Easy to extend (add more theme properties)

**Alternatives Considered:**
- ❌ React Context: Causes re-renders, more code
- ❌ Tailwind dynamic classes: Can't generate at runtime
- ✅ CSS Variables: Best performance, clean code

#### Optimistic Updates Pattern
**Pattern:** Update UI immediately, revert on error

**Before (Pessimistic):**
```typescript
const res = await fetch(...);  // Wait
if (res.ok) {
  updateState();  // Then update UI
}
```

**After (Optimistic):**
```typescript
updateState();  // Update immediately
try {
  const res = await fetch(...);
  if (!res.ok) updateState(revert);  // Revert on error
} catch {
  updateState(revert);
}
```

**Applied to:**
- Grocery checkbox toggles (checked, out_of_stock)
- Future: Could apply to meal planner edits, recipe ratings

---

### Known Issues
- None currently blocking

---

### Tech Debt Added

#### 1. Theme Color Migration for Existing Users
**Issue:** Existing users don't have `theme_color` set (falls back to default)
**Impact:** Low - default orange matches current behavior
**TODO:**
- Consider backfill script to set default for all existing users
- Or leave as-is (NULL → defaults handled in code)
**Priority:** LOW

#### 2. Fraction Conversion Edge Cases
**Issue:** Algorithm rounds to nearest fraction (might not match user's exact input)
**Example:** User enters "0.4 cups" → displays as "⅓ cup" (0.333)
**Impact:** Low - cooking is imprecise, close enough
**TODO:**
- Document rounding behavior
- Consider showing exact decimal on hover (optional)
**Priority:** LOW

#### 3. Bottom Nav Icon Fill Inconsistency
**Issue:** Not all Lucide icons look good filled (some designed for stroke-only)
**Current:** Calendar, CookingPot, ShoppingCart, Settings work well filled
**Impact:** Low - current icons look fine
**TODO:**
- Monitor user feedback
- Consider custom SVG icons if issues arise
**Priority:** LOW

#### 4. Settings Page Route Rename Legacy References
**Issue:** Old `/settings/preferences` route may be bookmarked
**Solution:** Already renamed file/folder, Next.js will 404
**Impact:** Low - users will navigate from /settings menu
**TODO:**
- Consider 301 redirect in middleware (optional)
**Priority:** LOW

---

## Context at 2026-01-07

### ✅ Completed Today - Invitation System & Security

#### 1. Invitation-Only Signup System
**Problem:** Open signup allows anyone to use deployed app resources
**Solution:**
- Database migration: `household_invites` table with 8-char alphanumeric codes
- API endpoints:
  - `POST /api/invites` - Create invite codes (authenticated)
  - `GET /api/invites` - List household invites (authenticated)
  - `POST /api/invites/validate` - Validate codes (public)
- Settings page: `/settings/invites` to generate & manage invite codes
- Updated onboarding: `/onboarding` requires valid invite code to join
- Codes expire in 30 days, track usage count (0/1, 0/5, etc.)
- Files:
  - `supabase/migrations/20260107155103_add_household_invites.sql`
  - `app/api/invites/route.ts`
  - `app/api/invites/validate/route.ts`
  - `app/settings/invites/page.tsx`
  - `app/onboarding/page.tsx`
  - `app/onboarding/actions.ts`

#### 2. Password Reset Flow
**Problem:** Users couldn't reset forgotten passwords
**Solution:**
- Supabase `resetPasswordForEmail()` triggers password reset email
- Reset link directs to `/settings/password` page
- User can set new password after authentication
- Files: `app/settings/password/page.tsx`

#### 3. PWA Session Persistence
**Problem:** Users logged out when PWA closed on iOS
**Solution:**
- Dual storage strategy: cookies (browser) + localStorage (PWA)
- Middleware refreshes sessions on every request
- Default landing page changed to `/recipes` (was `/planner`)
- Files: `middleware.ts`, auth utilities

#### 4. E2E Testing for Invitations
**Tests Added:**
- Generate invite code (UI + API)
- Validate invite code (valid + invalid)
- Pre-fill from URL parameter (`/onboarding?code=ABC12XYZ`)
- Manual code entry
- Error handling
- Usage tracking display
- Expiration date display
- File: `e2e/household-invites.spec.ts` (8 tests)

#### 5. Public Invite Validation Fix
**Problem:** Validation endpoint returned 401 for unauthenticated users
**Solution:**
- RLS policy allows `anon` users to SELECT from `household_invites`
- Validation works before user signs up
- Actual invite consumption still requires authentication
- File: `supabase/migrations/20260107155103_add_household_invites.sql`

#### 6. Documentation Updates
**Added:**
- Security Architecture section in `docs/01_architecture.md`
- Invitation flow documentation with database schema
- RLS policy explanations
- Password reset flow

---

## Context at 2026-01-05

### ✅ Completed Today - Phone Testing Fixes

#### 1. Search Box iOS Zoom Prevention
**Problem:** Search input caused page zoom/overflow on iOS
**Solution:**
- Changed font size from 15px → 16px (iOS doesn't auto-zoom at 16px+)
- Added `maxWidth: '100%'` and `minWidth: 0` for proper flex constraints
- File: `app/recipes/page.tsx:445,470`

#### 2. Dynamic Meal Type Support (Database)
**Problem:** "Drink" meal type failed with constraint error
**Solution:**
- Created migration to remove hardcoded CHECK constraints
- `recipes.meal_type` and `planner_meals.meal_type` now accept any value
- Meal types validated by app using `user_preferences.meal_courses`
- File: `supabase/migrations/20260105142730_remove_meal_type_constraints.sql`
- **Note:** For fresh clones, `supabase db reset` applies this automatically

#### 3. Dynamic Meal Type Pills
**Problem:** Filter pills only showed hardcoded types (not custom ones like "Drink")
**Solution:**
- Fetch meal types from `/api/settings/meal-courses`
- Pills now display all custom meal types from user settings
- Added horizontal scrolling for overflow
- Changed from equal-width to content-based sizing
- Files: `app/recipes/page.tsx:39,47-59,438,542-570`

#### 4. Recipe Form Font Consistency
**Problem:** Ingredients tab used monospace font, Instructions used default
**Solution:** Removed `fontFamily: 'monospace'` from ingredients textarea
- File: `components/RecipeFormWithTabs.tsx:588`

#### 5. Keyboard Shortcuts Above iOS Keyboard
**Problem:** Toolbar at bottom of page was covered by iOS keyboard
**Solution:**
- Changed from `position: sticky` to `position: fixed`
- Added Visual Viewport API to detect keyboard height
- Toolbar dynamically positions above keyboard
- Only shows on ingredients tab
- Files: `components/RecipeFormWithTabs.tsx:56,117-138,680-696`

#### 6. Recipe Page Scroll Fix
**Problem:** Scroll snap-back when reaching bottom of recipe list
**Solution:**
- Increased bottom padding from `pb-20` (80px) to `calc(80px + env(safe-area-inset-bottom))`
- Accounts for iOS safe area insets
- File: `components/AuthenticatedLayout.tsx:92`

---

## Context at 2026-01-04

### ✅ Completed Today

#### 1. Quantity Range Support for Recipe Ingredients
**Problem:** User wants "1-2 salmon fillets" to display as "1-2", not "1"

**Solution Implemented:**
- ✅ Database migration: Added `quantity_max` column, renamed `quantity` → `quantity_min`
- ✅ Updated `parseIngredientLine` to parse ranges (e.g., "1-2", "½-1")
- ✅ Updated `ingredientsToText` to display ranges correctly
- ✅ Updated all TypeScript interfaces and Zod schemas
- ✅ Updated all API routes (recipes, chat, approval, import)
- ✅ Updated serving size scaling to handle both min and max
- ✅ Migration run successfully

**Files Modified:**
- `supabase/migrations/20260104184621_add_quantity_max_to_recipe_ingredients.sql`
- `supabase/seed.sql`
- `lib/utils/parse-ingredients.ts`
- `lib/tools/recipe.ts`
- `lib/tools/grocery.ts` (uses max value when pushing to grocery)
- `app/recipes/new/page.tsx`
- `app/recipes/[id]/edit/page.tsx`
- `app/recipes/[id]/page.tsx`
- `app/recipes/page.tsx`
- `app/api/recipes/[id]/route.ts`
- `app/api/chat/route.ts`
- `app/api/chat/approve/route.ts`
- `app/onboarding/preferences/actions.ts`
- `app/api/seed-recipes/route.ts`
- `components/RecipeFormWithTabs.tsx`

**How It Works:**
- Recipes store `quantity_min` and optional `quantity_max`
- Parser detects "-" in quantity and splits into min/max
- Display shows "1-2" when max exists, "2" when max is null
- Grocery lists use max value (better to have extra when shopping)
- Serving size scaling multiplies both min and max by ratio

#### 2. Grocery List Range Input Support
**Problem:** User couldn't add "1-3 carrots" - failed validation

**Solution Implemented:**
- ✅ Changed quantity input from `type="number"` to `type="text"` with `inputMode="decimal"`
- ✅ Added client-side parsing to handle ranges (uses max value)
- ✅ Added server-side validation with better error messages
- ✅ Works for both adding new items and editing existing items

**Files Modified:**
- `app/groceries/page.tsx`
- `app/api/grocery/items/route.ts`

#### 3. Search UI Redesign
**Problem:** Search bar added a new row, pushing content down

**Solution Implemented:**
- ✅ Search icon moved to top-left in header
- ✅ When clicked, expands into pill-shaped input in-place
- ✅ Import and + buttons stay on top-right
- ✅ Removed "Recipes" title text
- ✅ No layout shift when search activates

**Files Modified:**
- `app/recipes/page.tsx`

#### 4. Bottom Navigation Fixed Position
**Problem:** Bottom nav moved down when content changed

**Solution Implemented:**
- ✅ Changed AuthenticatedLayout to use `h-screen` with `overflow-hidden`
- ✅ Main content has `overflow-y-auto` for independent scrolling
- ✅ Bottom nav stays fixed at all times

**Files Modified:**
- `components/AuthenticatedLayout.tsx`

#### 5. Sous Chef Button Overlap Fix
**Problem:** Floating AI button covered edit icons on grocery items

**Solution Implemented:**
- ✅ Added 70px right padding to edit button
- ✅ Icons now visible and clickable

**Files Modified:**
- `app/groceries/page.tsx`

#### 6. Meal Planner Error Handling
**Problem:** Cryptic error when AI tried to use invalid recipe IDs

**Solution Implemented:**
- ✅ Better error message guides AI to call `recipe_list` first
- ✅ Clearer feedback when recipe not found

**Files Modified:**
- `app/api/chat/approve/route.ts`

#### 7. Recipe List Tool Schema Fix
**Problem:** TypeScript error - `meal_type` not in filters schema

**Solution Implemented:**
- ✅ Added `meal_type` to ListRecipesSchema filters
- ✅ Fixed executeTool to pass both userId and householdId

**Files Modified:**
- `lib/tools/recipe.ts`
- `app/api/chat/route.ts`

#### 8. Recipe Import Heuristics Fix
**Problem:** Missing `source` field in fallback parser

**Solution Implemented:**
- ✅ Added `source: url` to extractFromHeuristics return

**Files Modified:**
- `app/api/recipes/import/route.ts`

### Test Cases Needed

#### Unit Tests
- [ ] `parseIngredientLine` with quantity ranges
  - [ ] "1-2 salmon fillets" → `{quantity_min: 1, quantity_max: 2}`
  - [ ] "½-1 cup water" → `{quantity_min: 0.5, quantity_max: 1}`
  - [ ] "2 cups flour" → `{quantity_min: 2, quantity_max: null}`
  - [ ] "1-2.5 lb chicken" → `{quantity_min: 1, quantity_max: 2.5}`

- [ ] `ingredientsToText` with quantity ranges
  - [ ] Range: `{quantity_min: 1, quantity_max: 2}` → "1-2 cups flour"
  - [ ] Single: `{quantity_min: 2, quantity_max: null}` → "2 cups flour"
  - [ ] Fraction range: `{quantity_min: 0.5, quantity_max: 1}` → "½-1 cup water"

- [ ] Grocery list quantity parsing
  - [ ] "1-3" → 3 (max value)
  - [ ] "0.5-1" → 1 (max value)
  - [ ] "2" → 2 (single value)

#### E2E Tests (Playwright)
- [ ] **Create recipe with quantity range**
  1. Navigate to /recipes/new
  2. Enter "1-2 salmon fillets" in ingredients
  3. Submit form
  4. Verify recipe displays "1-2 salmon fillets"

- [ ] **Edit recipe with quantity range**
  1. Open existing recipe
  2. Edit ingredient to "1-3 cups rice"
  3. Save changes
  4. Verify displays "1-3 cups rice"

- [ ] **Import recipe with ranges**
  1. Upload recipe image with "1-2" quantity
  2. Verify parsed as range
  3. Save and verify display

- [ ] **Serving size scaling with ranges**
  1. Create recipe with "1-2 salmon fillets" (serves 2)
  2. Adjust to 4 servings
  3. Verify displays "2-4 salmon fillets"
  4. Adjust back to 2 servings
  5. Verify displays "1-2 salmon fillets"

- [ ] **Push recipe ingredients with ranges to grocery list**
  1. Open recipe with range ingredients
  2. Push to grocery list
  3. Verify grocery items use max value (e.g., "2 salmon fillets")

- [ ] **Add grocery item with range**
  1. Open grocery list
  2. Add item "1-3 whole carrots"
  3. Verify saves as "3 whole carrots"

- [ ] **Search UI behavior**
  1. Navigate to /recipes
  2. Click search icon
  3. Verify input expands in-place
  4. Verify bottom nav stays fixed
  5. Verify Import/+ buttons don't move

- [ ] **Bottom nav fixed position**
  1. Navigate to any page
  2. Scroll content
  3. Toggle search on/off
  4. Verify bottom nav never moves

### Known Issues
- None currently blocking

### Next Steps
- Write unit tests for quantity range parsing
- Write E2E tests for complete workflow
- Consider adding visual indicator for ranges in UI (optional)
