# 07 – UI Design System (Mobile-First)

This document defines the complete UI/UX design system for the household meal planning application. It consolidates design goals, visual design tokens, iconography, layout structure, and wireframes.

---

## Design Goals & Principles

### Core Goals
- **Mobile-first**: Optimized for one-handed use on smartphones
- **Minimal scrolling**: Critical content visible without scrolling
- **One primary action per screen**: Clear hierarchy of actions
- **Flat, modern, mostly white**: Clean aesthetic, minimal visual noise
- **No "desktop dashboard" feel**: Native iOS app experience in web

**Success metric**: This is a web app that should *feel* like a native iOS app.

### Design Principles
- Responsive web app (PWA) installable on iOS
- Bottom tab navigation for primary flows
- Persistent AI chat panel (overlay, context-aware)
- Explicit confirmations before any data mutations
- Transparent, reversible actions

---

## Visual Design System

### Color Palette

**Implementation**: All colors defined as CSS variables in `app/globals.css` for easy customization.

**Primary Colors**:
- **Primary**: `#4A90E2` (blue) - Primary actions, AI responses, active tab states
  - Tailwind: `bg-primary`, `text-primary`, `border-primary`
  - CSS var: `var(--primary)`, `var(--primary-hover)`
- **Accent**: `#FFA500` (orange) - Call-to-action buttons, ratings
  - Tailwind: `bg-accent`, `text-accent`, `border-accent`
  - CSS var: `var(--accent)`, `var(--accent-hover)`

**Neutral Colors**:
- **Background**: `#FFFFFF` (white)
- **Secondary**: `#333333` (dark gray) - Text, secondary UI elements
- **Surface**: `#F9F9F9` (light gray) - Card backgrounds
- **Border**: `#F0F0F0` (very light gray) - Dividers, input backgrounds

**Semantic Colors**:
- **Success**: `#10B981` (green) - Success states
- **Error**: `#EF4444` (red) - Errors, destructive actions
- **Warning**: `#F59E0B` (amber) - Warnings
- **Info**: `#3B82F6` (blue) - Informational messages

**To customize colors**: Edit `app/globals.css` `:root` section. Changes apply instantly without rebuild.

### Typography
- **Font family**: System sans-serif (iOS defaults to San Francisco)
- **Font sizes**:
  - 16px: Headers
  - 14px: Card titles, buttons
  - 12px: Tags, metadata, supporting text
- **Font weights**:
  - Regular (400): Body text
  - Bold (600-700): Headers, card titles

### Spacing Scale
- **Base unit**: 8px
- **Scale**: 8px / 16px / 24px
- **Component padding**: 8px default, 16px for larger cards
- **Vertical rhythm**: 16px between major sections

### Elevation / Shadows
- **Subtle drop-shadow**: `2px` offset, soft blur
- **Use sparingly**: Cards, modals, bottom nav only
- **No heavy shadows**: Maintains flat, modern aesthetic

### Shape / Borders
- **Border radius**: 8px for all cards, buttons, inputs
- **Modal border radius**: 16px (top corners only for slide-up panels)
- **No sharp corners**: All interactive elements rounded

---

## Iconography

### Icon Library
**Lucide React** (`lucide-react`) - Exclusive icon set for all UI elements

### Icon Specifications
- **Stroke width**: 2px (default)
- **Size**: 20–24px (mobile)
- **Color**: Inherits from theme (no hard-coded colors)
- **Style**: Monochrome, outline only (no filled variants)

### Icon Inventory

#### Bottom Navigation
- **Planner**: `Calendar`
- **Recipes**: `CookingPot` or `BookOpen`
- **Groceries**: `ShoppingCart`
- **Settings**: `Settings`

#### Chat Panel
- **Voice input**: `Mic`
- **Image input**: `Camera`
- **Send message**: `Send`

#### General UI
- **Add**: `Plus`
- **Delete**: `Trash2`
- **Edit**: `Edit`
- **Search**: `Search`
- **Checkmark**: `Check`

