# AI Behavior Test: Tool Calling

**Module**: AI agent tool selection and execution

**Status**: ⬜ Not started

**Test Count**: 0/2 passing

**Coverage**: 0%

---

## Overview

Tests that the AI agent correctly identifies user intent and calls appropriate tools with correct parameters.

**Dependencies**:
- Claude 4.5 Sonnet
- Agent SDK
- All defined tools

---

## Test Case 1: AI calls correct tool for user intent

**Status**: ⬜

**Given**:
```typescript
const userMessage = 'Show me all chicken recipes';
const context = {
  userId: 'user-123',
  householdId: 'household-456',
  availableTools: ['recipe.list', 'recipe.get', 'planner.add_meal', /* ... */],
};
```

**When**:
```typescript
const response = await aiAgent.processMessage(userMessage, context);
```

**Then**:
```typescript
// Verify tool called
expect(response.toolCalls).toHaveLength(1);
expect(response.toolCalls[0].name).toBe('recipe.list');

// Verify parameters
expect(response.toolCalls[0].parameters).toMatchObject({
  filters: {
    tags: ['chicken'],
  },
});

// Verify AI explains what it's doing
expect(response.message).toContain('recipes');
expect(response.message).toContain('chicken');
```

**Additional test cases**:
```typescript
// User: "Add chicken curry to tomorrow's dinner"
// Expected: planner.add_meal with correct date

// User: "What's on the menu this week?"
// Expected: planner.list_meals with date range

// User: "Generate grocery list"
// Expected: grocery.push_ingredients
```

---

## Test Case 2: AI asks for approval before mutations

**Status**: ⬜

**Given**:
```typescript
const userMessage = 'Add chicken curry to tomorrow\'s dinner';
const context = {
  userId: 'user-123',
  householdId: 'household-456',
};
```

**When**:
```typescript
const response = await aiAgent.processMessage(userMessage, context);
```

**Then**:
```typescript
// AI should NOT execute tool immediately
expect(response.toolExecuted).toBe(false);

// AI should ask for confirmation
expect(response.requiresApproval).toBe(true);
expect(response.message).toMatch(/add.*chicken curry.*tomorrow/i);
expect(response.message).toMatch(/confirm|approve|proceed/i);

// AI should provide approve/cancel options
expect(response.actions).toContainEqual({
  type: 'approve',
  label: 'Add Meal',
});
expect(response.actions).toContainEqual({
  type: 'cancel',
  label: 'Cancel',
});
```

**Follow-up test**:
```typescript
// User clicks "Approve"
const approvalResponse = await aiAgent.executeApprovedAction(
  response.pendingAction
);

expect(approvalResponse.toolExecuted).toBe(true);
expect(approvalResponse.toolResult.success).toBe(true);
```

---

## Test Harness Example

```typescript
// tests/ai-behavior/test-harness.ts

export async function testAIBehavior({
  userMessage,
  expectedTool,
  expectedParams,
  expectedApprovalRequired,
  context,
}: {
  userMessage: string;
  expectedTool?: string;
  expectedParams?: Record<string, any>;
  expectedApprovalRequired?: boolean;
  context: AgentContext;
}) {
  const response = await aiAgent.processMessage(userMessage, context);

  if (expectedTool) {
    expect(response.toolCalls[0].name).toBe(expectedTool);
  }

  if (expectedParams) {
    expect(response.toolCalls[0].parameters).toMatchObject(expectedParams);
  }

  if (expectedApprovalRequired !== undefined) {
    expect(response.requiresApproval).toBe(expectedApprovalRequired);
  }

  return response;
}
```

---

## Progress Tracking

- [ ] Test Case 1: Correct tool selection
- [ ] Test Case 2: Approval required

**When all 2 pass**: Update [../README.md](../README.md) status to ✅
