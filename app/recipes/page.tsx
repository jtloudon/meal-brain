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
  prep_time?: string | null;
  cook_time?: string | null;
  recipe_ingredients?: Array<{ display_name: string }>;
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSearch, setShowSearch] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    fetchRecipes();
  }, [search, minRating, selectedCategory, maxTime]);

  const handleImportFromFile = async () => {
    if (!importFile) return;

    try {
      setImporting(true);
      setError(null);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix (data:image/png;base64,...)
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(importFile);

      const base64Data = await base64Promise;

      // Call import-file API
      const response = await fetch('/api/recipes/import-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: importFile.type,
          fileName: importFile.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import recipe from file');
      }

      const { recipe: importedRecipe } = await response.json();

      // Use same parsing logic as URL import
      await processImportedRecipe(importedRecipe);

      // Success - close modal
      setShowImportModal(false);
      setImportFile(null);
      setError(null);
      fetchRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import recipe from file');
      console.error('Import from file error:', err);
    } finally {
      setImporting(false);
    }
  };

  const processImportedRecipe = async (importedRecipe: any) => {
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
          quantity_min: parsed.quantity_min,
          quantity_max: parsed.quantity_max,
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
            quantity_min: isNaN(quantity) ? 1 : quantity,
            quantity_max: null,
            unit: normalizedUnit,
          });
        } else {
          // Last resort: treat whole thing as ingredient
          // BUT don't add "1 whole" prefix if ingredient already starts with a number
          const startsWithNumber = /^\d/.test(ing.trim());

          if (startsWithNumber) {
            // Already has a quantity, just parse it as-is
            // Try to extract first number as quantity
            const match = ing.trim().match(/^([\d.\/]+)\s*(.+)$/);
            if (match) {
              const [, qty, rest] = match;
              let quantity = parseFloat(qty);
              if (qty.includes('/')) {
                const [num, den] = qty.split('/');
                quantity = parseFloat(num) / parseFloat(den);
              }
              ingredients.push({
                name: rest.trim(),
                quantity_min: isNaN(quantity) ? 1 : quantity,
                quantity_max: null,
                unit: 'whole',
              });
            } else {
              ingredients.push({
                name: ing.trim(),
                quantity_min: 1,
                quantity_max: null,
                unit: 'whole',
              });
            }
          } else {
            // Doesn't start with number, add default 1 whole
            ingredients.push({
              name: ing.trim(),
              quantity_min: 1,
              quantity_max: null,
              unit: 'whole',
            });
          }
        }
      }
    }

    console.log('[Import] Final parsed ingredients:', ingredients);

    // Navigate to create page with pre-filled data
    const queryParams = new URLSearchParams({
      title: importedRecipe.title || '',
      ingredients: JSON.stringify(ingredients),
      instructions: formatInstructions(importedRecipe.instructions || ''),
      notes: importedRecipe.notes || '',
      tags: JSON.stringify(importedRecipe.tags || []),
      prepTime: parseDuration(importedRecipe.prepTime) || importedRecipe.prep_time || '',
      cookTime: parseDuration(importedRecipe.cookTime) || importedRecipe.cook_time || '',
      servingSize: importedRecipe.servingSize || importedRecipe.serving_size || '',
      imageUrl: importedRecipe.imageUrl || importedRecipe.image_url || '',
      source: importedRecipe.source || '',
    });

    router.push(`/recipes/new?${queryParams.toString()}`);
  };

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

      // Use same parsing logic as file import
      await processImportedRecipe(importedRecipe);

      // Success - close modal
      setShowImportModal(false);
      setImportUrl('');
      setError(null);
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

      // Client-side filtering (search text + rating + category + time)
      // Note: We fetch all recipes and filter client-side for simplicity
      // and to enable case-insensitive search across all content
      if (search || minRating !== null || selectedCategory !== 'All' || maxTime !== null) {
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

          // Time filter (maximum total time in minutes)
          let matchesTime = true;
          if (maxTime !== null) {
            const parseTime = (timeStr: string | null): number => {
              if (!timeStr) return 0;
              let totalMins = 0;
              const hourMatch = timeStr.match(/(\d+)\s*h(?:our|r)?s?/i);
              const minMatch = timeStr.match(/(\d+)\s*m(?:in|inute)?s?/i);
              if (hourMatch) totalMins += parseInt(hourMatch[1]) * 60;
              if (minMatch) totalMins += parseInt(minMatch[1]);
              return totalMins;
            };

            const totalTime = parseTime(recipe.prep_time || null) + parseTime(recipe.cook_time || null);
            matchesTime = totalTime > 0 && totalTime <= maxTime;
          }

          return matchesSearch && matchesRating && matchesCategory && matchesTime;
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
    const displayRating = rating || 0; // Show empty stars if no rating

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= displayRating ? '#f97316' : 'none'}
            stroke={star <= displayRating ? '#f97316' : '#d1d5db'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  // Calculate total time from prep and cook times
  const calculateTotalTime = (prep_time: string | null, cook_time: string | null): string | null => {
    if (!prep_time && !cook_time) return null;

    // Parse time strings like "10 mins", "1 hr", "30 min", "1 hr 30 min", "10-12 hours"
    const parseTime = (timeStr: string | null): number => {
      if (!timeStr) return 0;

      let totalMins = 0;

      // Handle ranges like "10-12 hours" by taking the average
      const rangeMatch = timeStr.match(/([\d.]+)-([\d.]+)\s*h(?:our|r)?s?/i);
      if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        totalMins += avg * 60;
      } else {
        const hourMatch = timeStr.match(/([\d.]+)\s*h(?:our|r)?s?/i);
        if (hourMatch) totalMins += parseFloat(hourMatch[1]) * 60;
      }

      const minMatch = timeStr.match(/([\d.]+)\s*m(?:in|inute)?s?/i);
      if (minMatch) totalMins += parseFloat(minMatch[1]);

      return totalMins;
    };

    const totalMins = parseTime(prep_time) + parseTime(cook_time);
    if (totalMins === 0) return null;

    // Format nicely
    if (totalMins < 60) {
      return `${totalMins} min`;
    } else {
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Fixed meal type categories
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <AuthenticatedLayout
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {!showSearch ? (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                padding: '6px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Search size={22} style={{ color: '#f97316' }} />
            </button>
          ) : (
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  padding: '6px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Search size={22} style={{ color: '#f97316' }} />
              </button>
              <input
                type="text"
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>
      }
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              fontWeight: '500',
              flexShrink: 0
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
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Plus size={24} style={{ color: '#f97316' }} />
          </button>
        </div>
      }
    >
      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '8px',
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
          marginBottom: '8px'
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

        {/* Time Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {[null, 30, 45, 60].map((time) => (
            <button
              key={time ?? 'all'}
              onClick={() => setMaxTime(time)}
              style={{
                padding: '6px 10px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: maxTime === time ? '#f97316' : '#f3f4f6',
                color: maxTime === time ? 'white' : '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {time ? `≤ ${time} min` : 'Any Time'}
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
                  {/* Star Rating and Total Time */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {renderStars(recipe.rating)}
                    {calculateTotalTime(recipe.prep_time || null, recipe.cook_time || null) && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        🕐 {calculateTotalTime(recipe.prep_time || null, recipe.cook_time || null)}
                      </span>
                    )}
                  </div>
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
              Import Recipe
            </h3>

            {/* URL Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                From URL:
              </label>
              <input
                type="url"
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  if (e.target.value) setImportFile(null); // Clear file if URL is entered
                }}
                placeholder="https://example.com/recipe"
                disabled={!!importFile}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  opacity: importFile ? 0.5 : 1
                }}
                onKeyPress={(e) => e.key === 'Enter' && !importFile && handleImportFromUrl()}
              />
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* File Upload */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                Upload File:
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                    setImportUrl(''); // Clear URL if file is selected
                  }
                }}
                disabled={!!importUrl}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  opacity: importUrl ? 0.5 : 1,
                  cursor: importUrl ? 'not-allowed' : 'pointer'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Accepts: Images (PNG, JPG), PDFs, Screenshots
              </p>
              {importFile && (
                <p style={{ fontSize: '14px', color: '#111827', marginTop: '8px' }}>
                  Selected: {importFile.name}
                </p>
              )}
            </div>
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
                  setImportFile(null);
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
                onClick={() => {
                  if (importFile) {
                    handleImportFromFile();
                  } else if (importUrl.trim()) {
                    handleImportFromUrl();
                  }
                }}
                disabled={importing || (!importUrl.trim() && !importFile)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: (importing || (!importUrl.trim() && !importFile)) ? '#e5e7eb' : '#f97316',
                  color: (importing || (!importUrl.trim() && !importFile)) ? '#9ca3af' : 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (importing || (!importUrl.trim() && !importFile)) ? 'not-allowed' : 'pointer'
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