### Icon Usage Rules
1. Icons must come from `lucide-react` unless explicitly documented otherwise
2. No icon color overrides - use CSS color inheritance
3. Any new icon usage requires updating this section first
4. No custom SVG icons without approval

---

## Layout Structure

### Global Layout
All screens follow this consistent structure:

```
┌─────────────────────────┐
│  Top: Contextual Header │ (Title, search, nav)
├─────────────────────────┤
│                         │
│  Middle: Primary Content │ (Cards, lists, forms)
│                         │
├─────────────────────────┤
│  Bottom: Persistent Tabs │ (Always visible)
└─────────────────────────┘
│  Overlay: AI Chat Panel │ (Slide-up drawer)
```

### Bottom Tab Bar
- **Height**: 56px
- **Background**: `#FFFFFF`
- **Shadow**: 2px drop-shadow
- **Items**: 4 tabs with icon + label
- **Spacing**: Equal distribution across width
- **Interaction**: Tap switches content area only (tabs remain persistent)

### AI Chat Panel
- **Behavior**: Slide-up drawer overlay
- **Height**: 50% of viewport (adjustable)
- **Border radius**: 16px (top corners only)
- **Context**: Knows which tab user is currently on
- **Persistence**: Available from all screens
- **Dismissal**: Swipe down or tap outside

---

## Screen Wireframes

### Legend
```
[icon] = icon in bottom tab bar
===>   = primary action
*      = list item
()     = button/action
[ ]    = checkbox
```

---

## 1️⃣ Bottom Tab Navigation

```
──────────────────────────────────────
│       Header (optional)            │
├────────────────────────────────────┤
│ Content area                       │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│ 🗓   🍽   🛒   ⚙️                    │
│Planner Recipes Grocery Settings    │
──────────────────────────────────────
```

**Frame Specs**:
- **Bottom nav height**: 56px
- **Background**: `#FFFFFF`
- **Shadow**: 2px drop-shadow
- **Icon + label**: Vertical stack, centered
- **Label font**: 12px

**Behavior**:
- Persistent across all screens
- Tap switches content frame above
- Active tab highlighted with primary color

---

## 2️⃣ Planner – Week View

```
──────────────────────────────────────
│ Week: Dec 15 – Dec 21             │
│ [<]   Today   [>]                 │
├────────────────────────────────────┤
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├────────────────────────────────────┤
│ Dinner: Chicken Stir Fry           │
│ Tags: chicken, dairy-free          │
│ (View Recipe) (Add Meal)          │
├────────────────────────────────────┤
│ Dinner: Beef Tacos                 │
│ Tags: beef, gluten-free            │
│ (View Recipe) (Add Meal)          │
├────────────────────────────────────┤
│ + Add Meal                         │
│ ===> Ask AI to plan week           │
──────────────────────────────────────
```

**Frame Specs**:
- **Width**: 375px (mobile viewport)
- **Height**: Auto (scrollable)
- **Background**: `#FFFFFF`
- **Header font**: 16px bold
- **Week row font**: 12px
- **Meal cards**:
  - Background: `#F9F9F9`
  - Border radius: 8px
  - Padding: 8px
  - Title: 14px bold
  - Tags: 12px, comma-separated
- **Action buttons**:
  - "Add Meal": Background `#FFA500` (accent)
  - "Ask AI": Background `#4A90E2` (primary)

**Behavior**:
- Tapping a meal card opens **Recipe Detail**
- AI button triggers AI-suggested week plans
- Week navigation buttons shift calendar view
- Scrollable if more than 6-7 meals visible

---

## 3️⃣ Recipes List

```
──────────────────────────────────────
│ Search: [                    ]    │
├────────────────────────────────────┤
│ * Chicken Curry       ★★★★☆        │
│   Tags: chicken, dairy-free        │
├────────────────────────────────────┤
│ * Beef Stroganoff     ★★★☆☆        │
│   Tags: beef, low-carb              │
├────────────────────────────────────┤
```

