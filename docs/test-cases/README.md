# Test Cases - Progress Tracker

**Status Legend**:
- ⬜ Not started (no test code written)
- 🟨 In progress (test written, failing)
- ✅ Complete (test passing)

---

## Unit Tests (Pure Functions)

| Module | Test File | Status | Test Count | Coverage |
|--------|-----------|--------|------------|----------|
| Quantity Math | [unit/quantity-math.md](unit/quantity-math.md) | ⬜ | 0/5 | 0% |
| Ingredient Aggregation | [unit/ingredient-aggregation.md](unit/ingredient-aggregation.md) | ⬜ | 0/6 | 0% |
| Unit Validation | [unit/unit-validation.md](unit/unit-validation.md) | ⬜ | 0/4 | 0% |

**Total Unit Tests**: 0/15 complete

---

## Tool Tests (Agent SDK Skills)

| Tool | Test File | Status | Test Count | Coverage |
|------|-----------|--------|------------|----------|
| recipe.create | [tools/recipe-create.md](tools/recipe-create.md) | ⬜ | 0/4 | 0% |
| recipe.list | [tools/recipe-list.md](tools/recipe-list.md) | ⬜ | 0/3 | 0% |
| recipe.update | [tools/recipe-update.md](tools/recipe-update.md) | ⬜ | 0/3 | 0% |
| planner.add_meal | [tools/planner-add-meal.md](tools/planner-add-meal.md) | ⬜ | 0/5 | 0% |
| planner.remove_meal | [tools/planner-remove-meal.md](tools/planner-remove-meal.md) | ⬜ | 0/2 | 0% |
| planner.list_meals | [tools/planner-list-meals.md](tools/planner-list-meals.md) | ⬜ | 0/2 | 0% |
| grocery.create_list | [tools/grocery-create-list.md](tools/grocery-create-list.md) | ⬜ | 0/2 | 0% |
| grocery.push_ingredients | [tools/grocery-push-ingredients.md](tools/grocery-push-ingredients.md) | ⬜ | 0/4 | 0% |
| grocery.add_item | [tools/grocery-add-item.md](tools/grocery-add-item.md) | ⬜ | 0/2 | 0% |

**Total Tool Tests**: 0/27 complete

---

## Integration Tests

| Feature | Test File | Status | Test Count | Coverage |
|---------|-----------|--------|------------|----------|
| Grocery Flow (E2E) | [integration/grocery-flow.md](integration/grocery-flow.md) | ⬜ | 0/1 | 0% |
| RLS Policies | [integration/rls-policies.md](integration/rls-policies.md) | ⬜ | 0/2 | 0% |
| Database Constraints | [integration/database-constraints.md](integration/database-constraints.md) | ⬜ | 0/3 | 0% |

**Total Integration Tests**: 0/6 complete

---

## E2E Tests (User Flows)

| Flow | Test File | Status | Test Count | Coverage |
|------|-----------|--------|------------|----------|
| Authentication | [e2e/authentication-flow.md](e2e/authentication-flow.md) | ⬜ | 0/4 | 0% |
| Meal Planning | [e2e/meal-planning-flow.md](e2e/meal-planning-flow.md) | ⬜ | 0/1 | 0% |
| Recipe Management | [e2e/recipe-management.md](e2e/recipe-management.md) | ⬜ | 0/1 | 0% |

**Total E2E Tests**: 0/6 complete

---

## AI Behavior Tests

| Feature | Test File | Status | Test Count | Coverage |
|---------|-----------|--------|------------|----------|
| Tool Calling | [ai-behavior/tool-calling.md](ai-behavior/tool-calling.md) | ⬜ | 0/2 | 0% |
| Governance Compliance | [ai-behavior/governance-compliance.md](ai-behavior/governance-compliance.md) | ⬜ | 0/2 | 0% |

**Total AI Behavior Tests**: 0/4 complete

---

## Overall Progress

**Total Tests Defined**: 58
**Total Tests Implemented**: 0
**Total Tests Passing**: 0

**Coverage by Layer**:
- Unit: 0%
- Tools: 0%
- Integration: 0%
- E2E: 0%
- AI Behavior: 0%

---

## Phase 1 Goals

**Must Complete** (Critical Path):
- [x] Quantity Math (5 tests)
- [x] Ingredient Aggregation (6 tests)
- [x] recipe.create (4 tests)
- [x] planner.add_meal (5 tests)
- [x] grocery.push_ingredients (4 tests)
- [x] Authentication Flow (4 tests)

**Target**: 28/58 tests passing by end of Phase 1

---

## How to Update This File

When implementing a feature:
1. Open the relevant test case file (e.g., `unit/quantity-math.md`)
2. Write tests based on Given/When/Then specs
3. Update status in this README:
   - ⬜ → 🟨 (test written, failing)
   - 🟨 → ✅ (test passing)
4. Update test count (e.g., 0/5 → 3/5 → 5/5)
5. Commit changes

---

## Next Test to Implement

**Start here**: [unit/quantity-math.md](unit/quantity-math.md)

This is the foundation for all quantity operations and has no dependencies.
