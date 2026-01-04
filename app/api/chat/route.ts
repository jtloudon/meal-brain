import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/auth/supabase-server';

// Import tools
import { listRecipes } from '@/lib/tools/recipe';
import { listMeals, addMeal } from '@/lib/tools/planner';
import { listLists, getList, pushIngredients } from '@/lib/tools/grocery';
import { getUserPreferences } from '@/lib/tools/preferences';
import { supabase } from '@/lib/db/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define tool schemas for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'recipe_list',
    description: 'List all recipes for the household with optional filters. Use this to find recipes by name, tags, meal type, or rating. Returns basic metadata only - use recipe_get to see full details including ingredients and instructions.',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search query to filter recipes by title, tags, notes, or instructions',
        },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Filter recipes by meal type',
        },
        min_rating: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Minimum rating (1-5) to filter recipes',
        },
      },
    },
  },
  {
    name: 'recipe_get',
    description: 'Get full details of a specific recipe including all ingredients (with quantities and units), instructions, notes, and metadata. Use this when you need to see what ingredients are in a recipe or how to make it.',
    input_schema: {
      type: 'object',
      properties: {
        recipe_id: {
          type: 'string',
          description: 'The UUID of the recipe to retrieve',
        },
      },
      required: ['recipe_id'],
    },
  },
  {
    name: 'planner_list_meals',
    description: 'List planned meals for a date range. Use this to see what meals are scheduled.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'grocery_list_lists',
    description: 'List all grocery lists for the household. Use this to see available grocery lists.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'grocery_get_list',
    description: 'Get items from a specific grocery list. Use this to see what items are on a grocery list.',
    input_schema: {
      type: 'object',
      properties: {
        grocery_list_id: {
          type: 'string',
          description: 'The UUID of the grocery list to retrieve',
        },
      },
      required: ['grocery_list_id'],
    },
  },
  {
    name: 'preferences_get',
    description: 'Get user preferences including dietary constraints, household context (just-me/couple/family), AI style (coach/collaborator), planning preferences, shopping categories, and meal courses. Use this to understand user preferences when making suggestions.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'recipe_create',
    description: 'Create a new recipe. REQUIRES USER APPROVAL. After calling this tool, present a preview to the user and wait for confirmation before the recipe is actually created.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The recipe title',
        },
        ingredients: {
          type: 'array',
          description: 'List of ingredients with quantities',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Ingredient name' },
              quantity_min: { type: 'number', description: 'Minimum quantity (or single quantity if no range)' },
              quantity_max: { type: 'number', description: 'Maximum quantity for ranges (null if no range)', nullable: true },
              unit: {
                type: 'string',
                enum: ['cup', 'tbsp', 'tsp', 'ml', 'l', 'fl oz', 'lb', 'oz', 'g', 'kg', 'whole', 'clove', 'can', 'package', 'slice'],
                description: 'Unit of measurement',
              },
              prep_state: { type: 'string', description: 'Optional prep state (e.g., "diced", "minced")', nullable: true },
            },
            required: ['name', 'quantity_min', 'unit'],
          },
        },
        instructions: { type: 'string', description: 'Cooking instructions', nullable: true },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing the recipe',
        },
        rating: { type: 'number', minimum: 1, maximum: 5, description: 'Rating from 1-5', nullable: true },
        notes: { type: 'string', description: 'Additional notes', nullable: true },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Type of meal',
          nullable: true,
        },
        serving_size: { type: 'string', description: 'Serving size (e.g., "4 servings")', nullable: true },
        prep_time: { type: 'string', description: 'Prep time (e.g., "15 min")', nullable: true },
        cook_time: { type: 'string', description: 'Cook time (e.g., "30 min")', nullable: true },
      },
      required: ['title', 'ingredients'],
    },
  },
  {
    name: 'planner_add_meal',
    description: 'Add a meal to the meal planner. REQUIRES USER APPROVAL. Use this when the user asks to plan meals or add recipes to specific dates.',
    input_schema: {
      type: 'object',
      properties: {
        recipe_id: {
          type: 'string',
          description: 'The UUID of the recipe to add to the planner',
        },
        date: {
          type: 'string',
          description: 'The date in YYYY-MM-DD format (e.g., "2026-01-15")',
        },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'The meal type for this planned meal',
        },
      },
      required: ['recipe_id', 'date', 'meal_type'],
    },
  },
  {
    name: 'grocery_push_ingredients',
    description: 'Push recipe ingredients to a grocery list. REQUIRES USER APPROVAL. Use this when the user wants to add ingredients from a recipe to their shopping list.',
    input_schema: {
      type: 'object',
      properties: {
        grocery_list_id: {
          type: 'string',
          description: 'The UUID of the grocery list to add ingredients to',
        },
        recipe_id: {
          type: 'string',
          description: 'The UUID of the recipe whose ingredients should be added',
        },
      },
      required: ['grocery_list_id', 'recipe_id'],
    },
  },
];

