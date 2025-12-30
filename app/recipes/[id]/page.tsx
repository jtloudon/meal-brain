'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Calendar, ShoppingCart, Star, Share2, Edit, Trash2 } from 'lucide-react';

interface RecipeIngredient {
  id: string;
  ingredient_id: string | null;
  display_name: string;
  quantity: number;
  unit: string;
  prep_state: string | null;
  optional: boolean;
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
  const [pushing, setPushing] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [pushSuccess, setPushSuccess] = useState(false);

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
      const response = await fetch('/api/grocery/lists');
      if (!response.ok) throw new Error('Failed to fetch grocery lists');
      const data = await response.json();
      setGroceryLists(data.lists || []);
      if (data.lists && data.lists.length > 0) {
        setSelectedGroceryList(data.lists[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grocery lists');
    }
  };

  const handleOpenPushModal = () => {
    // Initialize all ingredients as selected
    if (recipe) {
      const allIngredientIds = new Set(recipe.recipe_ingredients.map(ing => ing.id));
      setSelectedIngredients(allIngredientIds);
    }
    setShowPushModal(true);
    setPushSuccess(false);
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

  const handlePushIngredients = async () => {
    if (!recipe || !selectedGroceryList) return;

    try {
      setPushing(true);
      setError(null);

      // Only push selected ingredients
      const ingredients = recipe.recipe_ingredients
        .filter(ing => selectedIngredients.has(ing.id))
        .map((ing) => ({
          ingredient_id: ing.ingredient_id || null,
          display_name: ing.display_name,
          quantity: ing.quantity,
          unit: ing.unit,
          ...(ing.prep_state && { prep_state: ing.prep_state }),
          source_recipe_id: recipe.id,
        }));

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

      // Success! Show success message
      setPushSuccess(true);
      setTimeout(() => {
        setShowPushModal(false);
        setPushSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push ingredients');
    } finally {
      setPushing(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#f97316' : 'none'}
            stroke={star <= rating ? '#f97316' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
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
    <div style={{ minHeight: '100vh', backgroundColor: 'white', paddingBottom: '80px' }}>
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
            {recipe.title}
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
        {(recipe.source || recipe.serving_size || recipe.prep_time || recipe.cook_time) && (
          <div style={{ paddingTop: '16px', paddingBottom: '16px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '16px' }}>
            {recipe.source && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Source</span>
                <span style={{ color: '#111827' }}>{recipe.source}</span>
              </>
            )}
            {recipe.serving_size && (
              <>
                <span style={{ color: '#9ca3af', textAlign: 'right' }}>Serving size</span>
                <span style={{ color: '#111827' }}>{recipe.serving_size}</span>
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

        {/* Ingredients Section */}
        <div className="py-6">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316', marginBottom: '16px' }}>Ingredients</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {recipe.recipe_ingredients.map((ingredient) => (
              <p key={ingredient.id} style={{ color: '#111827', lineHeight: '1.5', fontSize: '16px', margin: 0 }}>
                <strong style={{ fontWeight: '600' }}>
                  {ingredient.quantity} {ingredient.unit}
                </strong>{' '}
                {ingredient.display_name}
                {ingredient.prep_state && `, ${ingredient.prep_state}`}
                {ingredient.optional && (
                  <span style={{ color: '#6b7280', marginLeft: '4px' }}>(optional)</span>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Directions Section */}
        {recipe.instructions && (
          <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316', marginBottom: '16px' }}>Directions</h2>
            <div style={{ color: '#111827', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {recipe.instructions}
            </div>
          </div>
        )}

        {/* Notes Section (if any) */}
        {recipe.notes && (
          <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316', marginBottom: '16px' }}>Notes</h2>
            <div style={{ color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontStyle: 'italic' }}>
              {recipe.notes}
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
                    color: '#059669'
                  }}>
                    Ingredients added to grocery list!
                  </p>
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
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {recipe.recipe_ingredients.map((ingredient) => (
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
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ color: '#111827' }}>
                                <strong>{ingredient.quantity} {ingredient.unit}</strong> {ingredient.display_name}
                              </span>
                            </label>
                          ))}
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
                      disabled={pushing || groceryLists.length === 0 || selectedIngredients.size === 0}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: (pushing || groceryLists.length === 0 || selectedIngredients.size === 0) ? '#e5e7eb' : '#f97316',
                        color: (pushing || groceryLists.length === 0 || selectedIngredients.size === 0) ? '#9ca3af' : 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (pushing || groceryLists.length === 0 || selectedIngredients.size === 0) ? 'not-allowed' : 'pointer',
                        opacity: (pushing || groceryLists.length === 0 || selectedIngredients.size === 0) ? 0.5 : 1
                      }}
                    >
                      {pushing ? 'Pushing...' : `Push ${selectedIngredients.size} ingredient${selectedIngredients.size !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
