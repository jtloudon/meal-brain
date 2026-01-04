# Write Operations Approval Pattern

## Overview
All write operations (create, update, delete) require explicit user approval before execution.

**Core Principle:** AI proposes → User approves → Tool executes deterministically

---

## UI Pattern

### Message Flow

```
User: "Add chicken curry to my meal plan for Tuesday"

AI (text): "I'll add Chicken Curry to Tuesday dinner. Here's what I'll do:"

AI (approval card):
┌─────────────────────────────────────┐
│ 📝 Proposed Action                  │
├─────────────────────────────────────┤
│ Add meal to planner                 │
│                                     │
│ Recipe: Chicken Curry               │
│ Date: Tuesday, Jan 7, 2026          │
│ Meal: Dinner (6:00 PM)              │
│                                     │
│ [Approve ✓]  [Cancel ✗]            │
└─────────────────────────────────────┘

[User taps Approve]

AI (text): "Added Chicken Curry to Tuesday dinner! 🍛"
```

---

## Technical Implementation

### 1. Message Types

Extend the Message interface:

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  approval?: ApprovalRequest;  // New field
}

interface ApprovalRequest {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: 'recipe' | 'meal' | 'grocery_item' | 'grocery_list';
  preview: {
    title: string;
    details: string[];
  };
  toolName: string;
  toolInput: any;
  status: 'pending' | 'approved' | 'cancelled';
}
```

### 2. AI Response Format

AI can include special markers in response to trigger approval UI:

```json
{
  "text": "I'll add Chicken Curry to Tuesday dinner.",
  "approval_required": true,
  "action": {
    "type": "planner_add_meal",
    "preview": {
      "title": "Add meal to planner",
      "details": [
        "Recipe: Chicken Curry",
        "Date: Tuesday, Jan 7, 2026",
        "Meal: Dinner (6:00 PM)"
      ]
    },
    "tool": "planner_add_meal",
    "input": {
      "recipe_id": "uuid-123",
      "date": "2026-01-07",
      "meal_type": "dinner"
    }
  }
}
```

### 3. Chat API Changes

**Current:** AI calls tools directly in agentic loop
**New:** AI returns tool intent, waits for approval

```typescript
// In chat/route.ts
if (response.approval_required) {
  // Return to UI with approval request
  return {
    message: response.text,
    approval: response.action
  };
}
```

### 4. UI Component

```tsx
// ApprovalCard.tsx
interface ApprovalCardProps {
  approval: ApprovalRequest;
  onApprove: () => void;
  onCancel: () => void;
}

function ApprovalCard({ approval, onApprove, onCancel }: ApprovalCardProps) {
  const icons = {
    create: '➕',
    update: '✏️',
    delete: '🗑️',
  };

  return (
    <div className="approval-card">
      <div className="header">
        <span>{icons[approval.action]}</span>
        <span>Proposed Action</span>
      </div>
      <div className="preview">
        <h4>{approval.preview.title}</h4>
        {approval.preview.details.map((detail, i) => (
          <p key={i}>{detail}</p>
        ))}
      </div>
      <div className="actions">
        <button onClick={onApprove} className="approve">
          Approve ✓
        </button>
        <button onClick={onCancel} className="cancel">
          Cancel ✗
        </button>
      </div>
    </div>
  );
}
```

---

## Approval Flow

### Step-by-Step

1. **User Request**
   - User: "Add chicken curry to Tuesday"

2. **AI Proposes**
   - AI analyzes request
   - Determines tool needed
   - Prepares preview
   - Returns approval request to UI

3. **UI Shows Approval Card**
   - Renders preview
   - Shows Approve/Cancel buttons
   - Disables chat input until decision

4. **User Approves**
   - User taps "Approve"
   - Frontend calls `/api/chat/approve` endpoint
   - Passes approval ID + tool details

5. **Tool Executes**
   - Backend executes tool with input
   - Returns result

6. **AI Confirms**
   - AI receives tool result
   - Generates confirmation message
   - UI updates with success message

### API Endpoints

**New endpoint:** `/api/chat/approve`

```typescript
POST /api/chat/approve
{
  "approval_id": "uuid",
  "approved": true,
  "tool_name": "planner_add_meal",
  "tool_input": { ... }
}

Response:
{
  "success": true,
  "result": { ... },
  "message": "Added Chicken Curry to Tuesday dinner!"
}
```

---

## Alternative: Structured Tool Outputs

Instead of custom approval format, use Claude's built-in tool use pattern:

### Option 2: Tool Use + Confirmation

1. AI calls tool with `requires_confirmation: true` flag
2. Tool returns preview instead of executing
3. UI shows preview
4. User approves
5. Tool executes

**Pros:** Uses standard tool pattern
**Cons:** Requires two tool calls per write operation

---

## Implementation Priority

### Phase 1: Simple Approval (Recommended)
- AI proposes in text: "I'll add X to Y. Reply 'yes' to confirm."
- User types "yes" or "confirm"
- AI executes tool
- **Pros:** Simplest, no UI changes
- **Cons:** Not ideal UX, requires typing

### Phase 2: Inline Buttons (Target)
- Approval cards with buttons
- Clean mobile UX
- Professional feel
- **Pros:** Best UX
- **Cons:** More complex implementation

### Phase 3: Batch Approvals (Future)
- Multiple changes in one approval
- Example: "Plan entire week" → approve 7 meals at once

---

## Security Considerations

1. **Validate on backend:** Never trust frontend approval
2. **Re-check permissions:** User still owns household when executing
3. **Idempotency:** Same approval ID can't be used twice
4. **Timeout:** Approval requests expire after 5 minutes

---

## Testing Strategy

```typescript
describe('Write approval flow', () => {
  it('shows approval card for create operations', async () => {
    const response = await chat('Add chicken curry to Tuesday');
    expect(response.approval).toBeDefined();
    expect(response.approval.action).toBe('create');
  });

  it('executes tool after approval', async () => {
    const approval = await chat('Add chicken curry to Tuesday');
    const result = await approve(approval.id);
    expect(result.success).toBe(true);
  });

  it('cancels without executing', async () => {
    const approval = await chat('Delete all recipes');
    await cancel(approval.id);
    const recipes = await listRecipes();
    expect(recipes.length).toBeGreaterThan(0);
  });
});
```

---

## Next Steps

1. ✅ Document approval pattern (this file)
2. ⏳ Implement Phase 1 (text confirmation)
3. ⏳ Build approval card component
4. ⏳ Create write tools (planner_add_meal, recipe_create, etc.)
5. ⏳ Add approval endpoint
6. ⏳ Test end-to-end flow
7. ⏳ Upgrade to Phase 2 (inline buttons)
