# 18 – UI Refinement Decisions

**Purpose**: Track UI/UX design decisions, reference materials, and implementation notes for Phase 3 polish.

---

## Reference Materials

### Recipe Keeper App Screenshots
**Location**: `docs/reference-screen-shots/`
**Source**: Recipe Keeper iOS app (competitor analysis)

**Key learnings**:
- Home tab = Recipes list (card grid with images)
- Shopping list shows category headers (Bakery, Condiments, etc.)
- Each grocery item shows source recipe below ingredient
- Orange/rust color scheme throughout (`#C75B39` approx)
- Badge count on Shopping tab showing unchecked items
- Clean typography, generous spacing
- Bottom nav: Home, Shopping, Planner, Cookbooks, Settings

**Relevance**:
- ✅ Navigation structure (except Cookbooks - we don't need this)
- ✅ Visual polish benchmark
- ✅ Grocery list category organization
- ❌ Color scheme (we'll use our own palette)

---

## Design Decisions (2025-12-28)

### Decision 1: Color System - Theme Variables
**Decision**: Use CSS variables for all theme colors to allow easy adjustment without code changes.

**Rationale**:
- Don't want to commit to specific colors during Phase 3
- Need flexibility to experiment with palettes later
- Tailwind already has color definitions but need to make them CSS-var-based

**Implementation**:
- [ ] Update `tailwind.config.ts` to use CSS variable references
- [ ] Define all theme colors in `app/globals.css` as CSS variables
- [ ] Replace hardcoded color values (e.g., `text-blue-600`) with theme classes (e.g., `text-primary`)
- [ ] Document color variable names in this file

**Colors to parameterize**:
- `primary` (currently blue `#4A90E2`, used for active states, buttons)
- `accent` (currently orange `#FFA500`, specified in docs but not widely used)
- `secondary` (dark gray `#333333`, text)
- `surface` (light gray `#F9F9F9`, card backgrounds)
- `border` (very light gray `#F0F0F0`, dividers)

---

### Decision 2: Recipe Images
**Decision**: Support recipe images with three capabilities:
1. User upload (file picker)
2. URL import (when importing recipe from external source)
3. Edit/replace image later

**Rationale**:
- Recipe Keeper shows images are valuable for quick visual recognition
- Flexibility in how users add recipes (manual upload vs import)
- Phase 5 OCR feature will need image support anyway

**Implementation**:
- [ ] Add `image_url` field to `recipes` table (nullable)
- [ ] Create Supabase Storage bucket for recipe images
- [ ] Add image upload component to recipe create/edit forms
- [ ] Add image URL field to recipe import flow (Phase 5)
- [ ] Show placeholder image when no image exists
- [ ] Add "Edit Image" button to recipe detail screen

**UX Considerations**:
- Images should be optional (not required)
- Aspect ratio: Square or 4:3 (to be decided during implementation)
- Max file size: 5MB
- Supported formats: JPEG, PNG, WebP, **HEIC** (iPhone default camera format)
- Note: HEIC files may need server-side conversion to WebP for web display

---

### Decision 3: Recipe View Toggle (Cards vs List)
**Decision**: Allow users to toggle between "card view with images" and "list view (text-only)".

**Rationale**:
- Some users prefer visual browsing (images)
- Some prefer density (list view shows more recipes without scrolling)
- Personal preference should be persisted per user

**Implementation**:
- [ ] Add view toggle button to recipes page (icon: grid vs list)
- [ ] Store preference in `user_preferences` table
- [ ] Card view: Image + title + rating + tags (larger cards)
- [ ] List view: Title + rating + tags (current compact layout)
- [ ] Default to list view if no preference set

---

### Decision 4: Grocery List Categories
**Decision**: Auto-categorize grocery items into sections (Produce, Dairy, Meat, etc.).

**Rationale**:
- Recipe Keeper shows this improves shopping efficiency (aisle-based grouping)
- Reduces time scrolling through long grocery lists
- Standard grocery categories are well-known

**Implementation**:
- [ ] Add `category` field to `ingredients` table (nullable)
- [ ] Define standard categories (Produce, Dairy, Meat, Bakery, Condiments, Pantry, Other)
- [ ] Update grocery list UI to group items by category
- [ ] Show category headers in grocery list (collapsible?)
- [ ] Allow manual category override in recipe ingredient editor

**Category List** (initial):
1. Produce (fruits, vegetables)
2. Meat & Seafood
3. Dairy & Eggs
4. Bakery
5. Pantry (dry goods, spices)
6. Condiments & Sauces
7. Frozen
8. Other

---

### Decision 5: Grocery Tab Badge Count
**Decision**: Show badge count of unchecked items on Groceries tab.

**Question**: With multiple grocery lists, which count to show?

**Options**:
1. Total unchecked items across ALL lists
2. Unchecked items in "active" list only (user selects which list is active)
3. No badge count (too complex with multiple lists)

**Decision**: **Option 2** - Show count for "active" grocery list only.

**Rationale**:
- Most users shop from one list at a time
- Avoids confusion with multiple lists (e.g., "Weekly" vs "Costco Run")
- User can set which list is "active" in grocery list selector

**Implementation**:
- [ ] Add `active_grocery_list_id` to `user_preferences` table
- [ ] Default to most recently created list if no active list set
- [ ] Update grocery list selector to show "star" icon for active list
- [ ] Calculate badge count only for active list
- [ ] Update `BottomNav` component to fetch and display count

---

### Decision 6: Mobile-First Responsive Design
**Question**: Is mobile-first baked into our design?

**Answer**: Yes, but needs validation.

**Current state**:
- UI design doc specifies 375px-667px viewport (iPhone SE to Pro Max)
- Tailwind breakpoints default to mobile-first
- Components built with mobile layout as base

**Gaps**:
- No actual testing on real devices or browser DevTools
- No responsive breakpoint testing (tablet, desktop)
- Touch target sizes not validated (WCAG requires 44x44px minimum)

**Implementation**:
- [ ] Test on Chrome DevTools (iPhone 14 Pro simulation)
- [ ] Test on actual iPhone via local network
- [ ] Validate touch targets are 44x44px minimum
- [ ] Add tablet breakpoint styles (optional, Phase 3+)
- [ ] Document mobile testing workflow in this file

---

## Mobile Testing Workflow

### Browser DevTools (Quickest)
1. **Chrome**: `Cmd+Option+I` → Click device icon → Select "iPhone 14 Pro"
2. **Firefox**: `Cmd+Option+M` → Responsive Design Mode
3. **Safari**: Develop menu → Enter Responsive Design Mode

### Test on Real iPhone (Better)
1. Run `npm run dev` (starts on `http://localhost:3000`)
2. Find your Mac's local IP: `ifconfig | grep inet` (look for `192.168.x.x`)
3. On iPhone (same WiFi network): Open Safari → Navigate to `http://192.168.x.x:3000`
4. Add to Home Screen for PWA testing

### Responsive Breakpoints to Test
- **Mobile**: 375px (iPhone SE)
- **Mobile Large**: 428px (iPhone 14 Pro Max)
- **Tablet**: 768px (iPad)
- **Desktop**: 1024px+ (optional)

---

## Implementation Priority

### Phase 3.1: Functional Enhancements (Current Focus)
1. ✅ Move grocery items between lists (completed 2025-12-28)
2. Recipe images (upload, display, edit)
3. Grocery list categories
4. View toggle (cards vs list)
5. Badge count on Groceries tab

### Phase 3.2: Visual Polish
1. CSS variable theme system
2. Spacing and typography refinement
3. Enhanced shadows and borders
4. Loading states
5. Error states
6. Mobile responsiveness testing

### Phase 3.3: Accessibility
1. Touch target validation (44x44px)
2. Color contrast audit (WCAG AA)
3. Keyboard navigation
4. ARIA labels
5. Screen reader testing

---

## Open Questions

### Recipe Import Feature
**Question**: Do we have a recipe import feature yet (import from URL)?

**Answer**: No. Planned for Phase 5 (docs/08_implementation_plan.md, line 347-351).

**Options**:
1. Build basic URL import now (Phase 3) - scrapes recipe from URL, extracts image
2. Defer to Phase 5 with OCR feature
3. Build manual image upload now, defer URL import to Phase 5

**Recommendation**: Build manual image upload in Phase 3.1, defer URL import/scraping to Phase 5.

---

## Version History
- **v1.0** (2025-12-28): Initial creation. Captured decisions from Phase 3 UI refinement discussion.
