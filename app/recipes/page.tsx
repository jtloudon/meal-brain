'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Plus, Search, Star } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  tags: string[];
  rating: number | null;
  created_at: string;
  notes?: string | null;
  instructions?: string | null;
  image_url?: string | null;
  meal_type?: string | null;
  recipe_ingredients?: Array<{ display_name: string }>;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSearch, setShowSearch] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [search, minRating, selectedCategory]);

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) return;

    try {
      setImporting(true);
      setError(null);

      // Call import API
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import recipe');
      }

      const { recipe: importedRecipe } = await response.json();

      // Parse ISO 8601 duration format (PT20M -> "20 min")
      const parseDuration = (duration: string | null): string | null => {
        if (!duration) return null;
        const match = duration.match(/PT(\d+)M/);
        if (match) return `${match[1]} min`;
        const hourMatch = duration.match(/PT(\d+)H(\d+)?M?/);
        if (hourMatch) {
          const hours = hourMatch[1];
          const mins = hourMatch[2];
          return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
        }
        return duration; // Return as-is if can't parse
      };

      // Format instructions with numbering
      const formatInstructions = (instructions: string): string => {
        if (!instructions) return '';
        const lines = instructions.split('\n').filter(line => line.trim());
        return lines.map((line, i) => `${i + 1}. ${line.replace(/^\d+\.\s*/, '')}`).join('\n');
      };

      // Parse ingredients using flexible parser with fallback
      const { parseIngredientLine } = await import('@/lib/utils/parse-ingredients');
      const ingredients: any[] = [];

      console.log('[Import] Raw ingredients from backend:', importedRecipe.ingredients);

      for (const ing of importedRecipe.ingredients) {
        let parsed = parseIngredientLine(ing);
        console.log('[Import] Parsing:', ing, '→', parsed);

        if (parsed) {
          ingredients.push({
            name: parsed.name,
            quantity: parsed.quantity,
            unit: parsed.unit,
            prep_state: parsed.prep_state,
          });
        } else {
          // Fallback: Try to extract basic info with looser parsing
          console.warn('[Import] Standard parsing failed, using fallback for:', ing);

          // Try to extract quantity and unit more flexibly
          const flexMatch = ing.match(/^([\d\s.\/½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*(cup|tbsp|tsp|lb|oz|g|kg|ml|l|whole|clove|can|package|slice|pound|ounce|tablespoon|teaspoon|gram|kilogram)s?\s+(.+)$/i);

          if (flexMatch) {
            const [, qty, unit, name] = flexMatch;
            let quantity = 1;

            if (qty) {
              // Parse quantity (handle fractions and mixed numbers)
              const qtyTrimmed = qty.trim().replace(/\s+/g, ' ');
              if (qtyTrimmed.includes('½')) quantity = parseFloat(qtyTrimmed.replace('½', '.5'));
              else if (qtyTrimmed.includes('¼')) quantity = parseFloat(qtyTrimmed.replace('¼', '.25'));
              else if (qtyTrimmed.includes('¾')) quantity = parseFloat(qtyTrimmed.replace('¾', '.75'));
              else if (qtyTrimmed.includes('⅓')) quantity = parseFloat(qtyTrimmed.replace('⅓', '.333'));
              else if (qtyTrimmed.includes('⅔')) quantity = parseFloat(qtyTrimmed.replace('⅔', '.667'));
              else quantity = parseFloat(qtyTrimmed.split(' ')[0]) + (qtyTrimmed.split(' ')[1] ? parseFloat(qtyTrimmed.split(' ')[1]) : 0);
            }

            // Normalize unit
            let normalizedUnit = unit.toLowerCase();
            if (normalizedUnit === 'tablespoons' || normalizedUnit === 'tablespoon') normalizedUnit = 'tbsp';
            else if (normalizedUnit === 'teaspoons' || normalizedUnit === 'teaspoon') normalizedUnit = 'tsp';
            else if (normalizedUnit === 'pounds' || normalizedUnit === 'pound') normalizedUnit = 'lb';
            else if (normalizedUnit === 'ounces' || normalizedUnit === 'ounce') normalizedUnit = 'oz';
            else if (normalizedUnit === 'grams' || normalizedUnit === 'gram') normalizedUnit = 'g';
            else if (normalizedUnit === 'kilograms' || normalizedUnit === 'kilogram') normalizedUnit = 'kg';
            else if (normalizedUnit.endsWith('s')) normalizedUnit = normalizedUnit.slice(0, -1);

            ingredients.push({
              name: name.trim(),
              quantity: isNaN(quantity) ? 1 : quantity,
              unit: normalizedUnit,
            });
          } else {
            // Last resort: treat whole thing as ingredient with default values
            ingredients.push({
              name: ing.trim(),
              quantity: 1,
              unit: 'whole',
            });
          }
        }
      }

      console.log('[Import] Final parsed ingredients:', ingredients);

      // Create the recipe
      const createResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: importedRecipe.title,
          ingredients,
          instructions: formatInstructions(importedRecipe.instructions),
          notes: importedRecipe.notes,
          rating: null,
          tags: [],
          prep_time: parseDuration(importedRecipe.prep_time),
          cook_time: parseDuration(importedRecipe.cook_time),
          serving_size: importedRecipe.serving_size,
          image_url: importedRecipe.image_url,
          source: importedRecipe.source,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create recipe');
      }

      // Success! Refresh recipes and close modal
      await fetchRecipes();
      setShowImportModal(false);
      setImportUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipe');
    } finally {
      setImporting(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/recipes?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      console.log('[Frontend] API response:', data);
      console.log('[Frontend] First recipe:', data.recipes?.[0]);

      let recipes = data.recipes || [];

      // Client-side filtering (search text + rating + category)
      // Note: We fetch all recipes and filter client-side for simplicity
      // and to enable case-insensitive search across all content
      if (search || minRating !== null || selectedCategory !== 'All') {
        recipes = recipes.filter((recipe: Recipe) => {
          // Search filter
          let matchesSearch = true;
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesTitle = recipe.title.toLowerCase().includes(searchLower);
            const matchesTag = recipe.tags.some(tag =>
              tag.toLowerCase().includes(searchLower)
            );
            const matchesNotes = recipe.notes?.toLowerCase().includes(searchLower) || false;
            const matchesInstructions = recipe.instructions?.toLowerCase().includes(searchLower) || false;
            const matchesIngredient = recipe.recipe_ingredients?.some(ing =>
              ing.display_name.toLowerCase().includes(searchLower)
            ) || false;

            matchesSearch = matchesTitle || matchesTag || matchesNotes || matchesInstructions || matchesIngredient;
          }

          // Rating filter (minimum rating)
          let matchesRating = true;
          if (minRating !== null) {
            matchesRating = recipe.rating !== null && recipe.rating >= minRating;
          }

          // Category filter (meal type)
          let matchesCategory = true;
          if (selectedCategory !== 'All') {
            matchesCategory = recipe.meal_type?.toLowerCase() === selectedCategory.toLowerCase();
          }

          return matchesSearch && matchesRating && matchesCategory;
        });
      }

      setRecipes(recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? '#f97316' : 'none'}
            stroke={star <= rating ? '#f97316' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  // Fixed meal type categories
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <AuthenticatedLayout
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search size={22} style={{ color: '#f97316' }} />
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#f97316',
              fontWeight: '500'
            }}
          >
            Import
          </button>
          <button
            onClick={() => router.push('/recipes/new')}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={24} style={{ color: '#f97316' }} />
          </button>
        </div>
      }
    >
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
        {/* Search Bar - Collapsible */}
        {showSearch && (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              autoFocus
            />
          </div>
        )}

        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '12px',
          justifyContent: 'space-between'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '6px 10px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: selectedCategory === category ? '#f97316' : '#f3f4f6',
                color: selectedCategory === category ? 'white' : '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                minWidth: 0
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Rating Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px'
        }}>
          {[null, 3, 4, 5].map((rating) => (
            <button
              key={rating ?? 'all'}
              onClick={() => setMinRating(rating)}
              style={{
                padding: '6px 10px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: minRating === rating ? '#f97316' : '#f3f4f6',
                color: minRating === rating ? 'white' : '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {rating ? (
                <>
                  <Star size={14} fill={minRating === rating ? 'white' : '#f97316'} stroke={minRating === rating ? 'white' : '#f97316'} strokeWidth={2} />
                  <span>{rating}+</span>
                </>
              ) : (
                'All Ratings'
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-600">Loading recipes...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-sm">
              <div className="mb-4 text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'No recipes found' : 'No recipes yet'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {search
                  ? 'Try adjusting your search'
                  : 'Start building your recipe collection'}
              </p>
              {!search && (
                <button
                  onClick={() => router.push('/recipes/new')}
                  className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Recipe
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recipe List */}
        {!loading && !error && recipes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: '12px'
                }}
              >
                {/* Recipe Image - Square thumbnail on left */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6'
                }}>
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '12px'
                    }}>
                      No image
                    </div>
                  )}
                </div>

                {/* Recipe Info - Title and tags on right */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#f97316',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {recipe.title}
                  </h3>
                  {/* Star Rating */}
                  {renderStars(recipe.rating)}
                  {recipe.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '6px'
                    }}>
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
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
              marginBottom: '16px'
            }}>
              Import Recipe from URL
            </h3>
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '16px',
                outline: 'none'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleImportFromUrl()}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl('');
                  setError(null);
                }}
                disabled={importing}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: importing ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportFromUrl}
                disabled={importing || !importUrl.trim()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: (importing || !importUrl.trim()) ? '#e5e7eb' : '#f97316',
                  color: (importing || !importUrl.trim()) ? '#9ca3af' : 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (importing || !importUrl.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
