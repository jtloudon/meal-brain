'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import RecipeFormWithTabs from '@/components/RecipeFormWithTabs';
import { parseIngredientsText } from '@/lib/utils/parse-ingredients';

function NewRecipePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial data from sessionStorage or URL params (from import)
  const initialData = useMemo(() => {
    // Check if this is an imported recipe from sessionStorage
    const isImported = searchParams.get('imported') === 'true';
    if (isImported) {
      const storedData = sessionStorage.getItem('imported-recipe');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          sessionStorage.removeItem('imported-recipe'); // Clear after reading

          // Parse ingredients from JSON string
          let ingredientsText = '';
          if (parsedData.ingredients) {
            const ingredients = JSON.parse(parsedData.ingredients);
            ingredientsText = ingredients
              .map((ing: any) => {
                const qty = ing.quantity_max !== null && ing.quantity_max !== undefined
                  ? `${ing.quantity_min}-${ing.quantity_max}`
                  : ing.quantity_min;
                return `${qty} ${ing.unit} ${ing.name}${ing.prep_state ? `, ${ing.prep_state}` : ''}`;
              })
              .join('\n');
          }

          // Parse tags from JSON string
          let tagsString = '';
          if (parsedData.tags) {
            const tagsArray = JSON.parse(parsedData.tags);
            tagsString = tagsArray.join(', ');
          }

          return {
            title: parsedData.title || '',
            ingredientsText,
            instructions: parsedData.instructions || '',
            notes: parsedData.notes || '',
            tags: tagsString,
            prepTime: parsedData.prepTime || '',
            cookTime: parsedData.cookTime || '',
            servingSize: parsedData.servingSize || '',
            imageUrl: parsedData.imageUrl || '',
            source: parsedData.source || '',
            rating: null,
            mealType: null,
          };
        } catch (e) {
          console.error('Failed to parse imported recipe from sessionStorage:', e);
        }
      }
    }

    // Fallback to URL params (old import method)
    const title = searchParams.get('title') || '';
    const ingredientsParam = searchParams.get('ingredients');
    const instructions = searchParams.get('instructions') || '';
    const notes = searchParams.get('notes') || '';
    const tagsParam = searchParams.get('tags');
    const prepTime = searchParams.get('prepTime') || '';
    const cookTime = searchParams.get('cookTime') || '';
    const servingSize = searchParams.get('servingSize') || '';
    const imageUrl = searchParams.get('imageUrl') || '';
    const source = searchParams.get('source') || '';

    // Parse ingredients from JSON if present
    let ingredientsText = '';
    if (ingredientsParam) {
      try {
        const ingredients = JSON.parse(ingredientsParam);
        // Convert parsed ingredients back to text format for the form
        ingredientsText = ingredients
          .map((ing: any) => {
            // Handle quantity ranges (e.g., "1-2")
            const qty = ing.quantity_max !== null && ing.quantity_max !== undefined
              ? `${ing.quantity_min}-${ing.quantity_max}`
              : ing.quantity_min;
            const unit = ing.unit;
            const name = ing.name;
            const prep = ing.prep_state ? `, ${ing.prep_state}` : '';
            return `${qty} ${unit} ${name}${prep}`;
          })
          .join('\n');
      } catch (e) {
        console.error('Failed to parse ingredients:', e);
      }
    }

    // Parse tags from JSON if present
    let tagsString = '';
    if (tagsParam) {
      try {
        const tagsArray = JSON.parse(tagsParam);
        tagsString = tagsArray.join(', '); // Convert array to comma-separated string
      } catch (e) {
        console.error('Failed to parse tags:', e);
      }
    }

    // Only return initial data if we have at least a title
    if (!title) return undefined;

    return {
      title,
      ingredientsText,
      instructions,
      notes,
      tags: tagsString,
      prepTime,
      cookTime,
      servingSize,
      imageUrl,
      source,
      rating: null,
      mealType: null,
    };
  }, [searchParams]);

  const handleSubmit = async (data: {
    title: string;
    rating: number | null;
    tags: string[];
    notes: string;
    instructions: string;
    ingredientsText: string;
    imageUrl: string | null;
    source: string;
    servingSize: string;
    prepTime: string;
    cookTime: string;
    mealType: string | null;
  }) => {
    // Parse ingredients from free-form text
    const parsedIngredients = parseIngredientsText(data.ingredientsText);

    if (parsedIngredients.length === 0) {
      throw new Error('At least one valid ingredient is required');
    }

    // Submit to API
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        ingredients: parsedIngredients.map((ing) => ({
          name: ing.name,
          quantity_min: ing.quantity_min,
          quantity_max: ing.quantity_max,
          unit: ing.unit,
          prep_state: ing.prep_state || undefined,
          is_header: ing.is_header || false,
        })),
        instructions: data.instructions || undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
        rating: data.rating || undefined,
        notes: data.notes || undefined,
        image_url: data.imageUrl || undefined,
        source: data.source || undefined,
        serving_size: data.servingSize || undefined,
        prep_time: data.prepTime || undefined,
        cook_time: data.cookTime || undefined,
        meal_type: data.mealType || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create recipe');
    }

    const responseData = await response.json();
    router.push(`/recipes/${responseData.recipe_id}`);
  };

  return (
    <RecipeFormWithTabs
      mode="create"
      onSubmit={handleSubmit}
      initialData={initialData}
    />
  );
}

export default function NewRecipePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRecipePageContent />
    </Suspense>
  );
}
