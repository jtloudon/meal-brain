import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    const { fileData, mimeType, fileName } = await request.json();

    if (!fileData) {
      return NextResponse.json(
        { error: 'File data is required' },
        { status: 400 }
      );
    }

    console.log('[Import File] Processing file:', fileName, 'Type:', mimeType);

    // Use Claude Vision API to extract recipe from image/PDF
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: fileData,
              },
            },
            {
              type: 'text',
              text: `Extract the recipe from this image. Return a structured JSON object with the following format:

{
  "title": "Recipe name",
  "ingredients": ["ingredient 1 with quantity and unit", "ingredient 2 with quantity and unit", ...],
  "instructions": "Step-by-step cooking instructions as a single string, with each step on a new line",
  "notes": "Any additional notes or tips",
  "tags": ["tag1", "tag2", ...],
  "prep_time": "Prep time (e.g., '15 min')",
  "cook_time": "Cook time (e.g., '30 min')",
  "serving_size": "Number of servings (e.g., '4 servings')",
  "source": "Source of the recipe if mentioned"
}

IMPORTANT:
- For ingredients, include the full text with quantity, unit, and name (e.g., "2 cups flour, sifted")
- If prep states like "diced", "chopped", "minced" are mentioned, include them in the ingredient string
- For instructions, combine all steps into a single string with line breaks between steps
- If any field is not available, use null
- Extract ALL ingredients you can see, even if partially visible
- Be flexible with formatting - extract what you can from handwritten notes, screenshots, or printed recipes

Return ONLY the JSON object, no other text.`,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let responseText = textContent.text;

    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('[Import File] Claude response:', responseText);

    // Parse the JSON response
    const recipe = JSON.parse(responseText);

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('[Import File] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import recipe from file' },
      { status: 500 }
    );
  }
}
