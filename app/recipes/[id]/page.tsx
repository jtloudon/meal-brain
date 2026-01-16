'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Calendar, ShoppingCart, Star, Share2, Edit, Trash2 } from 'lucide-react';
import { decodeHTML } from '@/lib/utils/decode-html';

interface RecipeIngredient {
  id: string;
  ingredient_id: string | null;
  display_name: string;
  quantity_min: number;
  quantity_max: number | null;
  unit: string;
  prep_state: string | null;
  optional: boolean;
  is_header?: boolean;
}

interface Recipe {
  id: string;
  title: string;
  rating: number | null;
  tags: string[];
  notes: string | null;
  instructions: string | null;
  image_url: string | null;
  source: string | null;
  serving_size: string | null;
  prep_time: string | null;
  cook_time: string | null;
  created_at: string;
  recipe_ingredients: RecipeIngredient[];
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [groceryLists, setGroceryLists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroceryList, setSelectedGroceryList] = useState<string | null>(null);
  const [secondGroceryList, setSecondGroceryList] = useState<string | null>(null);
  const [defaultGroceryListId, setDefaultGroceryListId] = useState<string | null>(null);
  const [pushing, setPushing] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [ingredientsListA, setIngredientsListA] = useState<Set<string>>(new Set());
  const [ingredientsListB, setIngredientsListB] = useState<Set<string>>(new Set());
  const [pushSuccess, setPushSuccess] = useState(false);
  const [showServingSizeModal, setShowServingSizeModal] = useState(false);
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);
  const [baseServings, setBaseServings] = useState<number>(1);

  // Helper to format quantity (handles ranges like "1-2")
  const formatQuantity = (min: number, max: number | null): string => {
    const formatSingleQuantity = (qty: number): string => {
      const whole = Math.floor(qty);
      const remainder = qty - whole;

      // If no fractional part, return whole number
      if (remainder < 0.01) {
        return whole.toString();
      }

      // Common cooking fractions (in order of preference)
      const fractions = [
        { decimal: 0, unicode: '', num: 0, denom: 1 },      // 0
        { decimal: 0.125, unicode: '⅛', num: 1, denom: 8 },  // 1/8
        { decimal: 0.167, unicode: '⅙', num: 1, denom: 6 },  // 1/6
        { decimal: 0.25, unicode: '¼', num: 1, denom: 4 },   // 1/4
        { decimal: 0.333, unicode: '⅓', num: 1, denom: 3 },  // 1/3
        { decimal: 0.375, unicode: '⅜', num: 3, denom: 8 },  // 3/8
        { decimal: 0.5, unicode: '½', num: 1, denom: 2 },    // 1/2
        { decimal: 0.625, unicode: '⅝', num: 5, denom: 8 },  // 5/8
        { decimal: 0.667, unicode: '⅔', num: 2, denom: 3 },  // 2/3
        { decimal: 0.75, unicode: '¾', num: 3, denom: 4 },   // 3/4
        { decimal: 0.833, unicode: '⅚', num: 5, denom: 6 },  // 5/6
        { decimal: 0.875, unicode: '⅞', num: 7, denom: 8 },  // 7/8
      ];

      // Find the closest fraction
      let closest = fractions[0];
      let minDiff = Math.abs(remainder - closest.decimal);

      for (const frac of fractions) {
        const diff = Math.abs(remainder - frac.decimal);
        if (diff < minDiff) {
          minDiff = diff;
          closest = frac;
        }
      }

      // If the closest fraction is essentially 0, just return whole number
      if (closest.decimal === 0) {
        return whole.toString();
      }

      // If the closest fraction is very close to 1, round up to next whole number
      if (closest.decimal > 0.95) {
        return (whole + 1).toString();
      }

      // Return formatted fraction
      if (whole > 0) {
        return `${whole} ${closest.unicode}`;  // "1 ¼"
      }
      return closest.unicode;  // "¼"
    };

    if (max !== null && max !== min) {
      return `${formatSingleQuantity(min)}-${formatSingleQuantity(max)}`;
    }
    return formatSingleQuantity(min);
  };

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string);
    }
  }, [params.id]);

  const fetchRecipe = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recipes/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }

      const data = await response.json();
      setRecipe(data);

      // Parse base servings from serving_size string
      if (data.serving_size) {
        const match = data.serving_size.match(/\d+/);
        if (match) {
          setBaseServings(parseInt(match[0]));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      // Redirect to recipe list with hard navigation to ensure fresh data
      window.location.href = '/recipes';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const fetchGroceryLists = async () => {
    try {
      // Fetch grocery lists
      const response = await fetch('/api/grocery/lists');
      if (!response.ok) throw new Error('Failed to fetch grocery lists');
      const data = await response.json();
      setGroceryLists(data.lists || []);

      // Fetch user preferences to get default list
      const prefsResponse = await fetch('/api/user/preferences');
      if (prefsResponse.ok) {
        const prefs = await prefsResponse.json();
        const defaultId = prefs.default_grocery_list_id;
        setDefaultGroceryListId(defaultId);

        // Set selected list to default if it exists, otherwise first list
        if (defaultId && data.lists?.some((list: any) => list.id === defaultId)) {
          setSelectedGroceryList(defaultId);
        } else if (data.lists && data.lists.length > 0) {
          setSelectedGroceryList(data.lists[0].id);
        }
      } else {
        // If preferences fetch fails, just use first list
        if (data.lists && data.lists.length > 0) {
          setSelectedGroceryList(data.lists[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grocery lists');
    }
  };

  const handleOpenPushModal = () => {
    // Initialize all ingredients as selected (exclude headers)
    if (recipe) {
      const allIngredientIds = new Set(
        recipe.recipe_ingredients
          .filter(ing => !ing.is_header) // Skip section headers
          .map(ing => ing.id)
      );
      setSelectedIngredients(allIngredientIds);
      // For 2-list mode: all ingredients start in List A (default list)
      setIngredientsListA(allIngredientIds);
      setIngredientsListB(new Set());
    }
    setShowPushModal(true);
    setPushSuccess(false);
    setSecondGroceryList(null);  // Reset second list
    fetchGroceryLists();
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };

  // For 2-list mode: toggle ingredient in List A (exclusive with List B)
  const toggleIngredientListA = (ingredientId: string) => {
    setIngredientsListA(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
        // Remove from List B (exclusive)
        setIngredientsListB(prevB => {
          const nextB = new Set(prevB);
          nextB.delete(ingredientId);
          return nextB;
        });
      }
      return next;
    });
  };

  // For 2-list mode: toggle ingredient in List B (exclusive with List A)
  const toggleIngredientListB = (ingredientId: string) => {
    setIngredientsListB(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
        // Remove from List A (exclusive)
        setIngredientsListA(prevA => {
          const nextA = new Set(prevA);
          nextA.delete(ingredientId);
          return nextA;
        });
      }
      return next;
    });
  };

  const handlePushIngredients = async () => {
    if (!recipe || !selectedGroceryList) return;

    try {
      setPushing(true);
      setError(null);

      // Calculate effective servings for scaling
      const effectiveServings = getEffectiveServings();

      // Helper to create ingredient payload with scaling
      const createIngredientPayload = (ing: any) => {
        // Use quantity_max if available (for ranges), otherwise use quantity_min
        const baseQty = ing.quantity_max ?? ing.quantity_min;
        const scaledMin = adjustedServings !== null
          ? parseFloat(scaleQuantity(ing.quantity_min, baseServings, effectiveServings))
          : ing.quantity_min;
        const scaledMax = ing.quantity_max && adjustedServings !== null
          ? parseFloat(scaleQuantity(ing.quantity_max, baseServings, effectiveServings))
          : ing.quantity_max;

        // For grocery list, use the max value (or min if no max)
        const finalQty = scaledMax ?? scaledMin;

        return {
          ingredient_id: ing.ingredient_id || null,
          display_name: ing.display_name,
          quantity_min: finalQty,
          quantity_max: null, // Grocery items don't use ranges
          unit: ing.unit,
          ...(ing.prep_state && { prep_state: ing.prep_state }),
          source_recipe_id: recipe.id,
        };
      };

      // 2-List Mode: Push to both lists
      if (secondGroceryList) {
        // Push ingredients for List A
        if (ingredientsListA.size > 0) {
          const ingredientsA = recipe.recipe_ingredients
            .filter(ing => ingredientsListA.has(ing.id))
            .map(createIngredientPayload);

          const responseA = await fetch('/api/grocery/push-ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grocery_list_id: selectedGroceryList,
              ingredients: ingredientsA,
            }),
          });

          if (!responseA.ok) {
            const data = await responseA.json();
            throw new Error(data.error || 'Failed to push to first list');
          }
        }

        // Push ingredients for List B
        if (ingredientsListB.size > 0) {
          const ingredientsB = recipe.recipe_ingredients
            .filter(ing => ingredientsListB.has(ing.id))
            .map(createIngredientPayload);

          const responseB = await fetch('/api/grocery/push-ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grocery_list_id: secondGroceryList,
              ingredients: ingredientsB,
            }),
          });

          if (!responseB.ok) {
            const data = await responseB.json();
            throw new Error(data.error || 'Failed to push to second list');
          }
        }
      } else {
        // Single-List Mode: Push to one list (current behavior)
        const ingredients = recipe.recipe_ingredients
          .filter(ing => selectedIngredients.has(ing.id))
          .map(createIngredientPayload);

        const response = await fetch('/api/grocery/push-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grocery_list_id: selectedGroceryList,
            ingredients,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to push ingredients');
        }
      }

      // Success! Show success message
      setPushSuccess(true);
      setTimeout(() => {
        setShowPushModal(false);
        setPushSuccess(false);
      }, 3000); // 3 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push ingredients');
    } finally {
      setPushing(false);
    }
  };

  const renderStars = (rating: number | null) => {
    const displayRating = rating || 0; // Show empty stars if no rating

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= displayRating ? 'var(--theme-primary)' : 'none'}
            stroke={star <= displayRating ? 'var(--theme-primary)' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  const scaleQuantity = (originalQuantity: number, baseServings: number, targetServings: number): string => {
    // Defensive check: if any value is invalid, return original quantity
    if (originalQuantity == null || baseServings == null || targetServings == null ||
        isNaN(originalQuantity) || isNaN(baseServings) || isNaN(targetServings) ||
        baseServings === 0 || targetServings === 0) {
      return originalQuantity?.toString() || '0';
    }

    const scaled = (originalQuantity * targetServings) / baseServings;

    // Check if scaled is NaN
    if (isNaN(scaled)) {
      return originalQuantity.toString();
    }

    // Format to reasonable precision
    if (scaled % 1 === 0) {
      return scaled.toString();
    } else if (scaled < 1) {
      // For fractions, try to display as common fractions
      const fraction = scaled;
      if (Math.abs(fraction - 0.125) < 0.01) return '⅛';
      if (Math.abs(fraction - 0.25) < 0.01) return '¼';
      if (Math.abs(fraction - 0.333) < 0.01) return '⅓';
      if (Math.abs(fraction - 0.5) < 0.01) return '½';
      if (Math.abs(fraction - 0.667) < 0.01) return '⅔';
      if (Math.abs(fraction - 0.75) < 0.01) return '¾';
      if (Math.abs(fraction - 0.875) < 0.01) return '⅞';
      return scaled.toFixed(2);
    } else {
      // For numbers > 1, show up to 2 decimal places
      return scaled.toFixed(2).replace(/\.?0+$/, '');
    }
  };

  const getEffectiveServings = () => {
    return adjustedServings !== null ? adjustedServings : baseServings;
  };

  const groupIngredientsBySection = () => {
    if (!recipe) return [];

    const groups: Array<{ section: string | null; ingredients: RecipeIngredient[] }> = [];
    let currentSection: string | null = null;
    let currentIngredients: RecipeIngredient[] = [];

    for (const ingredient of recipe.recipe_ingredients) {
      if (ingredient.is_header) {
        // Save previous group if it has ingredients
        if (currentIngredients.length > 0) {
          groups.push({ section: currentSection, ingredients: currentIngredients });
        }
        // Start new section
        currentSection = ingredient.display_name;
        currentIngredients = [];
      } else {
        // Add ingredient to current section
        currentIngredients.push(ingredient);
      }
    }

    // Add final group
    if (currentIngredients.length > 0 || groups.length === 0) {
      groups.push({ section: currentSection, ingredients: currentIngredients });
    }

    return groups;
  };

  const handleOpenServingSizeModal = () => {
    setShowServingSizeModal(true);
  };

  const handleAdjustServings = (delta: number) => {
    const current = adjustedServings !== null ? adjustedServings : baseServings;
    const newValue = Math.max(1, current + delta);
    setAdjustedServings(newValue);
  };

  const handleCancelServings = () => {
    // Revert changes and close modal
    setAdjustedServings(null);
    setShowServingSizeModal(false);
  };

  const handleSaveServings = async () => {
    if (!recipe || adjustedServings === null) return;

    try {
      // Calculate scaling ratio
      const scalingRatio = adjustedServings / baseServings;

      // Scale all ingredient quantities (both min and max for ranges)
      const scaledIngredients = recipe.recipe_ingredients.map((ing) => ({
        name: ing.display_name,
        quantity_min: ing.quantity_min * scalingRatio,
        quantity_max: ing.quantity_max ? ing.quantity_max * scalingRatio : null,
        unit: ing.unit,
        prep_state: ing.prep_state || undefined,
      }));

      // Update recipe with new serving size and scaled ingredients
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serving_size: adjustedServings.toString(),
          ingredients: scaledIngredients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update serving size');
      }

      // Get updated recipe data from response
      const updatedRecipe = await response.json();

      // Update local state (instant visual update)
      setRecipe(updatedRecipe);
      setBaseServings(adjustedServings);
      setAdjustedServings(null);
      setShowServingSizeModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update serving size');
      console.error('Save servings error:', err);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Recipe">
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-600">Loading recipe...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !recipe) {
    return (
      <AuthenticatedLayout title="Recipe">
        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error || 'Recipe not found'}</p>
            <button
              onClick={() => router.push('/recipes')}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Back to Recipes
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="">
      <div style={{ backgroundColor: 'white', paddingBottom: '80px' }}>
        {/* Hero Image with Overlay */}
        <div style={{ position: 'relative', height: '320px', width: '100%', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #fed7aa, #fdba74)'
          }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>No image</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          zIndex: 10
        }} />

        {/* Action buttons on hero */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          zIndex: 20
        }}>
          <button
            onClick={() => router.push('/recipes')}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '50%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={22} style={{ color: '#1f2937' }} />
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: recipe.title,
                      text: `Check out this recipe: ${recipe.title}`,
                      url: window.location.href,
                    });
                  } catch (err) {
                    // User cancelled or share failed
                    console.log('Share cancelled or failed:', err);
                  }
                } else {
                  // Fallback: copy URL to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  alert('Recipe link copied to clipboard!');
                }
              }}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Share2 size={18} style={{ color: '#1f2937' }} />
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>Share</span>
            </button>
            <button
              onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit size={18} style={{ color: '#1f2937' }} />
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937' }}>Edit</span>
            </button>
          </div>
        </div>

        {/* Title and tags overlay on hero */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: 0,
          right: 0,
          paddingLeft: '16px',
          paddingRight: '16px',
          zIndex: 20
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '2px',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)'
          }}>
            {decodeHTML(recipe.title)}
          </h1>
          {recipe.tags.length > 0 && (
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '14px',
              margin: 0,
              marginTop: '2px',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)'
            }}>
              {recipe.tags.join(' • ')}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingBottom: '80px' }}>
        {/* Metadata Section */}
        {(recipe.rating !== undefined || recipe.serving_size || recipe.prep_time || recipe.cook_time) && (
          <div style={{ paddingTop: '16px', paddingBottom: '16px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '16px', alignItems: 'center' }}>
            {recipe.rating !== undefined && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Rating</span>
                {renderStars(recipe.rating)}
              </>
            )}
            {recipe.serving_size && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Serving size</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#111827' }}>
                    {adjustedServings !== null ? adjustedServings : recipe.serving_size}
                  </span>
                  <button
                    onClick={handleOpenServingSizeModal}
                    style={{
                      color: '#3b82f6',
                      background: 'none',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: '400'
                    }}
                  >
                    Adjust +/-
                  </button>
                </div>
              </>
            )}
            {recipe.prep_time && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Prep time</span>
                <span style={{ color: '#111827' }}>{recipe.prep_time}</span>
              </>
            )}
            {recipe.cook_time && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Cook time</span>
                <span style={{ color: '#111827' }}>{recipe.cook_time}</span>
              </>
            )}
          </div>
        )}

        {/* Notes Section (if any) */}
        {recipe.notes && (
          <div style={{ paddingTop: '6px', paddingBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-primary)', marginBottom: '12px' }}>Notes</h2>
            <div style={{ color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontStyle: 'italic', fontSize: '14px' }}>
              {decodeHTML(recipe.notes)}
            </div>
          </div>
        )}

        {/* Ingredients Section */}
        <div className="py-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-primary)', margin: 0 }}>Ingredients</h2>
            {recipe.source && (recipe.source.startsWith('http://') || recipe.source.startsWith('https://')) && (
              <a
                href={recipe.source}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                View Original
              </a>
            )}
          </div>
          {groupIngredientsBySection().map((group, groupIndex) => (
            <div key={groupIndex} style={{ marginBottom: group.section ? '24px' : '0' }}>
              {group.section && (
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  marginTop: groupIndex > 0 ? '8px' : '0'
                }}>
                  {group.section}
                </h3>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.ingredients.map((ingredient) => {
              const effectiveServings = getEffectiveServings();
              // Calculate scaled numeric values first
              const scaledMin = adjustedServings !== null
                ? (ingredient.quantity_min * effectiveServings) / baseServings
                : ingredient.quantity_min;
              const scaledMax = ingredient.quantity_max && adjustedServings !== null
                ? (ingredient.quantity_max * effectiveServings) / baseServings
                : ingredient.quantity_max;

              // Format quantities for display (handles fractions)
              const displayQuantity = adjustedServings !== null
                ? formatQuantity(scaledMin, scaledMax)
                : formatQuantity(ingredient.quantity_min, ingredient.quantity_max);

              return (
                <p key={ingredient.id} style={{ color: '#111827', lineHeight: '1.5', fontSize: '16px', margin: 0 }}>
                  <strong style={{ fontWeight: '600' }}>
                    {displayQuantity} {ingredient.unit}
                  </strong>{' '}
                  {decodeHTML(ingredient.display_name)}
                  {ingredient.prep_state && `, ${decodeHTML(ingredient.prep_state)}`}
                  {ingredient.optional && (
                    <span style={{ color: '#6b7280', marginLeft: '4px' }}>(optional)</span>
                  )}
                </p>
              );
            })}
              </div>
            </div>
          ))}
        </div>

        {/* Directions Section */}
        {recipe.instructions && (
          <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--theme-primary)', marginBottom: '16px' }}>Directions</h2>
            <div style={{ color: '#111827', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {decodeHTML(recipe.instructions)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '24px', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <button
            onClick={() => router.push(`/planner?add=true&recipeId=${recipe.id}`)}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              color: '#111827',
              cursor: 'pointer',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <Calendar size={20} style={{ color: '#6b7280' }} />
            Add to Planner
          </button>
          <button
            onClick={handleOpenPushModal}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              color: '#111827',
              cursor: 'pointer',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <ShoppingCart size={20} style={{ color: '#6b7280' }} />
            Push Ingredients to Grocery List
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={20} style={{ color: '#dc2626' }} />
            Delete Recipe
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '0 16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Delete Recipe?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: deleting ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: deleting ? 0.5 : 1
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Push Ingredients Modal */}
        {showPushModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '0 16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '450px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              {pushSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>✓</div>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: '12px'
                  }}>
                    Ingredients added to grocery list!
                  </p>
                  <button
                    onClick={() => {
                      router.push(`/groceries?list=${selectedGroceryList}`);
                      setShowPushModal(false);
                      setPushSuccess(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--theme-primary)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    View List
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    Push Ingredients to Grocery List
                  </h3>

                  {groceryLists.length === 0 ? (
                    <p style={{
                      fontSize: '14px',
                      color: '#9ca3af',
                      marginBottom: '24px'
                    }}>
                      No grocery lists available. Create one first.
                    </p>
                  ) : (
                    <>
                      {/* List selector(s) */}
                      {!secondGroceryList ? (
                        // Single-list mode
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                          }}>
                            Grocery List
                          </label>
                          <select
                            value={selectedGroceryList || ''}
                            onChange={(e) => setSelectedGroceryList(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '14px',
                              outline: 'none',
                              marginBottom: '8px'
                            }}
                          >
                            {groceryLists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                          {groceryLists.length > 1 && (
                            <button
                              onClick={() => {
                                // Set second list to first available list that's not the primary
                                const secondList = groceryLists.find(l => l.id !== selectedGroceryList);
                                if (secondList) setSecondGroceryList(secondList.id);
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                color: 'var(--theme-primary)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--theme-primary)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              + Add second list
                            </button>
                          )}
                        </div>
                      ) : (
                        // Two-list mode
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px'
                              }}>
                                List A
                              </label>
                              <select
                                value={selectedGroceryList || ''}
                                onChange={(e) => {
                                  setSelectedGroceryList(e.target.value);
                                  // If List B is same as new List A, swap them
                                  if (e.target.value === secondGroceryList) {
                                    setSecondGroceryList(selectedGroceryList);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  outline: 'none'
                                }}
                              >
                                {groceryLists.map((list) => (
                                  <option key={list.id} value={list.id}>
                                    {list.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px'
                              }}>
                                List B
                              </label>
                              <select
                                value={secondGroceryList || ''}
                                onChange={(e) => {
                                  setSecondGroceryList(e.target.value);
                                  // If List A is same as new List B, swap them
                                  if (e.target.value === selectedGroceryList) {
                                    setSelectedGroceryList(secondGroceryList);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  outline: 'none'
                                }}
                              >
                                {groceryLists.map((list) => (
                                  <option key={list.id} value={list.id}>
                                    {list.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => setSecondGroceryList(null)}
                            style={{
                              marginTop: '8px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              color: '#6b7280',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Use single list
                          </button>
                        </div>
                      )}

                      {/* Ingredients selection */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Select Ingredients
                        </label>
                        <div style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                          maxHeight: '250px',
                          overflow: 'auto'
                        }}>
                          {!secondGroceryList ? (
                            // Single-list mode: one checkbox column
                            <>
                              {recipe.recipe_ingredients.filter(ing => !ing.is_header).map((ingredient) => (
                                <label
                                  key={ingredient.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedIngredients.has(ingredient.id)}
                                    onChange={() => toggleIngredient(ingredient.id)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      accentColor: '#3b82f6'
                                    }}
                                  />
                                  <span style={{ color: '#111827' }}>
                                    <strong>{formatQuantity(ingredient.quantity_min, ingredient.quantity_max)} {ingredient.unit}</strong> {decodeHTML(ingredient.display_name)}
                                  </span>
                                </label>
                              ))}
                            </>
                          ) : (
                            // Two-list mode: two checkbox columns (exclusive)
                            <>
                              {/* Column headers */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 40px 1fr',
                                gap: '8px',
                                paddingBottom: '8px',
                                marginBottom: '8px',
                                borderBottom: '1px solid #e5e7eb'
                              }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>A</div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>B</div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Ingredient</div>
                              </div>
                              {recipe.recipe_ingredients.filter(ing => !ing.is_header).map((ingredient) => (
                                <div
                                  key={ingredient.id}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '40px 40px 1fr',
                                    gap: '8px',
                                    alignItems: 'center',
                                    padding: '6px 0',
                                    fontSize: '14px'
                                  }}
                                >
                                  {/* List A checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={ingredientsListA.has(ingredient.id)}
                                    onChange={() => toggleIngredientListA(ingredient.id)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      cursor: 'pointer',
                                      justifySelf: 'center',
                                      flexShrink: 0,
                                      accentColor: '#3b82f6'
                                    }}
                                  />
                                  {/* List B checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={ingredientsListB.has(ingredient.id)}
                                    onChange={() => toggleIngredientListB(ingredient.id)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      cursor: 'pointer',
                                      justifySelf: 'center',
                                      flexShrink: 0,
                                      accentColor: '#3b82f6'
                                    }}
                                  />
                                  {/* Ingredient name */}
                                  <span style={{ color: '#111827' }}>
                                    <strong>{formatQuantity(ingredient.quantity_min, ingredient.quantity_max)} {ingredient.unit}</strong> {decodeHTML(ingredient.display_name)}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowPushModal(false)}
                      disabled={pushing}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: pushing ? 0.5 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePushIngredients}
                      disabled={pushing || groceryLists.length === 0 || (
                        secondGroceryList
                          ? (ingredientsListA.size === 0 && ingredientsListB.size === 0)
                          : selectedIngredients.size === 0
                      )}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: (pushing || groceryLists.length === 0 || (
                          secondGroceryList
                            ? (ingredientsListA.size === 0 && ingredientsListB.size === 0)
                            : selectedIngredients.size === 0
                        )) ? '#e5e7eb' : 'var(--theme-primary)',
                        color: (pushing || groceryLists.length === 0 || (
                          secondGroceryList
                            ? (ingredientsListA.size === 0 && ingredientsListB.size === 0)
                            : selectedIngredients.size === 0
                        )) ? '#9ca3af' : 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (pushing || groceryLists.length === 0 || (
                          secondGroceryList
                            ? (ingredientsListA.size === 0 && ingredientsListB.size === 0)
                            : selectedIngredients.size === 0
                        )) ? 'not-allowed' : 'pointer',
                        opacity: (pushing || groceryLists.length === 0 || (
                          secondGroceryList
                            ? (ingredientsListA.size === 0 && ingredientsListB.size === 0)
                            : selectedIngredients.size === 0
                        )) ? 0.5 : 1
                      }}
                    >
                      {pushing ? 'Pushing...' : (
                        secondGroceryList
                          ? `Push (${ingredientsListA.size} + ${ingredientsListB.size})`
                          : `Push ${selectedIngredients.size} ingredient${selectedIngredients.size !== 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Serving Size Adjustment Modal */}
        {showServingSizeModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              zIndex: 100,
              padding: '80px 16px 16px',
              overflowY: 'auto'
            }}
            onClick={handleCancelServings}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Adjust Serving Size
              </h3>

              {/* Serving size input with +/- buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <input
                  type="number"
                  value={adjustedServings !== null ? adjustedServings : baseServings}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setAdjustedServings(val);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAdjustServings(-1)}
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleAdjustServings(1)}
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelServings}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    fontSize: '16px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveServings}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </AuthenticatedLayout>
  );
}
