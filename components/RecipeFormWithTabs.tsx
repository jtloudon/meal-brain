'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { createClient } from '@/lib/auth/supabase-client';

type RecipeFormMode = 'create' | 'edit';
type TabSection = 'overview' | 'ingredients' | 'directions' | 'notes' | 'photos';

interface RecipeFormProps {
  mode: RecipeFormMode;
  recipeId?: string;
  initialData?: {
    title: string;
    rating: number | null;
    tags: string;
    notes: string;
    instructions: string;
    ingredientsText: string;
    imageUrl: string | null;
    source: string;
    servingSize: string;
    prepTime: string;
    cookTime: string;
    mealType: string | null;
  };
  onSubmit: (data: {
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
  }) => Promise<void>;
}

export default function RecipeFormWithTabs({
  mode,
  recipeId,
  initialData,
  onSubmit,
}: RecipeFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [rating, setRating] = useState<number | null>(initialData?.rating || null);
  const [tags, setTags] = useState(initialData?.tags || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [ingredientsText, setIngredientsText] = useState(initialData?.ingredientsText || '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);

  // Additional recipe metadata fields
  const [source, setSource] = useState(initialData?.source || '');
  const [servingSize, setServingSize] = useState(initialData?.servingSize || '');
  const [prepTime, setPrepTime] = useState(initialData?.prepTime || '');
  const [cookTime, setCookTime] = useState(initialData?.cookTime || '');
  const [mealType, setMealType] = useState<string>(initialData?.mealType || '');

  // Get household ID for photo uploads
  useEffect(() => {
    const getHouseholdId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .single();
        if (data) {
          setHouseholdId(data.household_id);
        }
      }
    };
    getHouseholdId();
  }, []);

  const handleCancel = () => {
    if (mode === 'edit' && recipeId) {
      router.push(`/recipes/${recipeId}`);
    } else {
      router.push('/recipes');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!ingredientsText.trim()) {
        throw new Error('At least one ingredient is required');
      }

      // Check for ingredients that won't parse
      const lines = ingredientsText.split('\n').filter(line => line.trim());
      const failedIngredients: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check if line starts with a number or fraction (has quantity)
        // Allow digits (0-9) or fraction symbols (⅛¼⅓½⅔¾⅞)
        if (!/^[\d⅛¼⅓½⅔¾⅞]/.test(trimmed)) {
          failedIngredients.push(trimmed);
        }
      }

      if (failedIngredients.length > 0) {
        throw new Error(
          `Some ingredients are missing quantities. Please add a number before:\n${failedIngredients.map(ing => `• ${ing}`).join('\n')}\n\nExamples: "1 salmon", "2 cups flour", "½ tsp salt"`
        );
      }

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      await onSubmit({
        title: title.trim(),
        rating,
        tags: tagArray,
        notes: notes.trim(),
        instructions: instructions.trim(),
        ingredientsText: ingredientsText.trim(),
        imageUrl,
        source: source.trim(),
        servingSize: servingSize.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        mealType: mealType || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      setLoading(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? null : star)}
            style={{
              outline: 'none',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <Star
              size={22}
              fill={rating && star <= rating ? '#f97316' : 'none'}
              stroke={rating && star <= rating ? '#f97316' : '#d1d5db'}
              strokeWidth={1}
            />
          </button>
        ))}
      </div>
    );
  };

  const tabs: { id: TabSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'directions', label: 'Directions' },
    { id: 'notes', label: 'Notes' },
    { id: 'photos', label: 'Photos' },
  ];

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f3f4f6',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={handleCancel}
          disabled={loading}
          style={{
            color: '#f97316',
            fontSize: '17px',
            fontWeight: '400',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          {mode === 'create' ? 'New recipe' : 'Edit recipe'}
        </h1>
        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          style={{
            color: '#f97316',
            fontSize: '17px',
            fontWeight: '400',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: (loading || !title.trim()) ? 0.5 : 1
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Error Modal */}
      {error && (
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px',
              marginTop: 0
            }}>
              Ingredient Issue
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: '0 0 20px 0',
              whiteSpace: 'pre-line'
            }}>
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f97316',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0,
              padding: '10px 12px',
              fontSize: '14px',
              fontWeight: '400',
              color: activeTab === tab.id ? 'white' : '#111827',
              backgroundColor: activeTab === tab.id ? '#f97316' : 'transparent',
              border: 'none',
              borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'white' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ padding: '16px' }}>
            {/* Title */}
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Recipe name"
                style={{
                  width: '100%',
                  fontSize: '28px',
                  fontWeight: '400',
                  border: 'none',
                  outline: 'none',
                  padding: '8px 0',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Source */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Source</span>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="URL or notes"
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Tags */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Tags</span>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dinner, vegetarian"
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Serving Size */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Serving size</span>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="Serves 4-6"
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Prep Time */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Prep time</span>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15 mins"
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Cook Time */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Cook time</span>
              <input
                type="text"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30 mins"
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Meal Type */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Meal type</span>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                style={{
                  textAlign: 'right',
                  fontSize: '17px',
                  flex: 1,
                  marginLeft: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: mealType ? '#111827' : '#9ca3af'
                }}
              >
                <option value="">Select...</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Rating */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 0'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '17px' }}>Rating</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
                {renderStarRating()}
              </div>
            </div>
          </div>
        )}

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{
              padding: '12px 16px',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              margin: 0
            }}>
              Enter one ingredient per line (e.g., "¼ cup flour" or "2 tbsp vanilla extract")
            </p>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="¼ cup egg white&#10;⅓ cup flour&#10;2 tbsp vanilla extract"
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '17px',
                fontFamily: 'monospace',
                border: 'none',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>
        )}

        {/* Directions Tab */}
        {activeTab === 'directions' && (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step cooking instructions..."
            style={{
              width: '100%',
              height: '100%',
              padding: '12px 16px',
              fontSize: '17px',
              border: 'none',
              outline: 'none',
              resize: 'none'
            }}
          />
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            style={{
              width: '100%',
              height: '100%',
              padding: '12px 16px',
              fontSize: '17px',
              border: 'none',
              outline: 'none',
              resize: 'none'
            }}
          />
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div style={{ padding: '16px' }}>
            {householdId && (
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageChange={setImageUrl}
                householdId={householdId}
                recipeId={recipeId}
              />
            )}
            {!householdId && (
              <p style={{ textAlign: 'center', color: '#9ca3af' }}>Loading...</p>
            )}
          </div>
        )}
      </div>

      {/* Keyboard Accessory Toolbar */}
      <div style={{
        borderTop: '1px solid #d1d5db',
        backgroundColor: '#e5e7eb',
        padding: '8px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
        {['⅛', '¼', '⅓', '½', '⅔', '¾', '°', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'can'].map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => {
              if (activeTab === 'ingredients') {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const newValue =
                    ingredientsText.substring(0, start) +
                    symbol +
                    ingredientsText.substring(end);
                  setIngredientsText(newValue);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
                    textarea.focus();
                  }, 0);
                }
              }
            }}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              backgroundColor: 'white',
              border: '1px solid #9ca3af',
              borderRadius: '4px',
              fontSize: '15px',
              fontWeight: '400',
              color: '#111827',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
