# Current Work in Progress

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