**Frame Specs**:
- **Search bar**:
  - Background: `#F0F0F0`
  - Border radius: 8px
  - Padding: 8px
  - Font: 14px
- **Recipe cards**:
  - Background: `#FFFFFF`
  - Shadow: 2px drop-shadow
  - Padding: 8px
  - Title: 14px bold
  - Rating: Orange stars (`#FFA500`)
  - Tags: 12px

**Behavior**:
- Tap card to open Recipe Detail
- Search filters list in real-time
- Scrollable list

---

## 3️⃣ Recipe Detail

```
──────────────────────────────────────
│ Chicken Curry        ★★★★☆         │
│ Tags: chicken, dairy-free           │
│ Notes: Family favorite               │
├────────────────────────────────────┤
│ Ingredients:                        │
│ [ ] Chicken 1 lb                      │
│ [ ] Rice 1 cup                        │
│ [ ] Coconut milk 1 can                │
├────────────────────────────────────┤
│ Instructions (collapsed by default) │
├────────────────────────────────────┤
│ (Add to Planner)                     │
│ (Push ingredients → Grocery List)    │
│ (Ask AI about this recipe)           │
──────────────────────────────────────
```

**Frame Specs**:
- **Header**:
  - Recipe name: 16px bold
  - Tags: Horizontal chips, 12px
  - Notes: 12px italic
- **Ingredients**:
  - Checkbox + text: 12px
  - Quantity + unit: Bold
- **Instructions**:
  - Collapsed by default
  - Tap to expand
- **Action buttons**:
  - "Add to Planner": Background `#4A90E2`
  - "Push ingredients": Background `#FFA500`
  - "Ask AI": Background `#4A90E2`

**Behavior**:
- Ingredients checklist for shopping reference
- "Push ingredients" opens modal (see flow below)
- "Add to Planner" opens date picker
- "Ask AI" opens chat panel with recipe context

---

## 4️⃣ Grocery List Screen

```
──────────────────────────────────────
│ Grocery List: Target Weekly        │
│ [Select list ▼]                    │
├────────────────────────────────────┤
│ * Rice 3.25 cup   [ ]               │
│ * Chicken 1 lb    [✓]               │
│ * Coconut milk 1 can [ ]            │
├────────────────────────────────────┤
│ (Create New List)                   │
│ (Generate from Planner)             │
│ (Split List)                        │
──────────────────────────────────────
```

**Frame Specs**:
- **Header**:
  - List name: 16px bold
  - Dropdown selector: 12px
- **Grocery items**:
  - Checkbox + text: 12px
  - Quantity: Numeric + unit (bold)
  - Checked items: Greyed out (`#999999`)
- **Action buttons**:
  - Background: `#4A90E2`
  - Border radius: 8px
  - Padding: 8px

**Behavior**:
- Checkbox toggles "checked" state
- Checked items visually muted but not hidden
- Quantity aggregation handled automatically
- User selects which ingredients to push before writing

---

## 5️⃣ AI Chat Panel (Slide-Up / Persistent)

```
──────────────────────────────────────
│ AI Assistant                       │
├────────────────────────────────────┤
│ [Conversation scrolls here]        │
│                                    │
│ User: Find me a dairy-free chicken │
│ AI : Sure! I found 3 recipes ...   │
├────────────────────────────────────┤
│ [📷] [🎤] [Type message...] (Send) │
──────────────────────────────────────
```

**Frame Specs**:
- **Height**: 50% viewport (adjustable)
- **Background**: `#FFFFFF`
- **Border radius**: 16px (top corners only)
- **Header**: "AI Assistant", 14px bold
- **Message bubbles**:
  - User: Left-aligned, background `#F0F0F0`, rounded
  - AI: Right-aligned, background `#4A90E2`, white text, rounded
  - Font: 12px
- **Input bar**:
  - Height: 48px
  - Icons: Camera, Mic (24px)
  - Text input: Placeholder "Type message..."
  - Send button: Background `#4A90E2`

