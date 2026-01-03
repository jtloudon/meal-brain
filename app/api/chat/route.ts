import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/auth/supabase-server';

// Import read-only tools
import { listRecipes } from '@/lib/tools/recipe';
import { listMeals } from '@/lib/tools/planner';
import { listLists, getList } from '@/lib/tools/grocery';
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
];

// Tool execution handler
async function executeTool(toolName: string, toolInput: any, householdId: string) {
  const context = { householdId };

  switch (toolName) {
    case 'recipe_list':
      return await listRecipes(
        {
          filters: {
            search: toolInput.search,
            meal_type: toolInput.meal_type,
            rating: toolInput.min_rating,
          },
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
            quantity,
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

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // System prompt for the AI agent
    const systemPrompt = `You are an AI sous chef for MealBrain, a meal planning and recipe management app.

Your role:
- Help users plan meals, find recipes, and manage grocery lists
- Be helpful, friendly, and concise (this is a mobile app)
- Use the available tools to read data when needed
- Explain your reasoning clearly but briefly
- Never hallucinate data - always use tools to check facts

Important rules:
- You can ONLY read data (no write operations yet)
- Always use tools to check recipes, meals, and grocery lists
- When suggesting meal plans, be specific about which recipes to use
- Keep responses concise and mobile-friendly (2-3 sentences max unless asked for details)

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

      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) {
        console.log('[Chat API] No tool use block found, breaking');
        break;
      }

      console.log('[Chat API] Executing tool:', toolUseBlock.name);

      // Execute the tool
      const toolResult = await executeTool(
        toolUseBlock.name,
        toolUseBlock.input,
        householdId
      );

      // Continue conversation with tool result
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
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(toolResult),
              },
            ],
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
