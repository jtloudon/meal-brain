# 02 – Tools Specification (Deterministic Execution Layer)

## Purpose

**Tools are the only components allowed to mutate state.**

They are:
- **Deterministic**: Same inputs always produce same outputs
- **Idempotent**: Safe to retry without side effects
- **Fully validated**: Input schemas enforce type safety
- **Never hallucinated**: Implemented as code, not LLM output

**AI Role**: The LLM may *suggest* actions and reason about plans.
**Tool Role**: Tools *execute* actions deterministically.

---

## Implementation Approach

### Agent SDK Skill Pattern

All Tools are implemented as **Agent SDK skills** with:
1. **Validated input schemas** (using Zod or similar)
2. **Type-safe outputs** (TypeScript interfaces)
3. **Proper error handling** (structured error responses)
4. **Comprehensive documentation** (for LLM tool-calling)

This provides hallucination protection through schema validation while maintaining a simple architecture:

```
AI Agent → Tools (Agent SDK skills) → Supabase Database
```

There is no separate "Skills interface layer" - the Tools themselves are well-defined Agent SDK skills.

---

## Runtime Environment

### Infrastructure
- **Platform**: Supabase Edge Functions (Deno runtime)
- **Language**: TypeScript
- **Database**: Supabase Postgres (via Supabase client)
- **Validation**: Zod schemas for all inputs
- **Auth**: Row-level security (RLS) policies enforce household boundaries

### Tool Execution Model
1. LLM calls tool via function calling (JSON schema)
2. Agent SDK validates input against Zod schema
3. Tool function executes deterministic logic
4. Tool returns structured result or error
5. Agent SDK formats response for LLM

### Tool Responsibilities
Tools must:
- Execute exactly what they are told (no "fixing" user intent)
- Never call the LLM internally
- Return structured results (success/error)
- Provide clear error messages for validation failures
- Respect household boundaries via RLS

---

## Tool Categories

### Read-Only Tools
Safe for unrestricted AI use. No confirmation required.

#### Recipe Tools
- **`recipe.list`** - List recipes with optional filters (tags, rating, search query)
- **`recipe.get`** - Get full recipe details by ID (ingredients, instructions, metadata)

#### Planner Tools
- **`planner.list_meals`** - List planned meals for a date range
- **`planner.get_meal`** - Get meal details for specific date

#### Grocery Tools
- **`grocery.list_lists`** - List all grocery lists for household
- **`grocery.get_list`** - Get grocery list items by list ID

---

### Write Tools (Confirmation Required)

#### `recipe.create`
Creates a recipe from validated input.

**Inputs**:
- `title` (string, required)
- `ingredients` (array, required) - Structured ingredient objects
- `instructions` (string, optional)
- `tags` (array of strings, optional)
- `rating` (number 1-5, optional)
- `notes` (string, optional)

**Validations**:
- Ingredients normalized to structured format
- Units required for all quantities
- No free-text quantities (must be numeric + unit)
- Ingredient names validated against known ingredient database

**Returns**:
- `recipe_id` (created recipe ID)
- `created_at` (timestamp)

---

#### `recipe.update`
Updates an existing recipe.

**Inputs**:
- `recipe_id` (required)
- Same fields as `recipe.create` (all optional)

**Validations**:
- Recipe must exist and belong to user's household
- Same validation rules as `recipe.create`

**Returns**:
- Updated recipe object
- `updated_at` timestamp

---

#### `planner.add_meal`
Adds a recipe to a calendar date.

**Inputs**:
- `recipe_id` (required)
- `date` (ISO 8601 date string, required)
- `meal_type` (enum: `breakfast` | `lunch` | `dinner`, required)

**Validations**:
- Recipe must exist and belong to household
- Date must be valid ISO 8601 format
- Meal type must be one of three allowed values

**Returns**:
- `planner_meal_id` (created meal ID)
- Confirmation message

---

#### `planner.remove_meal`
Removes a planned meal from the calendar.

**Inputs**:
- `planner_meal_id` (required)

**Validations**:
- Meal must exist and belong to user's household

**Returns**:
- Success confirmation
- Deleted meal details (for undo capability)

---

#### `grocery.create_list`
Creates a new grocery list.

**Inputs**:
- `name` (string, required)

**Validations**:
- Name must be unique within household

**Returns**:
- `grocery_list_id`
- Creation timestamp

---

#### `grocery.push_ingredients`
Pushes ingredients from one or more recipes into a grocery list.

**Critical Tool**: This implements deterministic ingredient aggregation.

**Inputs**:
- `grocery_list_id` (required)
- `ingredients` (array, required) - Structured ingredient objects with:
  - `ingredient_id`
  - `quantity` (numeric)
  - `unit` (string)
  - `prep_state` (optional: "chopped", "diced", etc.)
  - `source_recipe_id` (for traceability)

**Validations**:
- All ingredients must have numeric quantities
- Units required (no free-text)
- Grocery list must exist and belong to household

**Aggregation Rules** (see detailed section below)

**Returns**:
- List of added/merged items
- Summary of aggregations performed
- Total item count in list

---

#### `grocery.add_item`
Manually adds a single item to a grocery list.

**Inputs**:
- `grocery_list_id` (required)
- `ingredient_id` (optional) - Links to known ingredient
- `name` (required if no `ingredient_id`)
- `quantity` (numeric, required)
- `unit` (string, required)

**Validations**:
- Same as `grocery.push_ingredients`

**Returns**:
- Created item ID
- Confirmation

---

