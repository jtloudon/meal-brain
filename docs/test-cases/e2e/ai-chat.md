# E2E Test Cases: AI Chat Panel

**Feature**: AI Sous Chef Chat Interface
**Phase**: Phase 4 - AI Integration
**Status**: 🟨 In Progress

---

## Test Case 1: Open and Close Chat Panel

**Given** user is on any authenticated page
**When** user clicks the floating chef's hat button
**Then** the chat panel slides up from the bottom
**And** a backdrop appears behind the panel
**And** the panel covers 70% of the viewport height
**And** the panel shows "AI Sous Chef" header
**And** the panel shows empty state message

**When** user clicks the backdrop
**Then** the chat panel closes
**And** the backdrop disappears

**When** user clicks the X button in the panel header
**Then** the chat panel closes

---

## Test Case 2: Send Message and Receive Response

**Given** user has opened the chat panel
**When** user types "What recipes do I have?" in the input field
**And** user clicks the send button
**Then** the user's message appears as an orange bubble on the right
**And** a loading indicator (three dots) appears
**And** after a moment, an AI response appears as a gray bubble on the left
**And** the AI response mentions the recipes in the database
**And** the input field is cleared

---

## Test Case 3: AI Uses Tools to Answer Questions

**Given** user has 3 example recipes in their household
**And** user has opened the chat panel
**When** user sends "Show me all my recipes"
**Then** the AI response lists all 3 recipes by name

**When** user sends "What's planned for this week?"
**And** there are no planned meals
**Then** the AI response indicates no meals are planned

**When** user sends "What's on my grocery list?"
**And** user has a grocery list named "My First List"
**Then** the AI response mentions the list name

---

## Test Case 4: Conversation History Persists

**Given** user has sent 2 messages
**And** received 2 AI responses
**When** user sends a third message referencing previous context
**Then** the AI response demonstrates awareness of prior messages
**And** all previous messages remain visible in the chat

---

## Test Case 5: Error Handling

**Given** user has opened the chat panel
**When** the API request fails (network error)
**Then** an error message appears in the chat
**And** the error message says "Sorry, I'm having trouble connecting right now"
**And** the user can still send another message

---

## Test Case 6: Empty Message Validation

**Given** user has opened the chat panel
**When** user tries to send an empty message
**Then** the send button is disabled
**And** no message is sent

---

## Test Case 7: Mobile UI Rendering

**Given** user is on a mobile viewport (375px width)
**When** user opens the chat panel
**Then** the panel renders correctly without overflow
**And** the backdrop fully covers the screen
**And** the input field is accessible above the keyboard
**And** messages are readable and properly sized

---

## Test Case 8: Panel Positioning and Z-Index

**Given** user is on the recipes page
**When** user opens the chat panel
**Then** the panel appears above all page content
**And** the backdrop blocks interaction with underlying content
**And** the recipes page is not visible through the panel
**And** the panel covers the floating AI button

---

## Success Criteria

- [ ] All 8 test cases pass
- [ ] Chat panel renders correctly on mobile (375px-667px)
- [ ] AI successfully uses read-only tools (recipe.list, planner.list_meals, grocery.list_lists, grocery.get_list)
- [ ] Conversation history is maintained across multiple messages
- [ ] Error states are handled gracefully
- [ ] Panel z-index prevents content bleed-through

---

## Implementation Notes

- Use React Portal to render panel at document root (fixes z-index issues)
- Backdrop z-index: 9999
- Panel z-index: 10000
- Test with actual Anthropic API responses (not mocked)
- Verify tool calling works end-to-end
