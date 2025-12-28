# Theme Customization Guide

**Quick reference for changing the app's color scheme**

---

## How to Change Colors

All theme colors are defined in `app/globals.css` as CSS variables.

**To change the app's colors:**
1. Open `app/globals.css`
2. Edit the `:root` variables
3. Reload the browser (no rebuild needed for CSS changes)

---

## Color Variables

### Primary Colors

```css
--primary: #4A90E2;        /* Blue - active tab states, primary buttons */
--primary-hover: #3A7BC8;  /* Darker blue for hover states */
```

**Usage in Tailwind**: `bg-primary`, `text-primary`, `border-primary`, `bg-primary-hover`

**Where it appears**:
- Active bottom nav tab
- Primary action buttons (Plus buttons, CTAs)
- Links and interactive elements
- Focus rings

---

### Accent Colors

```css
--accent: #FFA500;          /* Orange - call-to-action, ratings */
--accent-hover: #FF8C00;    /* Darker orange for hover */
```

**Usage in Tailwind**: `bg-accent`, `text-accent`, `border-accent`, `bg-accent-hover`

**Where it appears**:
- Star ratings (filled stars)
- Secondary CTAs
- Highlights and badges

---

### Semantic Colors

```css
--success: #10B981;         /* Green - success states */
--error: #EF4444;           /* Red - errors, destructive actions */
--warning: #F59E0B;         /* Amber - warnings */
--info: #3B82F6;            /* Blue - informational */
```

**Usage in Tailwind**: `bg-success`, `text-error`, `border-warning`, etc.

**Where it appears**:
- Success messages (green)
- Error states and delete buttons (red)
- Warning alerts (amber)
- Info notifications (blue)

---

### Neutral Colors

```css
--secondary: #333333;       /* Dark gray - text */
--surface: #F9F9F9;         /* Light gray - card backgrounds */
--border: #F0F0F0;          /* Very light gray - dividers */
```

**Usage in Tailwind**: `bg-surface`, `border-border`, `text-secondary`

**Where it appears**:
- Card backgrounds (`--surface`)
- Text color (`--secondary`)
- Border colors (`--border`)

---

## Example: Changing to a Purple Theme

**Before** (current blue):
```css
--primary: #4A90E2;
--primary-hover: #3A7BC8;
```

**After** (purple):
```css
--primary: #8B5CF6;        /* Purple */
--primary-hover: #7C3AED;  /* Darker purple */
```

Save the file → Reload browser → Entire app now uses purple!

---

## Testing Color Changes

### Option 1: Live Edit in Browser DevTools
1. Open Chrome DevTools (Cmd+Option+I)
2. Go to Elements tab
3. Find `:root` in styles
4. Edit CSS variables live to preview changes
5. Once happy, copy values to `app/globals.css`

### Option 2: Edit File Directly
1. Edit `app/globals.css`
2. Save file
3. Browser auto-reloads (if using `npm run dev`)
4. Check results across all screens

---

## Color Accessibility

When changing colors, ensure:
- **Contrast ratio**: Minimum 4.5:1 for text (WCAG AA)
- **Test with**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Primary vs background**: Should have strong contrast
- **Accent vs background**: Should stand out but not be harsh

### Tools for Choosing Colors:
- [Coolors.co](https://coolors.co/) - Generate color palettes
- [Adobe Color](https://color.adobe.com/) - Color wheel
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors) - Pre-designed colors

---

## Where Colors Are NOT Used (Still Hardcoded)

Some components still use Tailwind's default colors (e.g., `blue-600`, `gray-200`). To fully theme the app, you'll need to:

1. **Search and replace**:
   - Find: `text-blue-600` → Replace with: `text-primary`
   - Find: `bg-blue-50` → Replace with: `bg-primary/10`
   - Find: `text-gray-600` → Replace with: `text-gray-600` (Tailwind grays are fine)

2. **Check these files**:
   - `components/BottomNav.tsx` - Tab active states
   - `components/AuthenticatedLayout.tsx` - Buttons and header
   - `app/recipes/page.tsx` - Recipe cards, buttons
   - `app/planner/page.tsx` - Week view, active day
   - `app/groceries/page.tsx` - List items, buttons

---

## Future: Dark Mode Support

To add dark mode later:

```css
:root {
  --primary: #4A90E2;
  /* light mode colors */
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: #60A5FA;        /* Lighter blue for dark mode */
    --background: #111827;     /* Dark background */
    --foreground: #F3F4F6;     /* Light text */
    /* ... */
  }
}
```

Or use a class-based approach:
```css
.dark {
  --primary: #60A5FA;
  /* dark theme colors */
}
```

---

## Summary

- **All colors**: `app/globals.css` `:root` section
- **Tailwind classes**: `bg-primary`, `text-accent`, etc.
- **Live preview**: Edit CSS variables in Chrome DevTools
- **Accessibility**: Check contrast ratios before committing changes

**To change theme**: Edit one file (`app/globals.css`), reload browser. Done!
