import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract schema.org Recipe JSON-LD first (most common)
    let recipe = extractFromJsonLd($, url);

    // Fallback to heuristic parsing if no JSON-LD found
    if (!recipe) {
      recipe = extractFromHeuristics($, url);
    }

    if (!recipe.title) {
      return NextResponse.json({ error: 'Could not find recipe data on this page' }, { status: 400 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe import error:', error);
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    );
  }
}

function extractFromJsonLd($: cheerio.CheerioAPI, url: string) {
  // Look for JSON-LD schema.org Recipe markup
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const jsonText = $(scripts[i]).html();
      if (!jsonText) continue;

      const data = JSON.parse(jsonText);

      // Handle both single recipe and array of items
      const recipes = Array.isArray(data) ? data : [data];

      for (const item of recipes) {
        // Check if this is a Recipe type (including nested @graph)
        const recipe = item['@type'] === 'Recipe' ? item :
                      item['@graph']?.find((g: any) => g['@type'] === 'Recipe');

        if (recipe) {
          return {
            title: recipe.name || '',
            ingredients: extractIngredients(recipe.recipeIngredient || []),
            instructions: extractInstructions(recipe.recipeInstructions || ''),
            notes: recipe.description || null,
            prep_time: recipe.prepTime || null,
            cook_time: recipe.cookTime || null,
            serving_size: normalizeServingSize(recipe.recipeYield),
            image_url: extractImage(recipe.image) || null,
            source: url,
          };
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

function extractFromHeuristics($: cheerio.CheerioAPI, url: string) {
  // Simple heuristic parsing as fallback
  const title = $('h1').first().text().trim() ||
                $('title').text().trim() ||
                'Imported Recipe';

  // Look for ingredient lists
  const ingredients: string[] = [];
  $('li').each((_, el) => {
    const text = $(el).text().trim();
    // Simple heuristic: if it contains common ingredient words or measurements
    if (text.length > 5 && text.length < 200 &&
        (text.match(/\d+/) || text.match(/cup|tbsp|tsp|oz|lb|g|kg|ml/i))) {
      ingredients.push(text);
    }
  });

  // Look for instructions
  let instructions = '';
  $('ol li').each((_, el) => {
    const step = $(el).text().trim();
    if (step.length > 10) {
      instructions += `${step}\n`;
    }
  });

  return {
    title,
    ingredients: ingredients.slice(0, 20), // Limit to 20 ingredients
    instructions: instructions || 'See original recipe for instructions.',
    notes: `Imported from ${new URL(url).hostname}`,
    prep_time: null,
    cook_time: null,
    serving_size: null,
    image_url: null,
  };
}

function extractIngredients(items: any): string[] {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') return item;
    if (item.text) return item.text;
    return '';
  })
  .filter(Boolean)
  .filter(ing => {
    // Filter out section headers (short strings without measurements or numbers)
    const trimmed = ing.trim();

    // Skip very short strings (likely headers like "Sauce", "Main", etc.)
    if (trimmed.length < 10) {
      // But keep it if it has measurements or numbers (like "2 eggs")
      const hasMeasurement = /\d|cup|tbsp|tsp|oz|lb|kg|ml|gram/i.test(trimmed);
      return hasMeasurement;
    }

    return true;
  });
}

function extractInstructions(instructions: any): string {
  if (typeof instructions === 'string') return instructions;

  if (Array.isArray(instructions)) {
    return instructions.map((step, i) => {
      if (typeof step === 'string') return step;
      if (step.text) return step.text;
      if (step.itemListElement) {
        return step.itemListElement.map((s: any) => s.text || '').join('\n');
      }
      return '';
    }).filter(Boolean).join('\n');
  }

  return '';
}

function normalizeServingSize(servingSize: any): string | null {
  if (!servingSize) return null;

  const str = String(servingSize);

  // Replace European decimal comma with period (4,4 -> 4.4)
  let normalized = str.replace(',', '.');

  // Extract first number if it contains text like "Serves 4-6" or "4 servings"
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    // Round to nearest integer if it's close (4.4 -> 4)
    return String(Math.round(num));
  }

  return normalized;
}

function extractImage(image: any): string | null {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return image[0];
  if (image?.url) return image.url;
  return null;
}
