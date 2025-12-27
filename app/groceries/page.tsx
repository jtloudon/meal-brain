'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface GroceryItem {
  id: string;
  display_name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  ingredient_id: string | null;
}

interface GroceryList {
  id: string;
  name: string;
  created_at: string;
}

export default function GroceriesPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all lists on mount
  useEffect(() => {
    fetchLists();
  }, []);

  // Fetch items when selected list changes
  useEffect(() => {
    if (selectedListId) {
      fetchItems(selectedListId);
    }
  }, [selectedListId]);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/grocery/lists');
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);

        // Auto-select first list if available
        if (data.lists && data.lists.length > 0) {
          setSelectedListId(data.lists[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (listId: string) => {
    try {
      const res = await fetch(`/api/grocery/lists/${listId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const toggleItem = async (itemId: string, currentlyChecked: boolean) => {
    try {
      const res = await fetch('/api/grocery/items/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_item_id: itemId,
          checked: !currentlyChecked,
        }),
      });

      if (res.ok) {
        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, checked: !currentlyChecked } : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Loading grocery lists...</p>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Grocery Lists</h1>
        <p className="text-gray-500">No grocery lists yet.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Create List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* List Selector */}
      <div className="mb-6">
        <label htmlFor="list-selector" className="block text-sm font-medium text-gray-700 mb-2">
          Select List
        </label>
        <select
          id="list-selector"
          value={selectedListId || ''}
          onChange={(e) => setSelectedListId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">This list is empty</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item.id, item.checked)}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-green-600'
                }`}
                aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.display_name}`}
              >
                {item.checked && <Check className="w-4 h-4 text-white" />}
              </button>

              {/* Item Details */}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {item.display_name}
                </p>
                <p className="text-sm text-gray-500">
                  {item.quantity} {item.unit}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Add Item
        </button>
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New List
        </button>
      </div>
    </div>
  );
}
