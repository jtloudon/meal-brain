'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

type RecipeFormMode = 'create' | 'edit';
type TabSection = 'details' | 'ingredients' | 'directions' | 'notes';

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
  };
  onSubmit: (data: {
    title: string;
    rating: number | null;
    tags: string[];
    notes: string;
    instructions: string;
    ingredientsText: string;
    imageUrl: string | null;
  }) => Promise<void>;
}

export default function RecipeFormWithTabs({
  mode,
  recipeId,
  initialData,
  onSubmit,
}: RecipeFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabSection>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [rating, setRating] = useState<number | null>(initialData?.rating || null);
  const [tags, setTags] = useState(initialData?.tags || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [ingredientsText, setIngredientsText] = useState(initialData?.ingredientsText || '');

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
      // Basic validation
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!ingredientsText.trim()) {
        throw new Error('At least one ingredient is required');
      }

      // Parse tags
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
        imageUrl: initialData?.imageUrl || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      setLoading(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? null : star)}
            className="focus:outline-none"
          >
            <Star
              size={28}
              fill={rating && star <= rating ? '#f97316' : 'none'}
              stroke={rating && star <= rating ? '#f97316' : '#d1d5db'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
    );
  };

  const tabs: { id: TabSection; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'directions', label: 'Directions' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-orange-500 font-medium text-base disabled:opacity-50"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {mode === 'create' ? 'New recipe' : 'Edit recipe'}
        </h1>
        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="text-orange-500 font-medium text-base disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-orange-500 border-b-2 border-orange-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Recipe name"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              {renderStarRating()}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="dinner, vegetarian, quick"
              />
              <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>
          </div>
        )}

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              Enter one ingredient per line (e.g., "¼ cup flour" or "2 tbsp vanilla extract")
            </p>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
              placeholder="¼ cup egg white&#10;⅓ cup flour&#10;2 tbsp vanilla extract"
            />
          </div>
        )}

        {/* Directions Tab */}
        {activeTab === 'directions' && (
          <div className="p-4">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Step-by-step cooking instructions..."
            />
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Any additional notes..."
            />
          </div>
        )}
      </div>

      {/* Keyboard Accessory Toolbar (Fixed at bottom) */}
      <div className="border-t border-gray-200 bg-gray-100 px-2 py-2 flex gap-2 overflow-x-auto">
        {['⅛', '¼', '⅓', '½', '⅔', '¾', '°', 'tsp', 'tbsp', 'cup', 'oz', 'lb'].map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => {
              // Insert symbol at cursor position in ingredients textarea
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
                  // Move cursor after inserted symbol
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
                    textarea.focus();
                  }, 0);
                }
              }
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-200"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
