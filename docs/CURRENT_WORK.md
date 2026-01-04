# Current Work in Progress

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
