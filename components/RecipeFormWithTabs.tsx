'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

type RecipeFormMode = 'create' | 'edit';
type TabSection = 'details' | 'ingredients' | 'directions' | 'notes' | 'photos';

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
              size={24}
              fill={rating && star <= rating ? '#f97316' : 'none'}
              stroke={rating && star <= rating ? '#f97316' : '#d1d5db'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    );
  };

  const tabs: { id: TabSection; label: string }[] = [
    { id: 'details', label: 'Overview' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'directions', label: 'Directions' },
    { id: 'notes', label: 'Notes' },
    { id: 'photos', label: 'Photos' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-300">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-orange-500 font-normal text-lg disabled:opacity-50"
        >
          Cancel
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'New recipe' : 'Edit recipe'}
        </h1>
        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="text-orange-500 font-normal text-lg disabled:opacity-50"
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
      <div className="flex bg-white border-b border-gray-300 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-3 font-normal text-base transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-orange-500 rounded-t-lg'
                : 'text-gray-900 bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Overview Tab */}
        {activeTab === 'details' && (
          <div className="p-4 space-y-1">
            {/* Title */}
            <div className="border-b border-gray-200 pb-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full text-2xl font-normal px-0 py-2 border-0 focus:outline-none focus:ring-0"
                placeholder="Recipe name"
              />
            </div>

            {/* Tags */}
            <div className="border-b border-gray-200 py-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-base">Tags</span>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="text-right text-base flex-1 ml-4 border-0 focus:outline-none focus:ring-0 bg-transparent"
                  placeholder="dinner, vegetarian"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="border-b border-gray-200 py-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-base">Rating</span>
                <div className="flex-1 flex justify-end">
                  {renderStarRating()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients Tab */}
        {activeTab === 'ingredients' && (
          <div className="h-full flex flex-col">
            <p className="px-4 pt-3 pb-2 text-sm text-gray-500 bg-gray-50 border-b border-gray-200">
              Enter one ingredient per line (e.g., "¼ cup flour" or "2 tbsp vanilla extract")
            </p>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none text-base"
              placeholder="¼ cup egg white&#10;⅓ cup flour&#10;2 tbsp vanilla extract"
            />
          </div>
        )}

        {/* Directions Tab */}
        {activeTab === 'directions' && (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full h-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none text-base"
            placeholder="Step-by-step cooking instructions..."
          />
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-full px-4 py-3 border-0 focus:outline-none focus:ring-0 resize-none text-base"
            placeholder="Any additional notes..."
          />
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="h-full flex flex-col items-center justify-center">
            <button
              type="button"
              className="text-orange-500 text-lg font-normal"
            >
              + Add photo
            </button>
            <p className="text-sm text-gray-500 mt-2">Photo upload coming soon</p>
          </div>
        )}
      </div>

      {/* Keyboard Accessory Toolbar (Fixed at bottom) */}
      <div className="border-t border-gray-300 bg-gray-200 px-2 py-2 flex gap-2 overflow-x-auto">
        {['⅛', '¼', '⅓', '½', '⅔', '¾', '°', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'can'].map((symbol) => (
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
            className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-400 rounded shadow-sm text-sm font-normal text-gray-900 hover:bg-gray-50 active:bg-gray-100"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
