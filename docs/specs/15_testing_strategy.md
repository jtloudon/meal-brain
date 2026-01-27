# 15 – Testing Strategy

**Comprehensive testing strategy for ensuring system reliability and correctness.**

This document defines the testing pyramid, coverage targets, frameworks, and best practices.

---

## Testing Philosophy

### Core Principles
1. **Tests define behavior**: Tests are executable specifications
2. **Test-driven when practical**: Write tests before or alongside code
3. **Fast feedback loops**: Tests should run quickly (<10s for unit, <2min for all)
4. **High confidence, not 100% coverage**: Focus on critical paths
5. **Deterministic tests**: No flaky tests, no random failures

### Testing Priorities
- **Critical business logic** (quantity math, aggregation): 100% coverage
- **Tools (Agent SDK skills)**: 95% coverage (all happy + error paths)
- **UI components**: 70% coverage (critical flows only)
- **Integration points**: All major paths covered

---

## Testing Pyramid

```
         /\
        /  \  E2E Tests (5%)
       /────\  ~10 tests
      / Inte-\ Integration Tests (15%)
     / gration\ ~30 tests
    /──────────\
   /   Unit     \ Unit Tests (80%)
  /    Tests     \ ~150+ tests
 /────────────────\
```

### Layer Breakdown

**Unit Tests** (80% of tests, <100ms each):
- Pure functions
- Business logic
- Validation rules
- Math operations
- No external dependencies (mocked)

**Integration Tests** (15% of tests, <1s each):
- Tools with real test database
- Supabase RPC calls
- API route handlers
- Database queries

**E2E Tests** (5% of tests, <10s each):
- Critical user flows
- Browser automation
- Full system integration
- Real database + real UI

---

## Unit Testing

### What to Unit Test

**1. Business Logic (Highest Priority)**
- Ingredient aggregation algorithm
- Quantity math (addition, comparison)
- Unit matching rules
- Date calculations
- Input validation

**2. Pure Functions**
- Data transformations
- Formatting helpers
- Parsing logic

**3. Zod Schemas**
- Tool input validation
- Ensure schemas catch invalid data

### Framework: Vitest

**Why Vitest**:
- Fast (ES modules, native TypeScript)
- Compatible with Jest API (easy migration)
- Built-in code coverage
- Watch mode for dev

**Installation**:
```bash
npm install -D vitest @vitest/ui
```

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/types.ts', '**/index.ts'],
    },
  },
});
```

### Example: Quantity Math Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { addQuantities, normalizeQuantity } from './quantity-math';

describe('Quantity Math', () => {
  describe('addQuantities', () => {
    it('adds quantities with same unit', () => {
      const result = addQuantities(
        { value: 1.5, unit: 'cup' },
        { value: 0.5, unit: 'cup' }
      );
      expect(result).toEqual({ value: 2.0, unit: 'cup' });
    });

    it('throws error when units differ', () => {
      expect(() =>
        addQuantities(
          { value: 1, unit: 'cup' },
          { value: 500, unit: 'ml' }
        )
      ).toThrow('Cannot add quantities with different units');
    });

    it('handles decimal precision correctly', () => {
      const result = addQuantities(
        { value: 0.1, unit: 'cup' },
        { value: 0.2, unit: 'cup' }
      );
      expect(result.value).toBeCloseTo(0.3, 2);
    });
  });
});
```

### Coverage Target: 90% for business logic

---

## Integration Testing

### What to Integration Test

**1. Tools (Agent SDK Skills)**
- All read tools (`recipe.list`, `planner.list_meals`, etc.)
- All write tools (`recipe.create`, `planner.add_meal`, `grocery.push_ingredients`)
- Error scenarios (not found, validation errors, permission denied)

**2. Database Operations**
- CRUD operations
- RLS policy enforcement
- Cascade deletes
- Transaction rollbacks

**3. API Routes**
- Next.js API routes
- Authentication middleware
- Error handling

### Framework: Vitest + Supabase Test Client

**Setup**: Test database with fresh schema for each test suite

**Configuration** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup-integration.ts'],
    poolOptions: {
      threads: {
        singleThread: true, // Supabase local can't handle parallel tests
      },
    },
  },
});
```

**Setup File** (`tests/setup-integration.ts`):
```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Create test client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

beforeAll(async () => {
  // Reset database to clean state
  execSync('supabase db reset --local');
});

