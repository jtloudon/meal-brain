# Meal Planner: Apple Calendar-Style Implementation

**Status:** ✅ COMPLETED (2025-12-30)

## Overview
Converted meal planner from week-based list view to Apple Calendar-style monthly grid with selected date meal list and unified add/edit modal.

## Key Design Decisions

### 1. Calendar Implementation
- **Custom-built month grid** (no external libraries - maintains zero-dependency approach)
- 7 columns (Sun-Sat) × 5-6 rows
- Native JavaScript Date objects for all date handling

### 2. Visual Design (Apple Calendar Style)
- **Calendar cells**: Show only colored dots (6px) - no text
- **Selected date**: Orange background (#fff7ed)
- **Current day**: Light orange background (#fed7aa)
- **Color coding** for meal types:
  - Breakfast: Green (#22c55e)
  - Lunch: Blue (#3b82f6)
  - Dinner: Red (#ef4444)
  - Snack: Yellow/Orange (#f59e0b)
- **Meal list below calendar**: Shows meals for selected date with colored bars
- **Legend**: Centered colored dots without header
- **MealBrain branding** on top left
- **Orange primary color** (#f97316) for buttons/actions

### 3. Edit Modal Pattern
- **Full-screen slide-up modal** (matches grocery list edit pattern)
- Cancel/Save buttons in header (orange)
- Fields: Date, Meal Type, Recipe (searchable), Serving Size (+/-), Notes
- "View recipe" link + "Delete meal" button

### 4. Database Changes
**Add to `planner_meals` table:**
- `serving_size` (INTEGER) - number of servings
- `notes` (TEXT) - optional meal-specific notes

## Implementation Steps

### STEP 1: Database Migration
**File:** `supabase/migrations/20251230_add_planner_meal_fields.sql`

```sql
ALTER TABLE planner_meals
ADD COLUMN IF NOT EXISTS serving_size INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;
```

### STEP 2: Update Backend Layer

**File:** `lib/tools/planner.ts`
- Update `AddMealSchema`: Add optional `serving_size` and `notes`
- Update `addMeal` function: Insert new fields
- Create `UpdateMealSchema` and `updateMeal` function for editing
- Update `listMeals` query: SELECT serving_size and notes

**New File:** `app/api/planner/[id]/route.ts`
- Add PATCH handler for editing meals
- Accepts: `{ date?, meal_type?, serving_size?, notes? }`
- Calls `updateMeal` tool function

**Existing File:** `app/api/planner/route.ts`
- POST handler auto-inherits new fields from tool update (no changes needed)

### STEP 3: Frontend - Calendar View

**File:** `app/planner/page.tsx` (MAJOR REFACTOR)

**State Changes:**
```typescript
const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
const [showEditModal, setShowEditModal] = useState(false);
const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
```

**UI Changes:**
1. **Header:**
   - Left: MealBrain branding
   - Center: Month navigation (< December 2025 >) + "Today" button
   - Right: + button (opens add with date)

2. **Calendar Grid:**
   - 7×6 CSS Grid layout
   - Each cell: Date number + meals for that day
   - **Multiple meals per day:** Stack vertically with dots + names (scrollable if >3)
   - Example: ●Breakfast ●Lunch ●Dinner (each on own line)
   - **Click empty cell:** Navigate to /planner/add?date=YYYY-MM-DD
   - **Click meal:** Open edit modal for that specific meal
   - Current day: light orange background

3. **Legend:**
   - Fixed below calendar, above bottom nav
   - 4 colored dots with labels (Breakfast, Lunch, Dinner, Snack)

4. **Edit Modal (full-screen overlay):**
   - Header: Cancel | Edit meal | Save
   - Date: `<input type="date">`
   - Meal: 4-button grid with colored dots
   - Recipe: Inline searchable list (reuse add page pattern)
   - Serving size: - [4] + buttons
   - Notes: `<textarea>`
   - Actions: "View recipe" (blue link), "Delete meal" (red button)

**Helper Functions:**
- `getMonthStart(date)`: First day of month
- `getCalendarDays(month)`: Array of dates for grid (35-42 days)
- `getMealsForDate(date)`: Filter meals for specific date
- `getMealColor(mealType)`: Return hex color based on type

### STEP 4: Update Add Flow

**File:** `app/planner/add/page.tsx`
- Accept `?date=YYYY-MM-DD` query param to pre-fill date
- Add serving_size field with +/- controls
- Add notes textarea
- Update POST to include new fields

### STEP 5: TypeScript Interface Updates

**Updated PlannedMeal Interface:**
```typescript
interface PlannedMeal {
  id: string;
  recipe_id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  serving_size: number | null; // NEW
  notes: string | null; // NEW
  recipe: {
    title: string;
    tags: string[];
    rating: number | null;
  };
}
```

## Critical Files to Modify

1. **`supabase/migrations/20251230_add_planner_meal_fields.sql`** - Database schema
2. **`lib/tools/planner.ts`** - Backend CRUD logic
3. **`app/api/planner/[id]/route.ts`** - NEW: PATCH endpoint
4. **`app/planner/page.tsx`** - Main calendar UI (major refactor)
5. **`app/planner/add/page.tsx`** - Enhanced add flow

## Final Implementation (Completed)

### User Experience
- ✅ **Calendar interaction:** Click date → Select it, show meals below (no navigation)
- ✅ **Add meal:** "Add Meal" button next to selected date (+ button removed as redundant)
- ✅ **Edit meal:** Click meal in list → Opens edit modal
- ✅ **Recipe selection:** From recipe detail "Add to Planner" → Opens modal at /planner
- ✅ **Single-page app:** Everything on one page, no external navigation
- ✅ **Compact layout:** 4 meals visible without scrolling, legend remains visible

### Technical Decisions
- ✅ **Unified modal:** Same component for add/edit (editingMeal null = add mode)
- ✅ **No separate add page:** /planner/add page deprecated in favor of modal
- ✅ **Query param support:** ?add=true&recipeId=X opens modal with recipe pre-selected
- ✅ **Spacing optimization:** 0px gaps between list items, 50px calendar cells, 10px item padding

## Edge Cases

- Empty cells: Show date only, clickable → navigates to add page with date
- Multiple meals/day: Stack vertically, scrollable if >3 meals
- Long recipe names: Truncate with ellipsis in calendar cells
- Month padding: Gray out dates from prev/next month
- API errors: Show in modal, don't close
- Delete: Confirmation inline in modal

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Calendar displays correct month grid
- [ ] Current day highlighted
- [ ] Meal colors match settings
- [ ] Click date opens add with pre-filled date
- [ ] Click meal opens edit modal
- [ ] Save updates reflect in calendar
- [ ] Delete removes meal
- [ ] Month navigation works
- [ ] Legend displays correctly
