'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Check, Plus } from 'lucide-react';

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
  const router = useRouter();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('whole');
  const [saving, setSaving] = useState(false);

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

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      setSaving(true);
      const res = await fetch('/api/grocery/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName }),
      });

      if (res.ok) {
        const data = await res.json();
        setLists((prev) => [...prev, data.list]);
        setSelectedListId(data.list.id);
        setNewListName('');
        setShowNewListModal(false);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedListId) return;

    try {
      setSaving(true);
      const res = await fetch('/api/grocery/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_list_id: selectedListId,
          display_name: newItemName,
          quantity: parseFloat(newItemQuantity),
          unit: newItemUnit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        setNewItemName('');
        setNewItemQuantity('1');
        setNewItemUnit('whole');
        setShowAddItemModal(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title="Groceries">
        <div className="p-4">
          <p className="text-gray-500">Loading grocery lists...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (lists.length === 0) {
    return (
      <AuthenticatedLayout
        title="Groceries"
        action={
          <button
            onClick={() => setShowNewListModal(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        }
      >
        <div className="p-4">
          <p className="text-gray-500">No grocery lists yet.</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Create List
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Groceries"
      action={
        <button
          onClick={() => setShowNewListModal(true)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus size={20} />
        </button>
      }
    >
      <div className="px-4 py-4">
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
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Add Item
          </button>
          <button
            onClick={() => setShowNewListModal(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New List
          </button>
        </div>

        {/* New List Modal */}
        {showNewListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New Grocery List
              </h3>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name (e.g., Weekly Groceries)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewListModal(false);
                    setNewListName('');
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={saving || !newListName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-300"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Item to List
              </h3>
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Item name (e.g., Milk)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="whole">whole</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="can">can</option>
                    <option value="package">package</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setNewItemName('');
                    setNewItemQuantity('1');
                    setNewItemUnit('whole');
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={saving || !newItemName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-gray-300"
                >
                  {saving ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