beforeEach(async () => {
  // Truncate tables (faster than full reset)
  await supabase.from('grocery_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('planner_meals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // ...truncate other tables
});

afterAll(async () => {
  await supabase.removeAllChannels();
});
```

### Example: Tool Integration Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../setup-integration';
import { createRecipeTool } from '@/backend/tools/recipe';

describe('recipe.create Tool', () => {
  let householdId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test household and user
    const { data: household } = await supabase
      .from('households')
      .insert({ name: 'Test Household' })
      .select()
      .single();
    householdId = household.id;

    const { data: user } = await supabase
      .from('users')
      .insert({ household_id: householdId, email: 'test@example.com' })
      .select()
      .single();
    userId = user.id;
  });

  it('creates recipe with valid input', async () => {
    const result = await createRecipeTool.execute({
      title: 'Chicken Curry',
      ingredients: [
        { name: 'chicken', quantity: 1, unit: 'lb' },
        { name: 'curry powder', quantity: 2, unit: 'tbsp' },
      ],
      instructions: 'Cook chicken with curry powder.',
      tags: ['dinner', 'chicken'],
    }, { userId, householdId });

    expect(result.success).toBe(true);
    expect(result.data.recipe_id).toBeDefined();

    // Verify in database
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', result.data.recipe_id)
      .single();

    expect(recipe.title).toBe('Chicken Curry');
    expect(recipe.tags).toEqual(['dinner', 'chicken']);
  });

  it('rejects recipe without title', async () => {
    const result = await createRecipeTool.execute({
      title: '',
      ingredients: [],
    }, { userId, householdId });

    expect(result.success).toBe(false);
    expect(result.error.type).toBe('VALIDATION_ERROR');
    expect(result.error.field).toBe('title');
  });

  it('enforces RLS policy (household isolation)', async () => {
    // Create recipe in different household
    const { data: otherHousehold } = await supabase
      .from('households')
      .insert({ name: 'Other Household' })
      .select()
      .single();

    // Try to access from original user
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('household_id', otherHousehold.id);

    expect(data).toEqual([]); // RLS blocks access
  });
});
```

### Coverage Target: 95% for all Tools

---

## End-to-End Testing

### What to E2E Test

**Critical User Flows**:
1. **Authentication**: Magic-link email → Login → Access app
2. **Recipe Management**: Create recipe → Edit → Delete
3. **Meal Planning**: Add meal to planner → View week → Remove meal
4. **Grocery Generation**: Plan meals → Push to grocery → Review → Confirm

**NOT E2E Tested** (too slow, covered by integration):
- Every CRUD operation
- Error scenarios (mocked at integration level)
- Edge cases

### Framework: Playwright

**Why Playwright**:
- Cross-browser (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Network mocking
- Screenshots + video recording
- Parallel execution

**Installation**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 2,
  workers: 4,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example: E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Meal Planning Flow', () => {
  test('user can plan a week and generate grocery list', async ({ page }) => {
    // 1. Login (mock magic-link for speed)
    await page.goto('/auth/callback?token=mock-token');
    await expect(page).toHaveURL('/planner');

    // 2. Create recipe
    await page.click('text=Recipes');
    await page.click('text=Add Recipe');
    await page.fill('[name="title"]', 'Chicken Tacos');
    await page.click('text=Add Ingredient');
    await page.fill('[name="ingredients[0].name"]', 'chicken');
    await page.fill('[name="ingredients[0].quantity"]', '1');
    await page.selectOption('[name="ingredients[0].unit"]', 'lb');
    await page.click('button:has-text("Save Recipe")');

    // 3. Add meal to planner
    await page.click('text=Planner');
    await page.click('text=Add Meal');
    await page.click('text=Chicken Tacos');
    await page.selectOption('[name="meal_type"]', 'dinner');
    await page.click('button:has-text("Add to Planner")');

    // 4. Verify meal appears on calendar
    await expect(page.locator('text=Chicken Tacos')).toBeVisible();

    // 5. Generate grocery list
    await page.click('text=Groceries');
    await page.click('text=Generate from Planner');
    await page.click('input[value="chicken"]'); // Check ingredient
    await page.click('button:has-text("Confirm & Add")');

    // 6. Verify grocery item added
    await expect(page.locator('text=chicken')).toBeVisible();
    await expect(page.locator('text=1 lb')).toBeVisible();
  });
});
```

### Coverage Target: 10-15 critical flows

---

## AI Behavior Testing

### What to Test

**1. Tool Calling Accuracy**
- AI calls correct Tool for user intent
- AI provides correct parameters
- AI handles Tool errors gracefully

**2. Reasoning Quality**
- AI explains decisions clearly
- AI respects constraints (dietary, budget)
- AI asks before mutations

**3. Governance Compliance**
- AI never mutates without approval
- AI proposes creative ideas (doesn't auto-apply)
- AI handles uncertainty transparently

### Framework: Custom Test Harness

**Approach**: Deterministic prompts → Expected tool calls

**Example Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { testAIBehavior } from './ai-test-harness';

describe('AI Tool Calling', () => {
  it('calls recipe.list when user asks for recipes', async () => {
    const result = await testAIBehavior({
      userMessage: 'Show me all chicken recipes',
      expectedTools: ['recipe.list'],
      expectedParams: {
        filters: { tags: ['chicken'] },
      },
    });

    expect(result.toolsCalled).toContain('recipe.list');
    expect(result.params.filters.tags).toContain('chicken');
  });

  it('asks before calling planner.add_meal', async () => {
    const result = await testAIBehavior({
      userMessage: 'Add chicken curry to tomorrow's dinner',
      expectedApprovalRequired: true,
      expectedTools: ['planner.add_meal'],
    });

    expect(result.askedForApproval).toBe(true);
    expect(result.approvalMessage).toContain('Add chicken curry');
  });

  it('respects dietary constraints', async () => {
    const result = await testAIBehavior({
      userMessage: 'Suggest a meal for tonight',
      context: { dietaryConstraints: ['dairy-free'] },
      expectedBehavior: 'Suggests only dairy-free recipes',
    });

    result.suggestedRecipes.forEach(recipe => {
      expect(recipe.tags).not.toContain('dairy');
    });
  });
});
```