**Behavior**:
- Slide-up drawer overlays main content
- Voice (🎤) → Speech-to-text
- Photo (📷) → OCR to text
- Send button submits message
- Context-aware: Knows which tab user is on
- Swipe down or tap outside to dismiss

---

## 6️⃣ Ingredient Push Flow Modal

```
──────────────────────────────────────
│ Push ingredients to grocery list    │
├────────────────────────────────────┤
│ Select ingredients:                 │
│ [✓] Chicken 1 lb                    │
│ [ ] Rice 1 cup                      │
│ [✓] Coconut milk 1 can              │
├────────────────────────────────────┤
│ Target list: [Target Weekly ▼]      │
├────────────────────────────────────┤
│ (Confirm & Add)   (Cancel)          │
──────────────────────────────────────
```

**Frame Specs**:
- **Modal**:
  - Background: `#FFFFFF`
  - Border radius: 16px
  - Shadow: Heavy drop-shadow (overlay)
  - Width: 90% viewport (max 400px)
- **Header**: 14px bold
- **Ingredient selection**:
  - Scrollable list
  - Checkbox + text: 12px
  - All items checked by default
- **Target list selector**:
  - Dropdown: 12px
- **Action buttons**:
  - "Confirm & Add": Background `#4A90E2`
  - "Cancel": Background `#F0F0F0`

**Behavior**:
- Only selected items pushed to grocery list
- Quantities merged if already present in target list
- User can uncheck pantry items before confirming
- Confirm button triggers deterministic SKILL execution
- Cancel dismisses modal without changes

---

## Responsive Breakpoints

### Mobile (Default)
- **Width**: 375px – 667px (iPhone SE to iPhone 14 Pro Max)
- **Bottom tabs**: Always visible
- **AI chat**: Slide-up drawer (50% height)
- **Card grid**: Single column

### Tablet (Optional)
- **Width**: 768px+
- **Bottom tabs**: Convert to side rail (optional)
- **AI chat**: Side panel (30% width)
- **Card grid**: 2-3 columns
- **Note**: Tablet layout is Phase 3+ enhancement

---

## Component Library

### Recommended Framework
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built accessible React components
- **Lucide React**: Icon library

### Key Components
1. **TabBar**: Bottom navigation with icons + labels
2. **Card**: Rounded, shadowed container for content
3. **Button**: Primary, secondary, accent variants
4. **Input**: Text input with icon support
5. **Modal**: Centered or slide-up overlay
6. **Checkbox**: Styled checkbox with label
7. **Dropdown**: Select menu for lists
8. **ChatBubble**: User/AI message styling

---

## Accessibility

### WCAG Compliance
- **Target**: WCAG 2.1 AA (Phase 2+)
- **Color contrast**: Minimum 4.5:1 for text
- **Focus indicators**: Visible keyboard focus states
- **Touch targets**: Minimum 44x44px for mobile
- **Screen readers**: Semantic HTML, ARIA labels

### Font Size
- **Base**: 14px (adjustable via browser settings)
- **Minimum**: 12px (only for metadata)
- **Scalability**: Supports text zoom up to 200%

---

## Implementation Notes

### Phase 1 Priorities
1. Bottom tab navigation
2. Planner week view
3. Recipe list + detail
4. Grocery list
5. AI chat panel (basic)

### Phase 2+ Enhancements
1. Tablet responsive layout
2. Advanced AI chat features (voice, camera)
3. Dark mode
4. Accessibility audit
5. Animation/transitions

### Design Consistency
- All screens designed for **375x667 mobile viewport** (default)
- Flat, modern, mostly white aesthetic
- Consistent padding, border-radius, shadows
- Voice/OCR inputs require human confirmation
- Quantity math deterministic in Tool layer
- All screens can scroll vertically as needed

---

## Version History
- **v1.0** (2025-12-22): Consolidated from `07_ui_spec.md`, `07_ui_wireframes.md`, `07_ui_figma_lite.md`