// Tool execution handler
async function executeTool(toolName: string, toolInput: any, householdId: string, userId: string) {
  const context = { householdId, userId };

  switch (toolName) {
    case 'recipe_list':
      return await listRecipes(
        {
          filters: {
            search: toolInput.search,
            meal_type: toolInput.meal_type,
            rating: toolInput.min_rating,
          },
          limit: 50,
          offset: 0,
        },
        context
      );

    case 'recipe_get':
      // Get full recipe details including ingredients and instructions
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          rating,
          tags,
          notes,
          instructions,
          image_url,
          source,
          serving_size,
          prep_time,
          cook_time,
          meal_type,
          created_at,
          recipe_ingredients (
            id,
            ingredient_id,
            display_name,
            quantity_min,
            quantity_max,
            unit,
            prep_state,
            optional
          )
        `)
        .eq('id', toolInput.recipe_id)
        .eq('household_id', householdId)
        .single();

      if (recipeError || !recipe) {
        return {
          success: false,
          error: { type: 'NOT_FOUND', message: 'Recipe not found' },
        };
      }

      return {
        success: true,
        data: recipe,
      };

    case 'planner_list_meals':
      return await listMeals(
        {
          start_date: toolInput.start_date,
          end_date: toolInput.end_date,
        },
        context
      );

    case 'grocery_list_lists':
      return await listLists({}, context);

    case 'grocery_get_list':
      return await getList(
        {
          grocery_list_id: toolInput.grocery_list_id,
        },
        context
      );

    case 'preferences_get':
      return await getUserPreferences({}, context);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Chat API] POST request received');

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Chat API] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.log('[Chat API] Auth failed - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's household
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.household_id) {
      return NextResponse.json(
        { error: 'User not associated with household' },
        { status: 400 }
      );
    }

    const householdId = userData.household_id;

    // Parse request body
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Get current date for context
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Calculate this week's date range (Sunday to Saturday)
    const daysSinceSunday = today.getDay();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - daysSinceSunday);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const weekStartStr = thisWeekStart.toISOString().split('T')[0];
    const weekEndStr = thisWeekEnd.toISOString().split('T')[0];

    // System prompt for the AI agent
    const systemPrompt = `You are an AI sous chef for MealBrain, a meal planning and recipe management app.

CURRENT DATE CONTEXT:
- Today is: ${dayOfWeek}, ${todayStr}
- This week: ${weekStartStr} to ${weekEndStr} (Sunday to Saturday)
- When user says "this week", use dates in this range
- When user says "next week", add 7 days to these dates
- When user says "tomorrow", use ${new Date(today.getTime() + 86400000).toISOString().split('T')[0]}

Your role:
- Help users plan meals, find recipes, and manage grocery lists
- Be helpful, friendly, and concise (this is a mobile app)
- Use the available tools to read data when needed
- Explain your reasoning clearly but briefly
- Never hallucinate data - always use tools to check facts

Important rules:
- Always use tools to check recipes, meals, and grocery lists
- Check user preferences (preferences_get) to understand dietary constraints, household context, and AI style preferences
- When suggesting meal plans, be specific about which recipes to use and respect dietary constraints
- Keep responses concise and mobile-friendly (2-3 sentences max unless asked for details)

Write Operations (REQUIRES USER APPROVAL):
You CAN now add meals to the planner and push ingredients to grocery lists! Here's how:

1. **Creating Recipes** - Use recipe_create tool
   - Include ALL recipe details: title, ingredients (with quantities/units), instructions (numbered list)
   - The UI will show approval buttons automatically

2. **Adding Meals to Planner** - Use planner_add_meal tool
   - CRITICAL: You MUST use recipe_list first to find the recipe and get its real ID
   - NEVER guess or make up recipe IDs - they must come from recipe_list results
   - Requires: recipe_id (from recipe_list), date (YYYY-MM-DD), meal_type (breakfast/lunch/dinner/snack)
   - Example flow: User says "add chicken curry to Monday dinner"
     1. Call recipe_list with search="chicken curry"
     2. Get the actual recipe_id from the results
     3. Call planner_add_meal with that recipe_id, date, and meal_type="dinner"
   - The UI will show approval buttons automatically

3. **Pushing Ingredients to Grocery List** - Use grocery_push_ingredients tool
   - Requires: grocery_list_id, recipe_id
   - Use grocery_list_lists to find available lists first
   - The UI will show approval buttons automatically

IMPORTANT: DO NOT ask for approval in your text response. Just explain what you're about to do, then call the tool. The UI handles the approval buttons.

The user's household context is important - recipes and meals are specific to their household.`;

    // Call Claude with tools
    console.log('[Chat API] Calling Claude with', messages.length, 'messages');
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });
    console.log('[Chat API] Claude responded, stop_reason:', response.stop_reason);

    // Handle tool use (agentic loop)
    let toolUseCount = 0;
    const MAX_TOOL_ITERATIONS = 10; // Prevent infinite loops

    while (response.stop_reason === 'tool_use' && toolUseCount < MAX_TOOL_ITERATIONS) {
      toolUseCount++;
      console.log('[Chat API] Tool use iteration', toolUseCount);

      // Find ALL tool use blocks in the response
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) {
        console.log('[Chat API] No tool use blocks found, breaking');
        break;
      }

      console.log('[Chat API] Executing', toolUseBlocks.length, 'tools:', toolUseBlocks.map(t => t.name).join(', '));

      // Check if any tools require approval
      const writeTools = ['recipe_create', 'planner_add_meal', 'grocery_push_ingredients'];  // List of tools that require approval
      const writeToolUses = toolUseBlocks.filter(block => writeTools.includes(block.name));

      if (writeToolUses.length > 0) {
        // Return approval request for ALL write tools
        console.log('[Chat API] Write tools detected:', writeToolUses.length, 'tools');

        // Get the text before the tool use
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        // Generate preview text for each tool
        const actions = writeToolUses.map(writeToolUse => {
          let preview = '';
          const input = writeToolUse.input as any;
          switch (writeToolUse.name) {
            case 'recipe_create':
              preview = `Create recipe: ${input.title}`;
              break;
            case 'planner_add_meal':
              preview = `Add to ${input.meal_type} on ${input.date}`;
              break;
            case 'grocery_push_ingredients':
              preview = `Add ingredients to grocery list`;
              break;
            default:
              preview = `Execute ${writeToolUse.name}`;
          }
          return {
            id: crypto.randomUUID(),
            toolName: writeToolUse.name,
            toolInput: writeToolUse.input,
            preview,
          };
        });

        return NextResponse.json({
          message: textBlock?.text || 'I can help you with that.',
          approval_required: true,
          approval_actions: actions, // Array of actions
          usage: response.usage,
        });
      }

      // Execute ALL tools and collect results (for read-only tools)
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUseBlock) => {
          const result = await executeTool(
            toolUseBlock.name,
            toolUseBlock.input,
            householdId,
            user.id
          );
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Continue conversation with ALL tool results
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt, // Include system prompt in follow-up calls
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: toolResults,
          },
        ],
      });
    }

    // Check if we hit the iteration limit
    if (toolUseCount >= MAX_TOOL_ITERATIONS) {
      console.log('[Chat API] WARNING: Hit max tool iterations limit');
      return NextResponse.json({
        message: "I apologize, but I'm having trouble processing your request. Could you try rephrasing your question more simply?",
        usage: response.usage,
      });
    }

    // Extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return NextResponse.json({
      message: textBlock?.text || 'No response generated',
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