### Coverage Target: 20-30 AI behavior tests

---

## Coverage Targets Summary

| Layer | Target | Rationale |
|-------|--------|-----------|
| **Business Logic** | 100% | Critical for correctness |
| **Tools (Agent SDK)** | 95% | All paths must work |
| **Database queries** | 90% | Core data operations |
| **UI components** | 70% | Focus on critical flows |
| **E2E flows** | Top 10 flows | User-facing reliability |
| **AI behavior** | 20-30 tests | Governance compliance |

**Overall target**: >85% code coverage across all layers

---

## Test Organization

### Directory Structure
```
project/
├── backend/
│   ├── tools/
│   │   ├── recipe.ts
│   │   └── recipe.test.ts  # Integration tests next to code
│   ├── lib/
│   │   ├── quantity-math.ts
│   │   └── quantity-math.test.ts  # Unit tests next to code
├── tests/
│   ├── unit/  # Additional unit tests
│   ├── integration/
│   │   ├── setup.ts
│   │   └── tools/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── meal-planning.spec.ts
│   │   └── groceries.spec.ts
│   └── ai-behavior/
│       ├── tool-calling.test.ts
│       └── governance.test.ts
```

---

## Running Tests

### Commands
```bash
# Unit tests (fast, watch mode for dev)
npm run test:unit
npm run test:unit:watch

# Integration tests (requires local Supabase)
npm run test:integration

# E2E tests (full system)
npm run test:e2e
npm run test:e2e:ui  # Playwright UI mode

# All tests
npm run test

# Coverage report
npm run test:coverage
```

### CI Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: supabase start  # Start local Supabase
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3  # Upload coverage
```

---

## Testing Best Practices

### DOs
- ✅ Write tests before or alongside code (TDD when practical)
- ✅ Use descriptive test names (`it('adds quantities with same unit')`)
- ✅ Test both happy path and error cases
- ✅ Mock external services (Anthropic API, email)
- ✅ Keep tests fast (<1s for unit, <10s for E2E)
- ✅ Use test fixtures for common data
- ✅ Clean up test data after each test

### DON'Ts
- ❌ Don't test implementation details (test behavior, not internals)
- ❌ Don't write flaky tests (random data, timing issues)
- ❌ Don't skip cleanup (causes test pollution)
- ❌ Don't commit failing tests (fix or skip them)
- ❌ Don't mock everything (integration tests use real DB)
- ❌ Don't test third-party libraries (trust them)

---

## Version History
- **v1.0** (2025-12-22): Initial testing strategy specification