#### `grocery.check_item` / `grocery.uncheck_item`
Toggles checked state on grocery items.

**Inputs**:
- `grocery_item_id` (required)

**Returns**:
- Updated item state

---

### Media Tools (Phase 3+)

#### `media.speech_to_text`
Converts voice input to text via Web Speech API or external service.

**Inputs**:
- `audio` (blob or URL)

**Returns**:
- `transcript` (string)
- `confidence` (0-1)

#### `media.ocr_image`
Extracts text from recipe images via OCR.

**Inputs**:
- `image` (blob or URL)

**Returns**:
- `extracted_text` (string)
- Structured recipe data (if parseable)

---

## Ingredient Aggregation Rules (Critical)

### Merging Logic
Ingredients are grouped by:
1. **`ingredient_id`** (links to known ingredient database)
2. **`unit`** (must match exactly)
3. **`prep_state`** (optional - "chopped" ≠ "whole")

### Merge Algorithm
```
For each incoming ingredient:
  1. Query existing grocery list items
  2. Find match where:
     - ingredient_id matches AND
     - unit matches AND
     - prep_state matches (or both null)
  3. If exact match found:
     - quantity_new = quantity_existing + quantity_incoming
     - Update existing item
  4. Else:
     - Create new item
```

### Example 1: Successful Merge
```
Existing: rice, 1 cup, null prep_state
Incoming: rice, 0.5 cup, null prep_state
         +rice, 1.75 cup, null prep_state
───────────────────────────────────────
Result:   rice, 3.25 cup, null prep_state
```

### Example 2: Unit Mismatch (No Merge)
```
Existing: chicken, 1 lb
Incoming: chicken, 500 g
───────────────────────────────────────
Result:   chicken, 1 lb  (existing)
          chicken, 500 g (new item)
```

**Reasoning**: Tool does NOT auto-convert units. User must manually resolve.

### Example 3: Prep State Mismatch (No Merge)
```
Existing: onion, 1 whole
Incoming: onion, 1 chopped
───────────────────────────────────────
Result:   onion, 1 whole   (existing)
          onion, 1 chopped (new item)
```

**Reasoning**: Different prep states = different shopping needs.

---

## Unit Handling

### Allowed Units
Tools accept a predefined list of units:
- **Volume**: cup, tbsp, tsp, ml, l, fl oz
- **Weight**: lb, oz, g, kg
- **Count**: whole, piece, can, package

### Unit Conversion
**Phase 1**: No automatic conversion.
- If units mismatch → create separate items
- User resolves manually

**Phase 2+**: Optional conversion with user approval.
- Tool proposes conversion (e.g., "1 lb ≈ 454g")
- User confirms before merge

---

## Safety Rules

### Transaction Integrity
- **No partial writes**: All-or-nothing operations
- **No background writes**: User must trigger explicitly
- **Atomic operations**: Use database transactions where needed

### Reversibility
- Every write returns a summary of changes
- Every write is undoable:
  - Soft delete (mark `deleted_at` instead of hard delete)
  - Revision tracking (optional Phase 2+ feature)

### Error Handling
- Validation failures return structured errors:
  - `error_type`: "VALIDATION_ERROR" | "NOT_FOUND" | "PERMISSION_DENIED"
  - `message`: Human-readable error
  - `field`: Which input field failed (if applicable)
- No silent failures
- No LLM-generated error messages (errors are deterministic)

---

## Non-Goals

### What Tools Do NOT Do
- ❌ **No AI arithmetic**: Quantity math is deterministic code only
- ❌ **No fuzzy matching**: Ingredient names match exactly or not at all
- ❌ **No auto substitutions**: Tools never replace ingredients without asking
- ❌ **No intelligent defaults**: If input is missing, fail validation (don't guess)
- ❌ **No LLM calls**: Tools never call the LLM internally

---

## Tool Schema Specification

### Input Schema Format (Zod)
```typescript
import { z } from 'zod';

export const AddMealSchema = z.object({
  recipe_id: z.string().uuid(),
  date: z.string().datetime(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
});

export type AddMealInput = z.infer<typeof AddMealSchema>;
```

### Agent SDK Tool Definition
```typescript
import { defineTool } from '@anthropics/agent-sdk';

export const addMealTool = defineTool({
  name: 'planner.add_meal',
  description: 'Adds a recipe to a specific date and meal type in the calendar',
  inputSchema: AddMealSchema,
  execute: async (input: AddMealInput) => {
    // Validation happens automatically via Zod schema
    // Execute deterministic logic here
    const result = await supabase
      .from('planner_meals')
      .insert({
        recipe_id: input.recipe_id,
        date: input.date,
        meal_type: input.meal_type,
      })
      .select()
      .single();

    return {
      planner_meal_id: result.data.id,
      message: `Added meal to ${input.date} (${input.meal_type})`,
    };
  },
});
```

---

## Testing Strategy

### Unit Tests
Test pure validation and aggregation logic:
- Ingredient merging algorithm
- Quantity math
- Unit mismatch detection
- Input schema validation

### Integration Tests
Test tools with real Supabase test database:
- Tool execution end-to-end
- RLS policy enforcement
- Error handling
- Transaction rollback on failure

### Tool Contract Tests
Verify LLM can call tools correctly:
- Prompt → expected tool call
- Tool response → expected LLM interpretation
- Error responses handled gracefully

---

## Version History
- **v1.0** (2025-12-22): Consolidated from `02_skills_spec.md` and `03_tools_spec.md`. Updated to reflect Agent SDK skill pattern.
