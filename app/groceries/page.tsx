'use client';

// Updated styling to match reference design
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Check, Plus, Pencil, ChevronDown, Trash2, Star } from 'lucide-react';
import { decodeHTML } from '@/lib/utils/decode-html';

interface GroceryItem {
  id: string;
  display_name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  ingredient_id: string | null;
  source_recipe_id: string | null;
  prep_state: string | null;
  category: string;
  notes: string | null;
  recipes?: {
    id: string;
    title: string;
  } | null;
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
  const [defaultListId, setDefaultListId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  const [showInlineAddForm, setShowInlineAddForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('whole');
  const [saving, setSaving] = useState(false);

  // Edit view state
  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState('whole');
  const [editNotes, setEditNotes] = useState('');
  const [editListId, setEditListId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearCheckedConfirm, setShowClearCheckedConfirm] = useState(false);
  const [shoppingCategories, setShoppingCategories] = useState<string[]>([]);
  const [editingListName, setEditingListName] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [showDeleteListConfirm, setShowDeleteListConfirm] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [showCopyToModal, setShowCopyToModal] = useState(false);
  const [copySuccessMessage, setCopySuccessMessage] = useState('');

  // Fetch shopping categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/settings/shopping-categories');
        if (response.ok) {
          const data = await response.json();
          setShoppingCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch shopping categories:', error);
        // Use defaults if fetch fails
        setShoppingCategories([
          'Produce',
          'Meat & Seafood',
          'Dairy & Eggs',
          'Bakery',
          'Frozen',
          'Canned Goods',
          'Condiments & Sauces',
          'Beverages',
          'Snacks & Treats',
          'Pantry',
          'Household',
          'Other',
        ]);
      }
    };
    fetchCategories();
  }, []);

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

        // Fetch user preferences to get default list
        let fetchedDefaultListId = null;
        try {
          const prefsResponse = await fetch('/api/user/preferences');
          if (prefsResponse.ok) {
            const prefs = await prefsResponse.json();
            fetchedDefaultListId = prefs.default_grocery_list_id;
            setDefaultListId(fetchedDefaultListId);
          }
        } catch (prefsError) {
          console.error('Error fetching preferences:', prefsError);
        }

        // Auto-select default list if set, otherwise first list
        if (fetchedDefaultListId && data.lists?.some((list: GroceryList) => list.id === fetchedDefaultListId)) {
          setSelectedListId(fetchedDefaultListId);
        } else if (data.lists && data.lists.length > 0) {
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

  const moveItem = async (itemId: string, targetListId: string) => {
    try {
      const res = await fetch(`/api/grocery/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_list_id: targetListId,
        }),
      });

      if (res.ok) {
        // Remove item from current list
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };


  const handleUpdateItem = async () => {
    if (!editingItem || !editName.trim()) return;

    try {
      setSaving(true);

      // Handle quantity ranges like "1-3" by using the maximum value
      let quantity = parseFloat(editQuantity);
      if (editQuantity.includes('-')) {
        const parts = editQuantity.split('-').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          quantity = Math.max(parts[0], parts[1]); // Use the max value for shopping
        }
      }

      const updateData: any = {
        display_name: editName,
        quantity: quantity,
        unit: editUnit || '',  // Empty string if blank
        category: editCategory,
        notes: editNotes || null,  // NULL if empty
      };

      // If list changed, add grocery_list_id to update
      if (editListId && editListId !== selectedListId) {
        updateData.grocery_list_id = editListId;
      }

      const res = await fetch(`/api/grocery/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        // If list changed, remove from current list
        if (editListId && editListId !== selectedListId) {
          setItems((prev) => prev.filter((item) => item.id !== editingItem.id));
        } else {
          // Update in place
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id
                ? {
                    ...item,
                    display_name: editName,
                    quantity: quantity,
                    unit: editUnit || '',
                    category: editCategory,
                    notes: editNotes || null
                  }
                : item
            )
          );
        }
        setCurrentView('list');
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/grocery/items/${editingItem.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== editingItem.id));
        setCurrentView('list');
        setEditingItem(null);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveListName = async () => {
    if (!selectedListId || !editListName.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/grocery/lists/${selectedListId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editListName.trim() }),
      });

      if (res.ok) {
        const updatedList = await res.json();
        setLists((prev) =>
          prev.map((list) => (list.id === selectedListId ? updatedList : list))
        );
        setEditingListName(false);
      }
    } catch (error) {
      console.error('Error updating list name:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/grocery/lists/${listToDelete}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from lists array
        setLists((prev) => prev.filter((list) => list.id !== listToDelete));

        // If deleting the currently selected list, switch to another list
        if (selectedListId === listToDelete) {
          const remainingLists = lists.filter((list) => list.id !== listToDelete);
          if (remainingLists.length > 0) {
            setSelectedListId(remainingLists[0].id);
          } else {
            setSelectedListId(null);
            setItems([]);
          }
        }

        setShowDeleteListConfirm(false);
        setListToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCheckedItems = async () => {
    const checkedItems = items.filter(item => item.checked);
    if (checkedItems.length === 0) return;

    try {
      setSaving(true);

      // Delete all checked items
      await Promise.all(
        checkedItems.map(item =>
          fetch(`/api/grocery/items/${item.id}`, {
            method: 'DELETE',
          })
        )
      );

      // Update local state to remove checked items
      setItems((prev) => prev.filter((item) => !item.checked));
      setShowClearCheckedConfirm(false);
    } catch (error) {
      console.error('Error clearing checked items:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToList = async (destinationListId: string) => {
    const checkedItems = items.filter(item => item.checked);
    if (checkedItems.length === 0 || !destinationListId) return;

    try {
      setSaving(true);

      // Copy checked items to destination list (unchecked state)
      await Promise.all(
        checkedItems.map(item =>
          fetch('/api/grocery/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grocery_list_id: destinationListId,
              display_name: item.display_name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              checked: false, // Copy as unchecked
            }),
          })
        )
      );

      // Uncheck all source items
      await Promise.all(
        checkedItems.map(item =>
          fetch(`/api/grocery/items/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checked: false }),
          })
        )
      );

      // Update local state
      setItems(prev => prev.map(item => ({ ...item, checked: false })));

      // Show success message
      const destListName = lists.find(l => l.id === destinationListId)?.name || 'list';
      setCopySuccessMessage(`Copied ${checkedItems.length} item${checkedItems.length !== 1 ? 's' : ''} to ${destListName}`);
      setShowCopyToModal(false);

      // Clear message after 3 seconds
      setTimeout(() => setCopySuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error copying items:', error);
    } finally {
      setSaving(false);
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

      // Handle quantity ranges like "1-3" by using the maximum value
      let quantity = parseFloat(newItemQuantity);
      if (newItemQuantity.includes('-')) {
        const parts = newItemQuantity.split('-').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          quantity = Math.max(parts[0], parts[1]); // Use the max value for shopping
        }
      }

      console.log('[Add Item] Parsed quantity:', { original: newItemQuantity, parsed: quantity, isNaN: isNaN(quantity) });

      const res = await fetch('/api/grocery/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grocery_list_id: selectedListId,
          display_name: newItemName,
          quantity: quantity,
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
      <AuthenticatedLayout title="">
        <div className="p-4">
          <p className="text-gray-500">Loading grocery lists...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (lists.length === 0) {
    return (
      <AuthenticatedLayout title="">
        <div style={{ padding: '0 16px' }}>
          {/* Pill-shaped action button */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '16px 0',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => router.push('/groceries/new')}
              style={{
                padding: '6px 10px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              New List
            </button>
          </div>

          <div className="py-8">
            <p className="text-gray-500">No grocery lists yet.</p>
            <button
              onClick={() => setShowNewListModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Create List
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title=""
    >
      <div style={{ padding: '0 16px 80px 16px' }}>
        {/* Pill-shaped action buttons */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '16px 0',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setShowClearCheckedConfirm(true)}
            disabled={!items.some(item => item.checked)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: items.some(item => item.checked) ? '#f97316' : '#f3f4f6',
              color: items.some(item => item.checked) ? 'white' : '#6b7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: items.some(item => item.checked) ? 'pointer' : 'not-allowed',
              flex: 1,
              minWidth: 0
            }}
          >
            Clear Checked
          </button>
          <button
            onClick={() => setShowCopyToModal(true)}
            disabled={!items.some(item => item.checked)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: items.some(item => item.checked) ? '#f97316' : '#f3f4f6',
              color: items.some(item => item.checked) ? 'white' : '#6b7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: items.some(item => item.checked) ? 'pointer' : 'not-allowed',
              flex: 1,
              minWidth: 0
            }}
          >
            Copy to...
          </button>
          <button
            onClick={() => setShowInlineAddForm(!showInlineAddForm)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: showInlineAddForm ? '#f97316' : '#f3f4f6',
              color: showInlineAddForm ? 'white' : '#6b7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0
            }}
          >
            Add Item
          </button>
          <button
            onClick={() => router.push('/groceries/new')}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0
            }}
          >
            New List
          </button>
        </div>

        {/* List Selector - Clickable name with arrow + Edit button */}
        {editingListName ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <input
              type="text"
              value={editListName}
              onChange={(e) => setEditListName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSaveListName();
                if (e.key === 'Escape') setEditingListName(false);
              }}
              autoFocus
              style={{
                flex: 1,
                fontSize: '24px',
                fontWeight: '600',
                padding: '8px 12px',
                border: '2px solid #f97316',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSaveListName}
              disabled={!editListName.trim() || saving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: (!editListName.trim() || saving) ? 0.5 : 1
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingListName(false)}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {/* Check All checkbox */}
            {items.length > 0 && (
              <button
                onClick={() => {
                  const allChecked = items.every(item => item.checked);
                  const newChecked = !allChecked;
                  setItems(prev => prev.map(item => ({ ...item, checked: newChecked })));

                  // Update all items in database
                  items.forEach(async (item) => {
                    await fetch(`/api/grocery/items/${item.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ checked: newChecked }),
                    });
                  });
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '2px solid ' + (items.every(item => item.checked) ? '#f97316' : '#d1d5db'),
                  backgroundColor: items.every(item => item.checked) ? '#f97316' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {items.every(item => item.checked) && (
                  <Check size={18} style={{ color: 'white', strokeWidth: 3 }} />
                )}
              </button>
            )}

            <button
              onClick={() => setShowListSelector(true)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedListId === defaultListId && (
                  <Star size={20} style={{ color: '#f97316', fill: '#f97316' }} />
                )}
                <span style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                  {lists.find(l => l.id === selectedListId)?.name || 'Groceries'}
                </span>
              </div>
              <ChevronDown size={24} style={{ color: '#9ca3af' }} />
            </button>
            <button
              onClick={() => {
                const currentList = lists.find(l => l.id === selectedListId);
                if (currentList) {
                  setEditListName(currentList.name);
                  setEditingListName(true);
                }
              }}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Rename list"
            >
              <Pencil size={20} style={{ color: '#f97316' }} />
            </button>
          </div>
        )}

        {/* Inline Add Item Form */}
        {showInlineAddForm && (
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {/* Quantity and Unit - Top Row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Qty (e.g., 1-3)"
                inputMode="decimal"
                step="0.01"
                style={{
                  width: '80px',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
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

            {/* Item Name - Second Row */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name (e.g., Milk)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowInlineAddForm(false);
                  setNewItemName('');
                  setNewItemQuantity('1');
                  setNewItemUnit('whole');
                }}
                disabled={saving}
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
                  opacity: saving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleAddItem();
                  setShowInlineAddForm(false);
                }}
                disabled={saving || !newItemName.trim()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: (saving || !newItemName.trim()) ? '#e5e7eb' : '#f97316',
                  color: (saving || !newItemName.trim()) ? '#9ca3af' : 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (saving || !newItemName.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !newItemName.trim()) ? 0.5 : 1
                }}
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Items List - Grouped by Category */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">This list is empty</p>
          ) : (
            (() => {
              // Group items by category
              const grouped = items.reduce((acc, item) => {
                const category = item.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(item);
                return acc;
              }, {} as Record<string, GroceryItem[]>);

              // Render each category group
              return Object.entries(grouped).map(([category, categoryItems], index) => (
                <div key={category} className={index > 0 ? 'mt-6' : ''}>
                  {/* Category Header */}
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f97316', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {category}
                  </h3>

                  {/* Items in this category */}
                  <div className="space-y-0">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex"
                        style={{ gap: '12px', alignItems: 'flex-start', paddingTop: '14px', paddingBottom: '14px' }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItem(item.id, item.checked)}
                          style={{
                            flexShrink: 0,
                            width: '20px',
                            height: '20px',
                            borderRadius: '3px',
                            border: item.checked ? 'none' : '1px solid #d1d5db',
                            backgroundColor: item.checked ? '#f97316' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginTop: '1px'
                          }}
                          aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.display_name}`}
                        >
                          {item.checked && <Check style={{ width: '14px', height: '14px', color: 'white', strokeWidth: 3 }} />}
                        </button>

                        {/* Item Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: '15px',
                              lineHeight: '1.4',
                              textDecoration: item.checked ? 'line-through' : 'none',
                              color: item.checked ? '#9ca3af' : '#111827',
                              marginBottom: (item.recipes || item.notes) ? '6px' : '0',
                              margin: 0
                            }}
                          >
                            {item.quantity} {item.unit ? item.unit + ' ' : ''}{decodeHTML(item.display_name)}
                          </p>

                          {/* Recipe source and notes on same line */}
                          {(item.recipes || item.notes) && (
                            <div style={{
                              fontSize: '13px',
                              lineHeight: '1.2',
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              alignItems: 'center'
                            }}>
                              {/* Recipe source link */}
                              {item.recipes && (
                                <a
                                  href={`/recipes/${item.recipes.id}`}
                                  style={{
                                    color: '#f97316',
                                    textDecoration: 'none',
                                    flexShrink: 0
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#d97316'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = '#f97316'}
                                >
                                  {item.recipes.title}
                                </a>
                              )}

                              {/* Notes */}
                              {item.notes && (
                                <>
                                  {item.recipes && <span style={{ color: '#d1d5db' }}>•</span>}
                                  <span style={{
                                    color: '#6b7280',
                                    fontStyle: 'italic',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0
                                  }}>
                                    {item.notes.length > 40 ? item.notes.substring(0, 40) + '...' : item.notes}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditName(item.display_name);
                            setEditCategory(item.category || 'Other');
                            setEditQuantity(item.quantity.toString());
                            setEditUnit(item.unit || '');
                            setEditNotes(item.notes || '');
                            setEditListId(selectedListId);
                            setCurrentView('edit');
                          }}
                          style={{
                            flexShrink: 0,
                            color: '#9ca3af',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            paddingRight: '70px', // Extra padding to avoid Sous Chef button overlap
                            marginTop: '1px',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                          aria-label={`Edit ${item.display_name}`}
                        >
                          <Pencil style={{ width: '20px', height: '20px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          )}
        </div>

        {/* List Selector Modal */}
        {showListSelector && (
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
                Select Grocery List
              </h3>
              <div style={{ marginBottom: '20px' }}>
                {lists.map((list) => (
                  <div
                    key={list.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedListId(list.id);
                        setShowListSelector(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: list.id === selectedListId ? '#f0f9ff' : 'white',
                        border: list.id === selectedListId ? '2px solid #4A90E2' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        color: '#111827',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: list.id === selectedListId ? '600' : '400',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {list.id === defaultListId && (
                        <Star size={16} style={{ color: '#f97316', fill: '#f97316', flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1 }}>{list.name}</span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setSaving(true);
                          const res = await fetch('/api/user/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              default_grocery_list_id: list.id === defaultListId ? null : list.id
                            }),
                          });
                          if (res.ok) {
                            setDefaultListId(list.id === defaultListId ? null : list.id);
                          }
                        } catch (error) {
                          console.error('Error setting default list:', error);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: list.id === defaultListId ? '#fff7ed' : 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={list.id === defaultListId ? 'Remove as default' : 'Set as default'}
                    >
                      <Star
                        size={18}
                        style={{
                          color: '#f97316',
                          fill: list.id === defaultListId ? '#f97316' : 'transparent'
                        }}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDelete(list.id);
                        setShowDeleteListConfirm(true);
                      }}
                      style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete list"
                    >
                      <Trash2 size={18} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowListSelector(false)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

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

        {/* Edit View - Full Screen */}
        {currentView === 'edit' && editingItem && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 50 }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setCurrentView('list')}
                disabled={saving}
                style={{
                  color: '#f97316',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                Edit shopping list item
              </h3>
              <button
                onClick={handleUpdateItem}
                disabled={saving || !editName.trim()}
                style={{
                  color: saving || !editName.trim() ? '#d1d5db' : '#f97316',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: saving || !editName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Item name"
                style={{
                  width: '100%',
                  fontSize: '16px',
                  padding: '12px 0',
                  border: 'none',
                  borderBottom: '1px solid #e5e7eb',
                  outline: 'none'
                }}
              />

              {/* Quantity and Unit */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      fontSize: '16px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Unit
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: '16px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                  >
                    <option value="">(none)</option>
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
                    <option value="jar">jar</option>
                    <option value="bottle">bottle</option>
                    <option value="bag">bag</option>
                    <option value="box">box</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              {/* List Selector */}
              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb',
                marginTop: '16px'
              }}>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                  List
                </label>
                <select
                  value={editListId || ''}
                  onChange={(e) => setEditListId(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '16px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb',
                marginTop: '16px'
              }}>
                <label htmlFor="edit-category" style={{ color: '#9ca3af', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  Category
                </label>
                <select
                  id="edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                >
                  {shoppingCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes Field */}
              <div style={{
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb',
                marginTop: '16px'
              }}>
                <label htmlFor="edit-notes" style={{ color: '#9ca3af', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  Notes (optional)
                </label>
                <textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g., check expiration date, get organic, etc."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    color: '#111827',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                style={{
                  marginTop: '32px',
                  width: '100%',
                  padding: '12px',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Delete item
              </button>
            </div>

            {/* Delete Confirmation Modal */}
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
                    Delete Item?
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '24px'
                  }}>
                    Are you sure you want to delete "{editingItem?.display_name}"? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={saving}
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
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteItem}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      {saving ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Checked Confirmation Modal */}
        {showClearCheckedConfirm && (
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
                Clear Checked Items?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                This will permanently delete all checked items ({items.filter(item => item.checked).length} item{items.filter(item => item.checked).length !== 1 ? 's' : ''}).
                Uncheck any items you want to keep first.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowClearCheckedConfirm(false)}
                  disabled={saving}
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
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCheckedItems}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  {saving ? 'Clearing...' : 'Clear Checked'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete List Confirmation Dialog */}
        {showDeleteListConfirm && (
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
            zIndex: 150,
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
                Delete Grocery List?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                This will permanently delete "{lists.find(l => l.id === listToDelete)?.name}" and all its items. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDeleteListConfirm(false);
                    setListToDelete(null);
                  }}
                  disabled={saving}
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
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteList}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: saving ? 0.5 : 1
                  }}
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Copy To List Modal */}
        {showCopyToModal && (
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
            zIndex: 150,
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
                Copy to List
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                Copy {items.filter(item => item.checked).length} checked item{items.filter(item => item.checked).length !== 1 ? 's' : ''} to:
              </p>

              {/* List of destination lists */}
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '16px'
              }}>
                {lists
                  .filter(list => list.id !== selectedListId)
                  .map(list => (
                    <button
                      key={list.id}
                      onClick={() => handleCopyToList(list.id)}
                      disabled={saving}
                      style={{
                        width: '100%',
                        padding: '12px',
                        textAlign: 'left',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        backgroundColor: 'white',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.5 : 1
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {list.id === defaultListId && (
                          <Star size={16} style={{ color: '#f97316', fill: '#f97316' }} />
                        )}
                        <span style={{ fontWeight: '500' }}>{list.name}</span>
                      </div>
                    </button>
                  ))}
              </div>

              <button
                onClick={() => setShowCopyToModal(false)}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Copy Success Message */}
        {copySuccessMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 200,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {copySuccessMessage}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
